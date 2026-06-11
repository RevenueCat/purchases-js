import {
  type PurchaseFlowError,
  PurchaseFlowErrorCode,
} from "../helpers/purchase-operation-helper";
import { ErrorCode, getPublicMessage } from "../generated/error-codes";

export { ErrorCode };

export class ErrorCodeUtils {
  // This is the message shown to developers. It is not intended to be displayed to end customers.
  static getPublicMessage(errorCode: ErrorCode): string {
    return getPublicMessage(errorCode);
  }

  static getErrorCodeForBackendErrorCode(
    backendErrorCode: BackendErrorCode,
  ): ErrorCode {
    switch (backendErrorCode) {
      case BackendErrorCode.BackendStoreProblem:
      case BackendErrorCode.BackendPaymentGatewayGenericError:
      case BackendErrorCode.BackendGatewaySetupErrorStripeTaxNotActive:
      case BackendErrorCode.BackendGatewaySetupErrorInvalidTaxOriginAddress:
      case BackendErrorCode.BackendGatewaySetupErrorMissingRequiredPermission:
      case BackendErrorCode.BackendGatewaySetupErrorSandboxModeOnly:
        return ErrorCode.StoreProblemError;
      case BackendErrorCode.BackendCannotTransferPurchase:
        return ErrorCode.ReceiptAlreadyInUseError;
      case BackendErrorCode.BackendInvalidReceiptToken:
        return ErrorCode.InvalidReceiptError;
      case BackendErrorCode.BackendInvalidPlayStoreCredentials:
      case BackendErrorCode.BackendInvalidAuthToken:
      case BackendErrorCode.BackendInvalidAPIKey:
      case BackendErrorCode.BackendInvalidPaddleAPIKey:
        return ErrorCode.InvalidCredentialsError;
      case BackendErrorCode.BackendInvalidPaymentModeOrIntroPriceNotProvided:
      case BackendErrorCode.BackendProductIdForGoogleReceiptNotProvided:
      case BackendErrorCode.BackendOfferNotFound:
      case BackendErrorCode.BackendInvalidOperationSession:
      case BackendErrorCode.BackendPurchaseCannotBeCompleted:
        return ErrorCode.PurchaseInvalidError;
      case BackendErrorCode.BackendAlreadySubscribedError:
        return ErrorCode.ProductAlreadyPurchasedError;
      case BackendErrorCode.BackendEmptyAppUserId:
        return ErrorCode.InvalidAppUserIdError;
      case BackendErrorCode.BackendSubscriberNotFound:
        return ErrorCode.CustomerInfoError;
      case BackendErrorCode.BackendPlayStoreQuotaExceeded:
        return ErrorCode.StoreProblemError;
      case BackendErrorCode.BackendPlayStoreInvalidPackageName:
      case BackendErrorCode.BackendInvalidPlatform:
        return ErrorCode.ConfigurationError;
      case BackendErrorCode.BackendPlayStoreGenericError:
        return ErrorCode.StoreProblemError;
      case BackendErrorCode.BackendUserIneligibleForPromoOffer:
        return ErrorCode.IneligibleError;
      case BackendErrorCode.BackendInvalidSubscriberAttributes:
      case BackendErrorCode.BackendInvalidSubscriberAttributesBody:
        return ErrorCode.InvalidSubscriberAttributesError;
      case BackendErrorCode.BackendInvalidAppStoreSharedSecret:
      case BackendErrorCode.BackendInvalidAppleSubscriptionKey:
      case BackendErrorCode.BackendBadRequest:
      case BackendErrorCode.BackendInternalServerError:
        return ErrorCode.UnexpectedBackendResponseError;
      case BackendErrorCode.BackendProductIDsMalformed:
        return ErrorCode.UnsupportedError;
      case BackendErrorCode.BackendInvalidEmail:
      case BackendErrorCode.BackendNoMXRecordsFound:
      case BackendErrorCode.BackendEmailIsRequired:
        return ErrorCode.InvalidEmailError;
    }
  }

  static convertCodeToBackendErrorCode(code: number): BackendErrorCode | null {
    if (code in BackendErrorCode) {
      return code as BackendErrorCode;
    } else {
      return null;
    }
  }

  static convertPurchaseFlowErrorCodeToErrorCode(
    code: PurchaseFlowErrorCode,
  ): ErrorCode {
    switch (code) {
      case PurchaseFlowErrorCode.ErrorSettingUpPurchase:
        return ErrorCode.StoreProblemError;
      case PurchaseFlowErrorCode.ErrorChargingPayment:
        return ErrorCode.PaymentPendingError;
      case PurchaseFlowErrorCode.NetworkError:
        return ErrorCode.NetworkError;
      case PurchaseFlowErrorCode.MissingEmailError:
        return ErrorCode.PurchaseInvalidError;
      case PurchaseFlowErrorCode.AlreadyPurchasedError:
        return ErrorCode.ProductAlreadyPurchasedError;
      case PurchaseFlowErrorCode.InvalidPaddleAPIKeyError:
        return ErrorCode.InvalidCredentialsError;
      default:
        return ErrorCode.UnknownError;
    }
  }
}

export enum BackendErrorCode {
  BackendInvalidPlatform = 7000,
  BackendInvalidEmail = 7012,
  BackendStoreProblem = 7101,
  BackendCannotTransferPurchase = 7102,
  BackendInvalidReceiptToken = 7103,
  BackendInvalidAppStoreSharedSecret = 7104,
  BackendInvalidPaymentModeOrIntroPriceNotProvided = 7105,
  BackendProductIdForGoogleReceiptNotProvided = 7106,
  BackendInvalidPlayStoreCredentials = 7107,
  BackendInternalServerError = 7110,
  BackendEmptyAppUserId = 7220,
  BackendInvalidAuthToken = 7224,
  BackendInvalidAPIKey = 7225,
  BackendBadRequest = 7226,
  BackendPlayStoreQuotaExceeded = 7229,
  BackendPlayStoreInvalidPackageName = 7230,
  BackendPlayStoreGenericError = 7231,
  BackendUserIneligibleForPromoOffer = 7232,
  BackendInvalidAppleSubscriptionKey = 7234,
  BackendSubscriberNotFound = 7259,
  BackendInvalidSubscriberAttributes = 7263,
  BackendInvalidSubscriberAttributesBody = 7264,
  BackendProductIDsMalformed = 7662,
  BackendAlreadySubscribedError = 7772,
  BackendPaymentGatewayGenericError = 7773,
  BackendOfferNotFound = 7814,
  BackendNoMXRecordsFound = 7834,
  BackendInvalidOperationSession = 7877,
  BackendPurchaseCannotBeCompleted = 7878,
  BackendEmailIsRequired = 7879,
  BackendGatewaySetupErrorStripeTaxNotActive = 7898,
  BackendGatewaySetupErrorInvalidTaxOriginAddress = 7899,
  BackendGatewaySetupErrorMissingRequiredPermission = 7900,
  BackendGatewaySetupErrorSandboxModeOnly = 7901,
  BackendInvalidPaddleAPIKey = 7967,
}

/**
 * Extra information that is available in certain types of errors.
 * @public
 */
export interface PurchasesErrorExtra {
  /**
   * If this is a request error, the HTTP status code of the response.
   */
  readonly statusCode?: number;
  /**
   * If this is a RevenueCat backend error, the error code from the servers.
   */
  readonly backendErrorCode?: number;
}

/**
 * Error class for Purchases SDK. You should handle these errors and react
 * accordingly in your app.
 * @public
 */
export class PurchasesError extends Error {
  /** @internal */
  static getForBackendError(
    backendErrorCode: BackendErrorCode,
    backendErrorMessage: string | null,
  ): PurchasesError {
    const errorCode =
      ErrorCodeUtils.getErrorCodeForBackendErrorCode(backendErrorCode);
    return new PurchasesError(
      errorCode,
      ErrorCodeUtils.getPublicMessage(errorCode),
      backendErrorMessage,
      { backendErrorCode: backendErrorCode },
    );
  }

  /** @internal */
  static getForPurchasesFlowError(
    purchasesFlowError: PurchaseFlowError,
  ): PurchasesError {
    return new PurchasesError(
      ErrorCodeUtils.convertPurchaseFlowErrorCodeToErrorCode(
        purchasesFlowError.errorCode,
      ),
      purchasesFlowError.message,
      purchasesFlowError.underlyingErrorMessage,
    );
  }

  constructor(
    /**
     * Error code for the error. This is useful to appropriately react to
     * different error situations.
     */
    public readonly errorCode: ErrorCode,
    /**
     * Message for the error. This is useful for debugging and logging.
     */
    message?: string,
    /**
     * Underlying error message. This provides more details on the error and
     * can be useful for debugging and logging.
     */
    public readonly underlyingErrorMessage?: string | null,
    /**
     * Contains extra information that is available in certain types of errors.
     */
    public readonly extra?: PurchasesErrorExtra,
  ) {
    super(message);
  }

  toString = (): string => {
    return `PurchasesError(code: ${ErrorCode[this.errorCode]}, message: ${this.message})`;
  };
}

/**
 * Error indicating that the SDK was accessed before it was initialized.
 * @public
 */
export class UninitializedPurchasesError extends Error {
  constructor() {
    super("Purchases must be configured before calling getInstance");
  }
}
