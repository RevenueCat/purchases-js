import {
  BackendErrorCode,
  ErrorCode,
  PurchasesError,
  type PurchasesErrorExtra,
} from "../entities/errors";
import { type Backend } from "../networking/backend";
import { type CheckoutStartResponse } from "../networking/responses/checkout-start-response";
import {
  CheckoutSessionStatus,
  type CheckoutStatusError,
  CheckoutStatusErrorCodes,
  type CheckoutStatusResponse,
} from "../networking/responses/checkout-status-response";
import {
  type PresentedOfferingContext,
  type PurchaseMetadata,
  type PurchaseOption,
} from "../entities/offerings";
import { Logger } from "./logger";
import {
  type RedemptionInfo,
  toRedemptionInfo,
} from "../entities/redemption-info";
import { type IEventsTracker } from "../behavioural-events/events-tracker";
import type { CheckoutCompleteResponse } from "../networking/responses/checkout-complete-response";
import type { CheckoutCalculateTaxResponse } from "../networking/responses/checkout-calculate-tax-response";

export enum PurchaseFlowErrorCode {
  ErrorSettingUpPurchase = 0,
  ErrorChargingPayment = 1,
  UnknownError = 2,
  NetworkError = 3,
  MissingEmailError = 4,
  AlreadyPurchasedError = 5,
  StripeTaxNotActive = 6,
  StripeInvalidTaxOriginAddress = 7,
  StripeMissingRequiredPermission = 8,
  PayPalOrderCreationFailed = 9,
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

  getErrorCode(): number {
    return (
      this.extra?.backendErrorCode ?? this.purchasesErrorCode ?? this.errorCode
    );
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
      errorCode =
        PurchaseFlowError.fromBackendErrorCode(e.extra?.backendErrorCode) ??
        defaultFlowErrorCode;
    }

    return new PurchaseFlowError(
      errorCode,
      e.message,
      e.underlyingErrorMessage,
      e.errorCode,
      e.extra,
    );
  }

  static fromBackendErrorCode(
    backendErrorCode: BackendErrorCode | undefined,
  ): PurchaseFlowErrorCode | null {
    switch (backendErrorCode) {
      case BackendErrorCode.BackendGatewaySetupErrorStripeTaxNotActive:
        return PurchaseFlowErrorCode.StripeTaxNotActive;
      case BackendErrorCode.BackendGatewaySetupErrorInvalidTaxOriginAddress:
        return PurchaseFlowErrorCode.StripeInvalidTaxOriginAddress;
      case BackendErrorCode.BackendGatewaySetupErrorMissingRequiredPermission:
        return PurchaseFlowErrorCode.StripeMissingRequiredPermission;
      default:
        return null;
    }
  }
}

export interface OperationSessionSuccessfulResult {
  redemptionInfo: RedemptionInfo | null;
  operationSessionId: string;
  storeTransactionIdentifier: string;
  productIdentifier: string;
  purchaseDate: Date;
}

export interface CheckoutCompleteRequestBody {
  gateway?: "paypal";
  email?: string;
}

export class PurchaseOperationHelper {
  private operationSessionId: string | null = null;
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

  async checkoutStart(
    appUserId: string,
    productId: string,
    purchaseOption: PurchaseOption,
    presentedOfferingContext: PresentedOfferingContext,
    email?: string,
    metadata?: PurchaseMetadata,
  ): Promise<CheckoutStartResponse> {
    try {
      const traceId = this.eventsTracker.getTraceId();

      const checkoutStartResponse = await this.backend.postCheckoutStart(
        appUserId,
        productId,
        presentedOfferingContext,
        purchaseOption,
        traceId,
        email,
        metadata,
      );
      this.operationSessionId = checkoutStartResponse.operation_session_id;
      return checkoutStartResponse;
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

  async checkoutCalculateTax(
    countryCode?: string,
    postalCode?: string,
    signal?: AbortSignal | null,
  ): Promise<CheckoutCalculateTaxResponse> {
    const operationSessionId = this.operationSessionId;
    if (!operationSessionId) {
      throw new PurchaseFlowError(
        PurchaseFlowErrorCode.ErrorSettingUpPurchase,
        "No purchase started",
      );
    }

    try {
      return await this.backend.postCheckoutCalculateTax(
        operationSessionId,
        countryCode,
        postalCode,
        signal,
      );
    } catch (error) {
      if (error instanceof PurchasesError) {
        throw PurchaseFlowError.fromPurchasesError(
          error,
          PurchaseFlowErrorCode.ErrorSettingUpPurchase,
        );
      } else {
        const errorMessage = "Unknown error calculating tax: " + String(error);
        Logger.errorLog(errorMessage);
        throw new PurchaseFlowError(
          PurchaseFlowErrorCode.UnknownError,
          errorMessage,
        );
      }
    }
  }

  async checkoutComplete(
    requestBody?: CheckoutCompleteRequestBody,
  ): Promise<CheckoutCompleteResponse> {
    const operationSessionId = this.operationSessionId;
    if (!operationSessionId) {
      throw new PurchaseFlowError(
        PurchaseFlowErrorCode.ErrorSettingUpPurchase,
        "No purchase started",
      );
    }

    try {
      return await this.backend.postCheckoutComplete(
        operationSessionId,
        requestBody,
      );
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

  async pollCurrentPurchaseForCompletion(): Promise<OperationSessionSuccessfulResult> {
    const operationSessionId = this.operationSessionId;
    if (!operationSessionId) {
      throw new PurchaseFlowError(
        PurchaseFlowErrorCode.ErrorSettingUpPurchase,
        "No purchase in progress",
      );
    }

    return new Promise<OperationSessionSuccessfulResult>((resolve, reject) => {
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
                this.clearPurchaseInProgress();
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
                  storeTransactionIdentifier: storeTransactionIdentifier,
                  productIdentifier: productIdentifier,
                  purchaseDate: purchaseDate,
                });
                return;
              case CheckoutSessionStatus.Failed:
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
    });
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
