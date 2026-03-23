import { loadScript, type PayPalNamespace } from "@paypal/paypal-js";
import { Logger } from "../helpers/logger";
import { ErrorCode, PurchasesError } from "../entities/errors";
import {
  PurchaseFlowError,
  PurchaseFlowErrorCode,
} from "../helpers/purchase-operation-helper";
import type { Backend } from "../networking/backend";
import type {
  PurchaseOption,
  PresentedOfferingContext,
  PurchaseMetadata,
} from "../main";
import type { CheckoutStatusResponse } from "../networking/responses/checkout-status-response";
import { CheckoutSessionStatus } from "../networking/responses/checkout-status-response";
import { toRedemptionInfo } from "../entities/redemption-info";
import type { OperationSessionSuccessfulResult } from "../helpers/purchase-operation-helper";
import { handleCheckoutSessionFailed } from "../helpers/checkout-error-handler";
import type { PayPalCheckoutStartResponse } from "../networking/responses/checkout-start-response";
import type { IEventsTracker } from "../behavioural-events/events-tracker";

interface PayPalStartCheckoutParams {
  appUserId: string;
  productId: string;
  presentedOfferingContext: PresentedOfferingContext;
  purchaseOption: PurchaseOption;
  customerEmail?: string;
  metadata?: PurchaseMetadata;
}

export interface PayPalPurchaseParams {
  operationSessionId: string;
  orderId: string;
  onButtonsReady: () => void;
  onClose: () => void;
  container: HTMLElement;
}

export class PayPalService {
  private paypalInstance: PayPalNamespace | null = null;
  private readonly backend: Backend;
  private readonly eventsTracker: IEventsTracker;
  private readonly maxNumberAttempts: number;
  private readonly waitMSBetweenAttempts = 1000;

  constructor(
    backend: Backend,
    eventsTracker: IEventsTracker,
    maxNumberAttempts: number = 10,
  ) {
    this.backend = backend;
    this.eventsTracker = eventsTracker;
    this.maxNumberAttempts = maxNumberAttempts;
  }

  async initializePayPal(
    clientId: string,
    isSandbox: boolean,
  ): Promise<PayPalNamespace> {
    if (this.paypalInstance) {
      Logger.debugLog(
        "PayPal already initialized, returning existing instance",
      );
      return this.paypalInstance;
    }

    try {
      const paypalInstance = await loadScript({
        clientId: clientId,
        ...(isSandbox ? { buyerCountry: "US" } : {}),
      });
      if (!paypalInstance) {
        throw new PurchaseFlowError(
          PurchaseFlowErrorCode.UnknownError,
          "PayPal client not found",
        );
      }
      this.paypalInstance = paypalInstance;
      const environment = isSandbox ? "sandbox" : "production";
      Logger.debugLog(`PayPal initialized with environment: ${environment}`);
      return paypalInstance;
    } catch (error) {
      if (error instanceof PurchaseFlowError) {
        throw error;
      }
      throw new PurchaseFlowError(
        PurchaseFlowErrorCode.UnknownError,
        `Error initializing PayPal: ${error}`,
      );
    }
  }

  getPayPalInstance(): PayPalNamespace {
    if (!this.paypalInstance) {
      throw new PurchaseFlowError(
        PurchaseFlowErrorCode.UnknownError,
        "PayPal not initialized.",
      );
    }
    return this.paypalInstance;
  }

  async startCheckout({
    appUserId,
    productId,
    presentedOfferingContext,
    purchaseOption,
    customerEmail,
    metadata,
  }: PayPalStartCheckoutParams): Promise<PayPalCheckoutStartResponse> {
    try {
      const traceId = this.eventsTracker.getTraceId();
      const startResponse =
        await this.backend.postCheckoutStart<PayPalCheckoutStartResponse>(
          appUserId,
          productId,
          presentedOfferingContext,
          purchaseOption,
          traceId,
          customerEmail ?? undefined,
          metadata,
        );

      await this.initializePayPal(
        startResponse.paypal_billing_params.client_id,
        startResponse.paypal_billing_params.is_sandbox,
      );

      return startResponse;
    } catch (error) {
      if (error instanceof PurchasesError) {
        throw PurchaseFlowError.fromPurchasesError(
          error,
          PurchaseFlowErrorCode.ErrorSettingUpPurchase,
          error.errorCode === ErrorCode.InvalidCredentialsError,
        );
      } else {
        throw new PurchaseFlowError(
          PurchaseFlowErrorCode.UnknownError,
          `Error starting PayPal checkout: ${error}`,
        );
      }
    }
  }

  async purchase({
    operationSessionId,
    orderId,
    onButtonsReady,
    onClose,
    container,
  }: PayPalPurchaseParams): Promise<OperationSessionSuccessfulResult> {
    const paypalInstance = this.getPayPalInstance();

    if (!paypalInstance.Buttons) {
      throw new PurchaseFlowError(
        PurchaseFlowErrorCode.UnknownError,
        "PayPal Buttons component not available",
      );
    }

    return new Promise<OperationSessionSuccessfulResult>((resolve, reject) => {
      const buttons = paypalInstance.Buttons!({
        createOrder: () => {
          return Promise.resolve(orderId);
        },
        onApprove: async () => {
          try {
            const checkoutStatus =
              await this.pollOperationStatus(operationSessionId);
            resolve(checkoutStatus);
          } catch (error) {
            if (error instanceof PurchaseFlowError) {
              reject(error);
            } else if (error instanceof PurchasesError) {
              reject(
                PurchaseFlowError.fromPurchasesError(
                  error,
                  PurchaseFlowErrorCode.UnknownError,
                ),
              );
            } else {
              reject(
                new PurchaseFlowError(
                  PurchaseFlowErrorCode.UnknownError,
                  `PayPal approval handler error: ${error}`,
                ),
              );
            }
          }
        },
        onCancel: () => {
          onClose();
        },
        onError: (err: Record<string, unknown>) => {
          reject(
            new PurchaseFlowError(
              PurchaseFlowErrorCode.UnknownError,
              `PayPal checkout error: ${err}`,
            ),
          );
        },
      });

      if (!buttons) {
        reject(
          new PurchaseFlowError(
            PurchaseFlowErrorCode.UnknownError,
            "Failed to create PayPal buttons",
          ),
        );
        return;
      }

      buttons
        .render(container)
        .then(() => {
          onButtonsReady();
        })
        .catch((error: unknown) => {
          reject(
            new PurchaseFlowError(
              PurchaseFlowErrorCode.UnknownError,
              `Failed to render PayPal buttons: ${error}`,
            ),
          );
        });
    });
  }

  private async pollOperationStatus(
    operationSessionId: string | null,
  ): Promise<OperationSessionSuccessfulResult> {
    if (!operationSessionId) {
      throw new PurchaseFlowError(
        PurchaseFlowErrorCode.ErrorSettingUpPurchase,
        "No purchase in progress",
      );
    }

    return new Promise<OperationSessionSuccessfulResult>((resolve, reject) => {
      const checkForOperationStatus = (checkCount = 1) => {
        if (checkCount > this.maxNumberAttempts) {
          reject(
            new PurchaseFlowError(
              PurchaseFlowErrorCode.UnknownError,
              "Max attempts reached trying to get successful purchase status",
            ),
          );
          return;
        }
        this.backend
          .getCheckoutStatus(operationSessionId)
          .then((operationResponse: CheckoutStatusResponse) => {
            const storeTransactionIdentifier =
              operationResponse.operation.store_transaction_identifier;
            const productIdentifier =
              operationResponse.operation.product_identifier;
            const purchaseDate = operationResponse.operation.purchase_date
              ? isNaN(Date.parse(operationResponse.operation.purchase_date))
                ? null
                : new Date(operationResponse.operation.purchase_date)
              : null;
            switch (operationResponse.operation.status) {
              case CheckoutSessionStatus.Started:
              case CheckoutSessionStatus.InProgress:
                setTimeout(
                  () => checkForOperationStatus(checkCount + 1),
                  this.waitMSBetweenAttempts,
                );
                break;
              case CheckoutSessionStatus.Succeeded:
                if (
                  !storeTransactionIdentifier ||
                  !productIdentifier ||
                  !purchaseDate
                ) {
                  reject(
                    new PurchaseFlowError(
                      PurchaseFlowErrorCode.UnknownError,
                      "Missing required fields in operation response.",
                    ),
                  );
                  return;
                }
                resolve({
                  redemptionInfo: toRedemptionInfo(operationResponse),
                  operationSessionId: operationSessionId,
                  storeTransactionIdentifier: storeTransactionIdentifier ?? "",
                  productIdentifier: productIdentifier,
                  purchaseDate: purchaseDate ?? new Date(),
                });
                return;
              case CheckoutSessionStatus.Failed:
                handleCheckoutSessionFailed(
                  operationResponse.operation.error,
                  reject,
                );
            }
          })
          .catch((error) => {
            if (error instanceof PurchasesError) {
              const purchasesError = PurchaseFlowError.fromPurchasesError(
                error,
                PurchaseFlowErrorCode.NetworkError,
              );
              reject(purchasesError);
            } else {
              reject(
                new PurchaseFlowError(
                  PurchaseFlowErrorCode.NetworkError,
                  `Failed to get checkout status: ${error}`,
                ),
              );
            }
          });
      };

      checkForOperationStatus();
    });
  }
}
