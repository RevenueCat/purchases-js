import type {
  CheckoutFlowErrorEvent,
  CheckoutSessionFinishedEvent,
  CheckoutSessionClosedEvent,
  CheckoutSessionErroredEvent,
  CheckoutPurchaseSuccessfulDismissEvent,
  CheckoutPaymentFormGatewayErrorEvent,
  CheckoutPaymentFormSubmitEvent,
} from "./sdk-events";
import {
  SDKEventName,
  type CheckoutBillingFormErrorEvent,
  type CheckoutSessionStartEvent,
} from "./sdk-events";
import type { BrandingAppearance } from "../networking/responses/branding-response";
import type { Package } from "../entities/offerings";
import type { PurchaseOption } from "../entities/offerings";
import type { RedemptionInfo } from "../entities/redemption-info";

export function createCheckoutFlowErrorEvent({
  errorCode,
  errorMessage,
}: {
  errorCode: string | null;
  errorMessage: string;
}): CheckoutFlowErrorEvent {
  return {
    eventName: SDKEventName.CheckoutFlowError,
    properties: {
      errorCode,
      errorMessage,
    },
  };
}

export function createCheckoutBillingFormErrorEvent({
  errorCode,
  errorMessage,
}: {
  errorCode: string | null;
  errorMessage: string;
}): CheckoutBillingFormErrorEvent {
  return {
    eventName: SDKEventName.CheckoutBillingFormError,
    properties: {
      errorCode: errorCode,
      errorMessage: errorMessage,
    },
  };
}

export function createCheckoutSessionStartEvent({
  appearance,
  rcPackage,
  purchaseOptionToUse,
  customerEmail,
}: {
  appearance: BrandingAppearance | undefined;
  rcPackage: Package;
  purchaseOptionToUse: PurchaseOption;
  customerEmail: string | undefined;
}): CheckoutSessionStartEvent {
  return {
    eventName: SDKEventName.CheckoutSessionStart,
    properties: {
      customizationOptions: appearance
        ? {
            colorButtonsPrimary: appearance.color_buttons_primary,
            colorAccent: appearance.color_accent,
            colorError: appearance.color_error,
            colorProductInfoBg: appearance.color_product_info_bg,
            colorFormBg: appearance.color_form_bg,
            colorPageBg: appearance.color_page_bg,
            font: appearance.font,
            shapes: appearance.shapes,
            showProductDescription: appearance.show_product_description,
          }
        : null,
      productInterval: rcPackage.rcBillingProduct.normalPeriodDuration,
      productPrice: rcPackage.rcBillingProduct.currentPrice.amountMicros,
      productCurrency: rcPackage.rcBillingProduct.currentPrice.currency,
      selectedProductId: rcPackage.rcBillingProduct.identifier,
      selectedPackageId: rcPackage.identifier,
      selectedPurchaseOption: purchaseOptionToUse.id,
      customerEmailProvidedByDeveloper: Boolean(customerEmail),
    },
  };
}

export function createCheckoutSessionEndFinishedEvent({
  redemptionInfo,
}: {
  redemptionInfo: RedemptionInfo | null;
}): CheckoutSessionFinishedEvent {
  return {
    eventName: SDKEventName.CheckoutSessionEnd,
    properties: {
      outcome: "finished",
      withRedemptionInfo: Boolean(redemptionInfo),
    },
  };
}

export function createCheckoutSessionEndClosedEvent(): CheckoutSessionClosedEvent {
  return {
    eventName: SDKEventName.CheckoutSessionEnd,
    properties: {
      outcome: "closed",
    },
  };
}

export function createCheckoutSessionEndErroredEvent({
  errorCode,
  errorMessage,
}: {
  errorCode: string | null;
  errorMessage: string;
}): CheckoutSessionErroredEvent {
  return {
    eventName: SDKEventName.CheckoutSessionEnd,
    properties: {
      outcome: "errored",
      errorCode: errorCode,
      errorMessage: errorMessage,
    },
  };
}

export function createCheckoutPaymentFormSubmitEvent({
  selectedPaymentMethod,
}: {
  selectedPaymentMethod: string | null;
}): CheckoutPaymentFormSubmitEvent {
  return {
    eventName: SDKEventName.CheckoutPaymentFormSubmit,
    properties: {
      selectedPaymentMethod: selectedPaymentMethod ?? null,
    },
  };
}

export function createCheckoutPaymentGatewayErrorEvent({
  errorCode,
  errorMessage,
}: {
  errorCode: string | null;
  errorMessage: string;
}): CheckoutPaymentFormGatewayErrorEvent {
  return {
    eventName: SDKEventName.CheckoutPaymentFormGatewayError,
    properties: {
      errorCode: errorCode,
      errorMessage: errorMessage,
    },
  };
}

export function createCheckoutPurchaseSuccessfulDismissEvent(
  uiElement: "go_back_to_app" | "close",
): CheckoutPurchaseSuccessfulDismissEvent {
  return {
    eventName: SDKEventName.CheckoutPurchaseSuccessfulDismiss,
    properties: {
      ui_element: uiElement,
    },
  };
}
