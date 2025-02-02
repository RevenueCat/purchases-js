import {
  TrackedEventName,
  type BillingEmailEntryErrorEvent,
  type CheckoutSessionStartEvent,
  type SDKInitializedEvent,
} from "./tracked-events";
import { VERSION } from "../helpers/constants";
import type { BrandingAppearance } from "../networking/responses/branding-response";
import type { Package } from "../entities/offerings";
import type { PurchaseOption } from "../entities/offerings";

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
