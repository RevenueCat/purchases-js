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
import type { Package, PurchaseOption } from "../main";
import type { PurchaseMetadata } from "../entities/offerings";
import type { CheckoutStatusResponse } from "../networking/responses/checkout-status-response";
import { CheckoutSessionStatus } from "../networking/responses/checkout-status-response";
import { toRedemptionInfo } from "../entities/redemption-info";
import type { OperationSessionSuccessfulResult } from "../helpers/purchase-operation-helper";
import { handleCheckoutSessionFailed } from "../helpers/checkout-error-handler";

const POLL_INTERVAL_MS = 1000;
const MAX_POLL_ATTEMPTS = 10;

interface PaddlePurchaseParams {
  rcPackage: Package;
  purchaseOption: PurchaseOption;
  appUserId: string;
  presentedOfferingIdentifier: string;
  customerEmail?: string;
  locale?: string;
}

interface PaddlePurchase {
  backend: Backend;
  operationSessionId: string;
  transactionId: string;
  onCheckoutLoaded: () => void;
  params: PaddlePurchaseParams;
  unmountPurchaseUI: () => void;
}

export class PaddleService {
  private static paddleInstance: Paddle | undefined;

  static async initializePaddle(
    token: string,
    isSandbox: boolean,
  ): Promise<Paddle> {
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
        throw new PurchasesError(
          ErrorCode.ConfigurationError,
          "Paddle client not found",
        );
      }
      this.paddleInstance = paddleInstance;
      Logger.debugLog(`Paddle initialized with environment: ${environment}`);
      return paddleInstance;
    } catch (error) {
      const errorMessage = `Error initializing Paddle: ${error}`;
      Logger.errorLog(errorMessage);
      throw new PurchasesError(
        ErrorCode.ConfigurationError,
        errorMessage,
        String(error),
      );
    }
  }

  static getPaddleInstance(): Paddle {
    if (!this.paddleInstance?.Initialized) {
      throw new PurchasesError(
        ErrorCode.ConfigurationError,
        "Paddle not initialized.",
      );
    }
    return this.paddleInstance;
  }

  static async purchase({
    backend,
    operationSessionId,
    transactionId,
    onCheckoutLoaded,
    unmountPurchaseUI,
    params,
  }: PaddlePurchase): Promise<OperationSessionSuccessfulResult> {
    const paddleInstance = this.getPaddleInstance();
    const { appUserId, customerEmail, locale = "en" } = params;

    return new Promise<OperationSessionSuccessfulResult>((resolve, reject) => {
      let customerDefinedEmail: string | null = null;
      let customerId: string | null = null;
      let checkoutSessionId: string | null = null;

      paddleInstance.Update({
        eventCallback: async (paddleEventData: PaddleEventData) => {
          const eventName = paddleEventData.name;
          const data = paddleEventData.data;

          try {
            if (eventName === CheckoutEventNames.CHECKOUT_LOADED) {
              onCheckoutLoaded();
            } else if (
              eventName === CheckoutEventNames.CHECKOUT_CUSTOMER_CREATED
            ) {
              customerDefinedEmail = data?.customer.email ?? null;
              customerId = data?.customer.id ?? null;
              checkoutSessionId = data?.id ?? null;

              if (customerDefinedEmail || customerId) {
                // Update existing operation session with customer info
                try {
                  const metadata: PurchaseMetadata = {
                    checkout_session_id: checkoutSessionId ?? "",
                    customer_id: customerId ?? "",
                  };
                  await backend.patchOperationSession(
                    operationSessionId,
                    appUserId,
                    customerDefinedEmail ?? customerEmail ?? undefined,
                    metadata,
                  );
                } catch (error) {
                  Logger.errorLog(
                    `Paddle operation session update failed: ${error}`,
                  );
                  paddleInstance.Checkout.close();
                  reject(
                    new PurchasesError(
                      ErrorCode.UnknownError,
                      `Operation session update failed: ${error}`,
                      String(error),
                    ),
                  );
                  return;
                }
              }
            } else if (eventName === CheckoutEventNames.CHECKOUT_COMPLETED) {
              paddleInstance.Checkout.close();

              try {
                const result = await this.pollOperationStatus(
                  backend,
                  operationSessionId,
                );
                resolve(result);
              } catch (error) {
                if (error instanceof PurchaseFlowError) {
                  reject(
                    PurchasesError.getForPurchasesFlowError(error) ??
                      new PurchasesError(
                        ErrorCode.UnknownError,
                        error.message ?? "Unknown purchase flow error",
                      ),
                  );
                } else {
                  reject(error);
                }
              }
            } else if (eventName === CheckoutEventNames.CHECKOUT_CLOSED) {
              Logger.debugLog("Paddle checkout closed");
              const paddleInitiatedCheckoutClosedEvent = !!data?.status;
              if (paddleInitiatedCheckoutClosedEvent) {
                unmountPurchaseUI();
              }
            }
          } catch (error) {
            Logger.errorLog(`Paddle event handler error: ${error}`);
            paddleInstance.Checkout.close();
            reject(
              new PurchasesError(
                ErrorCode.UnknownError,
                `Paddle event handler error: ${error}`,
                String(error),
              ),
            );
          }
        },
      });

      // Open the paddle checkout overlay
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
        customData: {
          rc_user_id: appUserId,
        },
        ...(customerEmail && { customer: { email: customerEmail } }),
      };

      try {
        paddleInstance.Checkout.open(checkoutData);
      } catch (error) {
        Logger.errorLog(`Failed to open Paddle checkout: ${error}`);
        reject(
          new PurchasesError(
            ErrorCode.UnknownError,
            `Failed to open Paddle checkout: ${error}`,
            String(error),
          ),
        );
      }
    });
  }

  private static async pollOperationStatus(
    backend: Backend,
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
        if (checkCount > MAX_POLL_ATTEMPTS) {
          reject(
            new PurchaseFlowError(
              PurchaseFlowErrorCode.UnknownError,
              "Max attempts reached trying to get successful purchase status",
            ),
          );
          return;
        }
        backend
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
                  POLL_INTERVAL_MS,
                );
                break;
              case CheckoutSessionStatus.Succeeded:
                if (!productIdentifier) {
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
          .catch((error: PurchasesError) => {
            const purchasesError = PurchaseFlowError.fromPurchasesError(
              error,
              PurchaseFlowErrorCode.NetworkError,
            );
            reject(purchasesError);
          });
      };

      checkForOperationStatus();
    });
  }
}
