import {
  CheckoutStatusErrorCodes,
  type CheckoutStatusError,
} from "../networking/responses/checkout-status-response";
import {
  PurchaseFlowError,
  PurchaseFlowErrorCode,
} from "./purchase-operation-helper";

export function handleCheckoutSessionFailed(
  error: CheckoutStatusError | undefined | null,
  reject: (error: PurchaseFlowError) => void,
): void {
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
