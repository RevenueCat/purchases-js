import {
  ErrorCode,
  PurchasesError,
  type PurchasesErrorExtra,
} from "../entities/errors";
import { type Backend } from "../networking/backend";
import { type PurchaseResponse } from "../networking/responses/purchase-response";
import {
  CheckoutSessionStatus,
  type CheckoutStatusError,
  CheckoutStatusErrorCodes,
  type CheckoutStatusResponse,
} from "../networking/responses/checkout-status-response";
import {
  type PresentedOfferingContext,
  type Product,
  ProductType,
  type PurchaseOption,
} from "../entities/offerings";
import { Logger } from "./logger";
import {
  type RedemptionInfo,
  toRedemptionInfo,
} from "../entities/redemption-info";

export enum PurchaseFlowErrorCode {
  ErrorSettingUpPurchase = 0,
  ErrorChargingPayment = 1,
  UnknownError = 2,
  NetworkError = 3,
  MissingEmailError = 4,
  AlreadyPurchasedError = 5,
}

export class PurchaseFlowError extends Error {
  constructor(
    public readonly errorCode: PurchaseFlowErrorCode,
    message?: string,
    public readonly underlyingErrorMessage?: string | null,
    public readonly purchasesErrorCode?: ErrorCode,
    public readonly extra?: PurchasesErrorExtra,
  ) {
    super(message);
  }

  isRecoverable(): boolean {
    switch (this.errorCode) {
      case PurchaseFlowErrorCode.NetworkError:
      case PurchaseFlowErrorCode.MissingEmailError:
        return true;
      case PurchaseFlowErrorCode.ErrorSettingUpPurchase:
      case PurchaseFlowErrorCode.ErrorChargingPayment:
      case PurchaseFlowErrorCode.AlreadyPurchasedError:
      case PurchaseFlowErrorCode.UnknownError:
        return false;
    }
  }

  getErrorCode(): number {
    return (
      this.extra?.backendErrorCode ?? this.purchasesErrorCode ?? this.errorCode
    );
  }

  getPublicErrorMessage(productDetails: Product | null): string {
    const errorCode =
      this.extra?.backendErrorCode ?? this.purchasesErrorCode ?? this.errorCode;
    switch (this.errorCode) {
      // TODO: Localize these messages
      case PurchaseFlowErrorCode.UnknownError:
        return `An unknown error occurred. Error code: ${errorCode}.`;
      case PurchaseFlowErrorCode.ErrorSettingUpPurchase:
        return `Purchase not started due to an error. Error code: ${errorCode}.`;
      case PurchaseFlowErrorCode.ErrorChargingPayment:
        return "Payment failed.";
      case PurchaseFlowErrorCode.NetworkError:
        return "Network error. Please check your internet connection.";
      case PurchaseFlowErrorCode.MissingEmailError:
        return "Email is required to complete the purchase.";
      case PurchaseFlowErrorCode.AlreadyPurchasedError:
        if (productDetails?.productType === ProductType.Subscription) {
          return "You are already subscribed to this product.";
        } else {
          return "You have already purchased this product.";
        }
    }
  }

  static fromPurchasesError(
    e: PurchasesError,
    defaultFlowErrorCode: PurchaseFlowErrorCode,
  ): PurchaseFlowError {
    let errorCode: PurchaseFlowErrorCode;
    if (e.errorCode === ErrorCode.ProductAlreadyPurchasedError) {
      errorCode = PurchaseFlowErrorCode.AlreadyPurchasedError;
    } else if (e.errorCode === ErrorCode.InvalidEmailError) {
      errorCode = PurchaseFlowErrorCode.MissingEmailError;
    } else if (e.errorCode === ErrorCode.NetworkError) {
      errorCode = PurchaseFlowErrorCode.NetworkError;
    } else {
      errorCode = defaultFlowErrorCode;
    }

    return new PurchaseFlowError(
      errorCode,
      e.message,
      e.underlyingErrorMessage,
      e.errorCode,
      e.extra,
    );
  }
}

export class PurchaseOperationHelper {
  private operationSessionId: string | null = null;
  private readonly backend: Backend;
  private readonly maxNumberAttempts: number;
  private readonly waitMSBetweenAttempts = 1000;

  constructor(backend: Backend, maxNumberAttempts: number = 10) {
    this.backend = backend;
    this.maxNumberAttempts = maxNumberAttempts;
  }

  async startPurchase(
    appUserId: string,
    productId: string,
    purchaseOption: PurchaseOption,
    email: string,
    presentedOfferingContext: PresentedOfferingContext,
  ): Promise<PurchaseResponse> {
    try {
      const subscribeResponse = await this.backend.postPurchase(
        appUserId,
        productId,
        email,
        presentedOfferingContext,
        purchaseOption,
      );
      this.operationSessionId = subscribeResponse.operation_session_id;
      return subscribeResponse;
    } catch (error) {
      if (error instanceof PurchasesError) {
        throw PurchaseFlowError.fromPurchasesError(
          error,
          PurchaseFlowErrorCode.ErrorSettingUpPurchase,
        );
      } else {
        const errorMessage =
          "Unknown error starting purchase: " + String(error);
        Logger.errorLog(errorMessage);
        throw new PurchaseFlowError(
          PurchaseFlowErrorCode.UnknownError,
          errorMessage,
        );
      }
    }
  }

  async pollCurrentPurchaseForCompletion(): Promise<{
    redemptionInfo: RedemptionInfo | null;
  }> {
    const operationSessionId = this.operationSessionId;
    if (!operationSessionId) {
      throw new PurchaseFlowError(
        PurchaseFlowErrorCode.ErrorSettingUpPurchase,
        "No purchase in progress",
      );
    }

    return new Promise<{ redemptionInfo: RedemptionInfo | null }>(
      (resolve, reject) => {
        const scheduleNextAttempt = (checkCount: number) => {
          setTimeout(
            () => checkForOperationStatus(checkCount + 1),
            this.waitMSBetweenAttempts,
          );
        };

        const checkForOperationStatus = (checkCount = 1) => {
          if (checkCount > this.maxNumberAttempts) {
            this.clearPurchaseInProgress();
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
              switch (operationResponse.operation.status) {
                case CheckoutSessionStatus.Started:
                case CheckoutSessionStatus.InProgress:
                  scheduleNextAttempt(checkCount);
                  break;
                case CheckoutSessionStatus.Succeeded:
                  this.clearPurchaseInProgress();
                  resolve({
                    redemptionInfo: toRedemptionInfo(operationResponse),
                  });
                  return;
                case CheckoutSessionStatus.Failed:
                  const errorCode = operationResponse.operation.error?.code;
                  if (
                    errorCode ===
                    CheckoutStatusErrorCodes.SetupIntentCompletionFailed
                  ) {
                    scheduleNextAttempt(checkCount);
                    break;
                  }

                  this.clearPurchaseInProgress();
                  this.handlePaymentError(
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
      },
    );
  }

  private clearPurchaseInProgress() {
    this.operationSessionId = null;
  }

  private handlePaymentError(
    error: CheckoutStatusError | undefined | null,
    reject: (error: PurchaseFlowError) => void,
  ) {
    if (error === null || error === undefined) {
      reject(
        new PurchaseFlowError(
          PurchaseFlowErrorCode.UnknownError,
          "Got an error status but error field is empty.",
        ),
      );
      return;
    }
    switch (error.code) {
      case CheckoutStatusErrorCodes.SetupIntentCreationFailed:
        reject(
          new PurchaseFlowError(
            PurchaseFlowErrorCode.ErrorSettingUpPurchase,
            "Setup intent creation failed",
          ),
        );
        return;
      case CheckoutStatusErrorCodes.PaymentMethodCreationFailed:
        reject(
          new PurchaseFlowError(
            PurchaseFlowErrorCode.ErrorSettingUpPurchase,
            "Payment method creation failed",
          ),
        );
        return;
      case CheckoutStatusErrorCodes.PaymentChargeFailed:
        reject(
          new PurchaseFlowError(
            PurchaseFlowErrorCode.ErrorChargingPayment,
            "Payment charge failed",
          ),
        );
        return;
      case CheckoutStatusErrorCodes.SetupIntentCompletionFailed:
        reject(
          new PurchaseFlowError(
            PurchaseFlowErrorCode.ErrorSettingUpPurchase,
            "Setup intent completion failed",
          ),
        );
        return;
      case CheckoutStatusErrorCodes.AlreadyPurchased:
        reject(
          new PurchaseFlowError(
            PurchaseFlowErrorCode.AlreadyPurchasedError,
            "Purchased was already completed",
          ),
        );
        return;
      default:
        reject(
          new PurchaseFlowError(
            PurchaseFlowErrorCode.UnknownError,
            "Unknown error code received",
          ),
        );
        return;
    }
  }
}
