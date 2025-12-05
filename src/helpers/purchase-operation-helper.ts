import {
  BackendErrorCode,
  ErrorCode,
  PurchasesError,
  type PurchasesErrorExtra,
} from "../entities/errors";
import { type Backend } from "../networking/backend";
import type { WebBillingCheckoutStartResponse } from "../networking/responses/checkout-start-response";
import {
  CheckoutSessionStatus,
  type CheckoutStatusResponse,
} from "../networking/responses/checkout-status-response";
import {
  type PresentedOfferingContext,
  type PurchaseMetadata,
  type PurchaseOption,
} from "../entities/offerings";
import type { WorkflowPurchaseContext } from "../entities/purchase-params";
import { Logger } from "./logger";
import {
  type RedemptionInfo,
  toRedemptionInfo,
} from "../entities/redemption-info";
import { type IEventsTracker } from "../behavioural-events/events-tracker";
import type { CheckoutCompleteResponse } from "../networking/responses/checkout-complete-response";
import type { CheckoutCalculateTaxResponse } from "../networking/responses/checkout-calculate-tax-response";
import { handleCheckoutSessionFailed } from "./checkout-error-handler";

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
  InvalidPaddleAPIKeyError = 9,
}

export class PurchaseFlowError extends Error {
  constructor(
    public readonly errorCode: PurchaseFlowErrorCode,
    message?: string,
    public readonly underlyingErrorMessage?: string | null,
    public readonly purchasesErrorCode?: ErrorCode,
    public readonly extra?: PurchasesErrorExtra,
    public readonly displayPurchaseFlowErrorCode?: boolean,
  ) {
    super(message);
  }

  getErrorCode(): number {
    const additionalErrorCode =
      this.extra?.backendErrorCode ?? this.purchasesErrorCode;
    if (this.displayPurchaseFlowErrorCode) {
      return this.errorCode ?? additionalErrorCode;
    }
    return additionalErrorCode ?? this.errorCode;
  }

  static fromPurchasesError(
    e: PurchasesError,
    defaultFlowErrorCode: PurchaseFlowErrorCode,
    displayPurchaseFlowErrorCode: boolean = false,
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
      displayPurchaseFlowErrorCode,
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
      case BackendErrorCode.BackendInvalidPaddleAPIKey:
        return PurchaseFlowErrorCode.InvalidPaddleAPIKeyError;
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
    workflowPurchaseContext?: WorkflowPurchaseContext,
  ): Promise<WebBillingCheckoutStartResponse> {
    try {
      const traceId = this.eventsTracker.getTraceId();
      const stepId = workflowPurchaseContext?.stepId;

      const checkoutStartResponse =
        await this.backend.postCheckoutStart<WebBillingCheckoutStartResponse>(
          appUserId,
          productId,
          presentedOfferingContext,
          purchaseOption,
          traceId,
          email,
          metadata,
          stepId,
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

  async checkoutComplete(email?: string): Promise<CheckoutCompleteResponse> {
    const operationSessionId = this.operationSessionId;
    if (!operationSessionId) {
      throw new PurchaseFlowError(
        PurchaseFlowErrorCode.ErrorSettingUpPurchase,
        "No purchase started",
      );
    }

    try {
      return await this.backend.postCheckoutComplete(operationSessionId, email);
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

  private clearPurchaseInProgress() {
    this.operationSessionId = null;
  }
}
