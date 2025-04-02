import {
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

export enum TaxCalculationError {
  Pending = "pending",
  InvalidLocation = "invalid_location",
  Disabled = "disabled",
}

export type TaxCalculationResult =
  | {
      error: TaxCalculationError;
      data?: CheckoutCalculateTaxResponse;
    }
  | {
      error?: TaxCalculationError;
      data: CheckoutCalculateTaxResponse;
    };

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
  ): Promise<TaxCalculationResult> {
    const operationSessionId = this.operationSessionId;
    if (!operationSessionId) {
      throw new PurchaseFlowError(
        PurchaseFlowErrorCode.ErrorSettingUpPurchase,
        "No purchase started",
      );
    }

    try {
      const checkoutCalculateTaxResponse =
        await this.backend.postCheckoutCalculateTax(
          operationSessionId,
          countryCode,
          postalCode,
        );
      return {
        error: undefined,
        data: checkoutCalculateTaxResponse,
      };
    } catch (error) {
      if (error instanceof PurchasesError) {
        let calculationError: TaxCalculationError;
        if (error.errorCode === ErrorCode.TaxLocationCannotBeDeterminedError) {
          calculationError = TaxCalculationError.Pending;
        } else if (error.errorCode === ErrorCode.InvalidTaxLocationError) {
          calculationError = TaxCalculationError.InvalidLocation;
        } else if (
          error.errorCode === ErrorCode.TaxCollectionNotEnabledError ||
          (!this.backend.getIsSandbox() &&
            error.errorCode !== ErrorCode.SandboxModeOnlyError)
        ) {
          calculationError = TaxCalculationError.Disabled;
        } else {
          throw PurchaseFlowError.fromPurchasesError(
            error,
            PurchaseFlowErrorCode.ErrorSettingUpPurchase,
          );
        }
        return {
          error: calculationError,
        };
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

  async checkoutComplete(email?: string): Promise<CheckoutCompleteResponse> {
    const operationSessionId = this.operationSessionId;
    if (!operationSessionId) {
      throw new PurchaseFlowError(
        PurchaseFlowErrorCode.ErrorSettingUpPurchase,
        "No purchase started",
      );
    }

    try {
      const checkoutCompleteResponse = await this.backend.postCheckoutComplete(
        operationSessionId,
        email,
      );
      return checkoutCompleteResponse;
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
    operationSessionId: string;
  }> {
    const operationSessionId = this.operationSessionId;
    if (!operationSessionId) {
      throw new PurchaseFlowError(
        PurchaseFlowErrorCode.ErrorSettingUpPurchase,
        "No purchase in progress",
      );
    }

    return new Promise<{
      redemptionInfo: RedemptionInfo | null;
      operationSessionId: string;
    }>((resolve, reject) => {
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
                setTimeout(
                  () => checkForOperationStatus(checkCount + 1),
                  this.waitMSBetweenAttempts,
                );
                break;
              case CheckoutSessionStatus.Succeeded:
                this.clearPurchaseInProgress();
                resolve({
                  redemptionInfo: toRedemptionInfo(operationResponse),
                  operationSessionId: operationSessionId,
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
