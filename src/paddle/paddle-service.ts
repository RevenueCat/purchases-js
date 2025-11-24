import type {
  CheckoutOpenOptions,
  DisplayMode,
  Paddle,
  PaddleEventData,
  Theme,
  Variant,
  Version,
} from "@paddle/paddle-js";
import {
  initializePaddle as initPaddle,
  CheckoutEventNames,
} from "@paddle/paddle-js";
import { Logger } from "../helpers/logger";
import { ErrorCode, PurchasesError } from "../entities/errors";
import {
  PurchaseFlowError,
  PurchaseFlowErrorCode,
} from "../helpers/purchase-operation-helper";
import type { Backend } from "../networking/backend";
import type {
  Package,
  PurchaseOption,
  PresentedOfferingContext,
  PurchaseMetadata,
} from "../main";
import type { CheckoutStatusResponse } from "../networking/responses/checkout-status-response";
import { CheckoutSessionStatus } from "../networking/responses/checkout-status-response";
import { toRedemptionInfo } from "../entities/redemption-info";
import type { OperationSessionSuccessfulResult } from "../helpers/purchase-operation-helper";
import { handleCheckoutSessionFailed } from "../helpers/checkout-error-handler";
import type { PaddleCheckoutStartResponse } from "../networking/responses/checkout-start-response";
import type { IEventsTracker } from "../behavioural-events/events-tracker";

interface PaddlePurchaseParams {
  rcPackage: Package;
  purchaseOption: PurchaseOption;
  appUserId: string;
  presentedOfferingIdentifier: string;
  customerEmail?: string;
  locale?: string;
}

interface PaddlePurchase {
  operationSessionId: string;
  transactionId: string;
  onCheckoutLoaded: () => void;
  params: PaddlePurchaseParams;
  unmountPaddlePurchaseUi: () => void;
}

interface PaddleStartCheckoutParams {
  appUserId: string;
  productId: string;
  presentedOfferingContext: PresentedOfferingContext;
  purchaseOption: PurchaseOption;
  customerEmail?: string;
  metadata?: PurchaseMetadata;
}

export class PaddleService {
  private paddleInstance: Paddle | undefined;
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

  async initializePaddle(token: string, isSandbox: boolean): Promise<Paddle> {
    if (this.paddleInstance?.Initialized) {
      Logger.debugLog(
        "Paddle already initialized, returning existing instance",
      );
      return this.paddleInstance;
    }

    const environment = isSandbox ? "sandbox" : "production";
    try {
      const paddleInstance = await initPaddle({
        token: token,
        version: "v1" as Version,
        environment: environment,
      });
      if (!paddleInstance) {
        throw new PurchaseFlowError(
          PurchaseFlowErrorCode.UnknownError,
          "Paddle client not found",
        );
      }
      this.paddleInstance = paddleInstance;
      Logger.debugLog(`Paddle initialized with environment: ${environment}`);
      return paddleInstance;
    } catch (error) {
      if (error instanceof PurchaseFlowError) {
        throw error;
      }
      throw new PurchaseFlowError(
        PurchaseFlowErrorCode.UnknownError,
        `Error initializing Paddle: ${error}`,
      );
    }
  }

  getPaddleInstance(): Paddle {
    if (!this.paddleInstance?.Initialized) {
      throw new PurchaseFlowError(
        PurchaseFlowErrorCode.UnknownError,
        "Paddle not initialized.",
      );
    }
    return this.paddleInstance;
  }

  async startCheckout({
    appUserId,
    productId,
    presentedOfferingContext,
    purchaseOption,
    customerEmail,
    metadata,
  }: PaddleStartCheckoutParams): Promise<PaddleCheckoutStartResponse> {
    try {
      const traceId = this.eventsTracker.getTraceId();
      const startResponse = (await this.backend.postCheckoutStart(
        appUserId,
        productId,
        presentedOfferingContext,
        purchaseOption,
        traceId,
        customerEmail ?? undefined,
        metadata,
      )) as PaddleCheckoutStartResponse;

      await this.initializePaddle(
        startResponse.paddle_billing_params.client_side_token,
        startResponse.paddle_billing_params.is_sandbox,
      );

      return startResponse;
    } catch (error) {
      if (error instanceof PurchasesError) {
        throw PurchaseFlowError.fromPurchasesError(
          error,
          PurchaseFlowErrorCode.ErrorSettingUpPurchase,
          error.errorCode === ErrorCode.InvalidPaddleAPIKeyError,
        );
      } else {
        throw new PurchaseFlowError(
          PurchaseFlowErrorCode.UnknownError,
          `Error starting Paddle checkout: ${error}`,
        );
      }
    }
  }

  async purchase({
    operationSessionId,
    transactionId,
    onCheckoutLoaded,
    unmountPaddlePurchaseUi,
    params,
  }: PaddlePurchase): Promise<OperationSessionSuccessfulResult> {
    const paddleInstance = this.getPaddleInstance();
    const { customerEmail, locale = "en" } = params;

    return new Promise<OperationSessionSuccessfulResult>((resolve, reject) => {
      paddleInstance.Update({
        eventCallback: async (paddleEventData: PaddleEventData) => {
          const eventName = paddleEventData.name;
          const data = paddleEventData.data;

          try {
            if (eventName === CheckoutEventNames.CHECKOUT_LOADED) {
              onCheckoutLoaded();
            } else if (eventName === CheckoutEventNames.CHECKOUT_COMPLETED) {
              // Close Paddle's success page to show the PaddlePurchaseUi status page
              paddleInstance.Checkout.close();
              const checkoutStatus =
                await this.pollOperationStatus(operationSessionId);

              resolve(checkoutStatus);
            } else if (eventName === CheckoutEventNames.CHECKOUT_CLOSED) {
              // Only unmount PaddlePurchaseUi if the user closes Paddle's checkout modal
              // not when this code calls paddleInstance.Checkout.close()
              const paddleInitiatedCheckoutClosedEvent = !!data?.status;
              if (paddleInitiatedCheckoutClosedEvent) {
                unmountPaddlePurchaseUi();
              }
            }
          } catch (error) {
            paddleInstance.Checkout.close();

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
                  `Paddle event handler error: ${error}`,
                ),
              );
            }
          }
        },
      });

      const checkoutData: CheckoutOpenOptions = {
        transactionId,
        settings: {
          displayMode: "overlay" as DisplayMode,
          theme: "light" as Theme,
          variant: "one-page" as Variant,
          locale: locale,
          allowLogout: false,
          showAddDiscounts: false,
          showAddTaxId: false,
          allowDiscountRemoval: false,
        },
        ...(customerEmail && { customer: { email: customerEmail } }),
      };

      try {
        paddleInstance.Checkout.open(checkoutData);
      } catch (error) {
        reject(
          new PurchaseFlowError(
            PurchaseFlowErrorCode.UnknownError,
            `Failed to open Paddle checkout: ${error}`,
          ),
        );
      }
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
