import type { Package } from "../entities/offerings";
import type { PurchaseOption } from "../entities/offerings";
import type { BrandingAppearance } from "../networking/responses/branding-response";
import { VERSION } from "../helpers/constants";

type SDKInitializedEvent = {
  eventName: "sdk_initialized";
  properties: {
    sdkVersion: string;
  };
};

export function createSDKInitializedEvent(): SDKInitializedEvent {
  return {
    eventName: "sdk_initialized",
    properties: {
      sdkVersion: VERSION,
    },
  };
}

type CustomizationOptionsEvent = {
  colorButtonsPrimary: string;
  colorAccent: string;
  colorError: string;
  colorProductInfoBg: string;
  colorFormBg: string;
  colorPageBg: string;
  font: string;
  shapes: string;
  showProductDescription: boolean;
};

export type CheckoutSessionStartEvent = {
  eventName: "checkout_session_start";
  properties: {
    customizationOptions: CustomizationOptionsEvent | null;
    productInterval: string | null;
    productPrice: number;
    productCurrency: string;
    selectedProduct: string;
    selectedPackage: string;
    selectedPurchaseOption: string;
  };
};

export function createCheckoutSessionStartEvent(
  appearance: BrandingAppearance | undefined,
  rcPackage: Package,
  purchaseOptionToUse: PurchaseOption,
): CheckoutSessionStartEvent {
  return {
    eventName: "checkout_session_start",
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
    },
  };
}

type BillingEmailEntryImpressionEvent = {
  eventName: "billing_email_entry_impression";
};

export function createBillingEmailEntryImpressionEvent(): BillingEmailEntryImpressionEvent {
  return {
    eventName: "billing_email_entry_impression",
  };
}

type BillingEmailEntryDismissEvent = {
  eventName: "billing_email_entry_dismiss";
};

export function createBillingEmailEntryDismissEvent(): BillingEmailEntryDismissEvent {
  return {
    eventName: "billing_email_entry_dismiss",
  };
}

type BillingEmailEntrySubmitEvent = {
  eventName: "billing_email_entry_submit";
};

export function createBillingEmailEntrySubmitEvent(): BillingEmailEntrySubmitEvent {
  return {
    eventName: "billing_email_entry_submit",
  };
}

type BillingEmailEntrySuccessEvent = {
  eventName: "billing_email_entry_success";
};

export function createBillingEmailEntrySuccessEvent(): BillingEmailEntrySuccessEvent {
  return {
    eventName: "billing_email_entry_success",
  };
}

type BillingEmailEntryErrorEvent = {
  eventName: "billing_email_entry_error";
  properties: {
    errorCode: number | null;
    errorMessage: string;
  };
};

export function createBillingEmailEntryErrorEvent(
  errorCode: number | null,
  errorMessage: string,
): BillingEmailEntryErrorEvent {
  return {
    eventName: "billing_email_entry_error",
    properties: {
      errorCode: errorCode,
      errorMessage: errorMessage,
    },
  };
}
