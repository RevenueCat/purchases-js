import type {
  CheckoutSessionFinishedEvent,
  CheckoutSessionClosedEvent,
  CheckoutSessionErroredEvent,
  PurchaseSuccessfulDismissEvent,
  PaymentEntryErrorEvent,
  PaymentEntrySubmitEvent,
} from "./sdk-events";
import {
  SDKEventName,
  type BillingEmailEntryErrorEvent,
  type CheckoutSessionStartEvent,
  type SDKInitializedEvent,
} from "./sdk-events";
import { VERSION } from "../helpers/constants";
import type { BrandingAppearance } from "../networking/responses/branding-response";
import type { Package } from "../entities/offerings";
import type { PurchaseOption } from "../entities/offerings";
import type { RedemptionInfo } from "../entities/redemption-info";

export function createSDKInitializedEvent(): SDKInitializedEvent {
  return {
    eventName: SDKEventName.SDKInitialized,
    properties: {
      sdkVersion: VERSION,
    },
  };
}

export function createBillingEmailEntryErrorEvent(
  errorCode: number | null,
  errorMessage: string,
): BillingEmailEntryErrorEvent {
  return {
    eventName: SDKEventName.BillingEmailEntryError,
    properties: {
      errorCode: errorCode,
      errorMessage: errorMessage,
    },
  };
}

export function createCheckoutSessionStartEvent(
  appearance: BrandingAppearance | undefined,
  rcPackage: Package,
  purchaseOptionToUse: PurchaseOption,
  customerEmail: string | undefined,
): CheckoutSessionStartEvent {
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
      selectedProduct: rcPackage.rcBillingProduct.identifier,
      selectedPackage: rcPackage.identifier,
      selectedPurchaseOption: purchaseOptionToUse.id,
      customerEmailProvidedByDeveloper: Boolean(customerEmail),
    },
  };
}

export function createCheckoutSessionEndFinishedEvent(
  redemptionInfo: RedemptionInfo | null,
): CheckoutSessionFinishedEvent {
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

export function createCheckoutSessionEndErroredEvent(
  errorCode: number | null,
  errorMessage: string,
): CheckoutSessionErroredEvent {
  return {
    eventName: SDKEventName.CheckoutSessionEnd,
    properties: {
      outcome: "errored",
      errorCode: errorCode,
      errorMessage: errorMessage,
    },
  };
}

export function createPaymentEntrySubmitEvent(
  selectedPaymentMethod: string | undefined,
): PaymentEntrySubmitEvent {
  return {
    eventName: SDKEventName.PaymentEntrySubmit,
    properties: {
      selectedPaymentMethod: selectedPaymentMethod ?? null,
    },
  };
}

export function createPaymentEntryErrorEvent(
  stripeErrorCode: string | null,
  stripeErrorMessage: string | null,
): PaymentEntryErrorEvent {
  return {
    eventName: SDKEventName.PaymentEntryError,
    properties: {
      stripeErrorCode: stripeErrorCode,
      stripeErrorMessage: stripeErrorMessage,
    },
  };
}

export function createPurchaseSuccessfulDismissEvent(
  buttonPressed: "go_back_to_app" | "close",
): PurchaseSuccessfulDismissEvent {
  return {
    eventName: SDKEventName.PurchaseSuccessfulDismiss,
    properties: {
      buttonPressed: buttonPressed,
    },
  };
}
