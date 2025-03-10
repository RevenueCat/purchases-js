import {
  type PurchaseFlowError,
  PurchaseFlowErrorCode,
} from "../helpers/purchase-operation-helper";

/**
 * Error codes for the Purchases SDK.
 * @public
 */
export enum ErrorCode {
  UnknownError = 0,
  UserCancelledError = 1,
  StoreProblemError = 2,
  PurchaseNotAllowedError = 3,
  PurchaseInvalidError = 4,
  ProductNotAvailableForPurchaseError = 5,
  ProductAlreadyPurchasedError = 6,
  ReceiptAlreadyInUseError = 7,
  InvalidReceiptError = 8,
  MissingReceiptFileError = 9,
  NetworkError = 10,
  InvalidCredentialsError = 11,
  UnexpectedBackendResponseError = 12,
  InvalidAppUserIdError = 14,
  OperationAlreadyInProgressError = 15,
  UnknownBackendError = 16,
  InvalidAppleSubscriptionKeyError = 17,
  IneligibleError = 18,
  InsufficientPermissionsError = 19,
  PaymentPendingError = 20,
  InvalidSubscriberAttributesError = 21,
  LogOutWithAnonymousUserError = 22,
  ConfigurationError = 23,
  UnsupportedError = 24,
  EmptySubscriberAttributesError = 25,
  CustomerInfoError = 28,
  SignatureVerificationError = 36,
  InvalidEmailError = 38,
}

export class ErrorCodeUtils {
  static getPublicMessage(errorCode: ErrorCode): string {
    switch (errorCode) {
      case ErrorCode.UnknownError:
        return "Unknown error.";
      case ErrorCode.UserCancelledError:
        return "Purchase was cancelled.";
      case ErrorCode.StoreProblemError:
        return "There was a problem with the store.";
      case ErrorCode.PurchaseNotAllowedError:
        return "The device or user is not allowed to make the purchase.";
      case ErrorCode.PurchaseInvalidError:
        return "One or more of the arguments provided are invalid.";
      case ErrorCode.ProductNotAvailableForPurchaseError:
        return "The product is not available for purchase.";
      case ErrorCode.ProductAlreadyPurchasedError:
        return "This product is already active for the user.";
      case ErrorCode.ReceiptAlreadyInUseError:
        return "There is already another active subscriber using the same receipt.";
      case ErrorCode.InvalidReceiptError:
        return "The receipt is not valid.";
      case ErrorCode.MissingReceiptFileError:
        return "The receipt is missing.";
      case ErrorCode.NetworkError:
        return "Error performing request. Please check your network connection and try again.";
      case ErrorCode.InvalidCredentialsError:
        return "There was a credentials issue. Check the underlying error for more details.";
      case ErrorCode.UnexpectedBackendResponseError:
        return "Received unexpected response from the backend.";
      case ErrorCode.InvalidAppUserIdError:
        return "The app user id is not valid.";
      case ErrorCode.OperationAlreadyInProgressError:
        return "The operation is already in progress.";
      case ErrorCode.UnknownBackendError:
        return "There was an unknown backend error.";
      case ErrorCode.InvalidAppleSubscriptionKeyError:
        return (
          "Apple Subscription Key is invalid or not present. " +
          "In order to provide subscription offers, you must first generate a subscription key. " +
          "Please see https://docs.revenuecat.com/docs/ios-subscription-offers for more info."
        );
      case ErrorCode.IneligibleError:
        return "The User is ineligible for that action.";
      case ErrorCode.InsufficientPermissionsError:
        return "App does not have sufficient permissions to make purchases.";
      case ErrorCode.PaymentPendingError:
        return "The payment is pending.";
      case ErrorCode.InvalidSubscriberAttributesError:
        return "One or more of the attributes sent could not be saved.";
      case ErrorCode.LogOutWithAnonymousUserError:
        return "Called logOut but the current user is anonymous.";
      case ErrorCode.ConfigurationError:
        return "There is an issue with your configuration. Check the underlying error for more details.";
      case ErrorCode.UnsupportedError:
        return (
          "There was a problem with the operation. Looks like we doesn't support " +
          "that yet. Check the underlying error for more details."
        );
      case ErrorCode.EmptySubscriberAttributesError:
        return "A request for subscriber attributes returned none.";
      case ErrorCode.CustomerInfoError:
        return "There was a problem related to the customer info.";
      case ErrorCode.SignatureVerificationError:
        return "Request failed signature verification. Please see https://rev.cat/trusted-entitlements for more info.";
      case ErrorCode.InvalidEmailError:
        return "Email is not valid. Please provide a valid email address.";
    }
  }

  static getErrorCodeForBackendErrorCode(
    backendErrorCode: BackendErrorCode,
  ): ErrorCode {
    switch (backendErrorCode) {
      case BackendErrorCode.BackendStoreProblem:
      case BackendErrorCode.BackendPaymentGatewayGenericError:
        return ErrorCode.StoreProblemError;
      case BackendErrorCode.BackendCannotTransferPurchase:
        return ErrorCode.ReceiptAlreadyInUseError;
      case BackendErrorCode.BackendInvalidReceiptToken:
        return ErrorCode.InvalidReceiptError;
      case BackendErrorCode.BackendInvalidPlayStoreCredentials:
      case BackendErrorCode.BackendInvalidAuthToken:
      case BackendErrorCode.BackendInvalidAPIKey:
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
      case PurchaseFlowErrorCode.UnknownError:
        return ErrorCode.UnknownError;
      case PurchaseFlowErrorCode.AlreadyPurchasedError:
        return ErrorCode.ProductAlreadyPurchasedError;
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
