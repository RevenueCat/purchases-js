import type {
  CheckoutSessionFinishedEvent,
  CheckoutSessionClosedEvent,
  CheckoutSessionErroredEvent,
  PurchaseSuccessfulDismissEvent,
} from "./sdk-events";
import {
  TrackedEventName,
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
    eventName: TrackedEventName.SDKInitialized,
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
    eventName: TrackedEventName.BillingEmailEntryError,
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
    eventName: TrackedEventName.CheckoutSessionStart,
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
    eventName: TrackedEventName.CheckoutSessionEnd,
    properties: {
      outcome: "finished",
      withRedemptionInfo: Boolean(redemptionInfo),
    },
  };
}

export function createCheckoutSessionEndClosedEvent(): CheckoutSessionClosedEvent {
  return {
    eventName: TrackedEventName.CheckoutSessionEnd,
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
    eventName: TrackedEventName.CheckoutSessionEnd,
    properties: {
      outcome: "errored",
      errorCode: errorCode,
      errorMessage: errorMessage,
    },
  };
}

export function createPurchaseSuccessfulDismissEvent(
  buttonPressed: "go_back_to_app" | "close",
): PurchaseSuccessfulDismissEvent {
  return {
    eventName: TrackedEventName.PurchaseSuccessfulDismiss,
    properties: {
      buttonPressed: buttonPressed,
    },
  };
}
