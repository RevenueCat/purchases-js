import type {
  CheckoutFlowErrorEvent,
  CheckoutPaymentFormErrorEvent,
  CheckoutPaymentFormGatewayErrorEvent,
  CheckoutPaymentFormSubmitEvent,
  CheckoutPaymentTaxCalculationEvent,
  CheckoutPurchaseSuccessfulDismissEvent,
  CheckoutPurchaseSuccessfulImpressionEvent,
  CheckoutSessionClosedEvent,
  CheckoutSessionErroredEvent,
  CheckoutSessionFinishedEvent,
  CheckoutSessionStartEvent,
} from "./sdk-events";
import { SDKEventName } from "./sdk-events";
import type { Package, PurchaseOption } from "../entities/offerings";
import type { RedemptionInfo } from "../entities/redemption-info";
import type { BrandingAppearance } from "../entities/branding";
import type { CheckoutPricingResponse } from "../networking/responses/checkout-pricing-response";
import { CheckoutPricingFailedReason } from "../networking/responses/checkout-pricing-response";
import type { TaxCustomerDetails } from "src/stripe/stripe-service";
import { defaultPurchaseMode, type SDKEventPurchaseMode } from "./event";

export function createCheckoutFlowErrorEvent({
  errorCode,
  errorMessage,
  mode = defaultPurchaseMode,
}: {
  mode?: SDKEventPurchaseMode;
  errorCode: string | null;
  errorMessage: string;
}): CheckoutFlowErrorEvent {
  return {
    eventName: SDKEventName.CheckoutFlowError,
    properties: {
      mode,
      errorCode,
      errorMessage,
    },
  };
}

export function createCheckoutPaymentFormErrorEvent({
  errorCode,
  errorMessage,
  mode = defaultPurchaseMode,
}: {
  mode?: SDKEventPurchaseMode;
  errorCode: string | null;
  errorMessage: string;
}): CheckoutPaymentFormErrorEvent {
  return {
    eventName: SDKEventName.CheckoutPaymentFormError,
    properties: {
      mode,
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
  mode = defaultPurchaseMode,
  paywallSessionId = null,
  paywallId = null,
  offeringId = null,
}: {
  appearance: BrandingAppearance | null | undefined;
  rcPackage: Package;
  purchaseOptionToUse: PurchaseOption;
  customerEmail: string | undefined;
  mode?: SDKEventPurchaseMode;
  paywallSessionId?: string | null;
  paywallId?: string | null;
  offeringId?: string | null;
}): CheckoutSessionStartEvent {
  return {
    eventName: SDKEventName.CheckoutSessionStart,
    properties: {
      mode: mode,
      customizationColorButtonsPrimary:
        appearance?.color_buttons_primary ?? null,
      customizationColorAccent: appearance?.color_accent ?? null,
      customizationColorError: appearance?.color_error ?? null,
      customizationColorProductInfoBg:
        appearance?.color_product_info_bg ?? null,
      customizationColorFormBg: appearance?.color_form_bg ?? null,
      customizationColorPageBg: appearance?.color_page_bg ?? null,
      customizationFont: appearance?.font ?? null,
      customizationShapes: appearance?.shapes ?? null,
      customizationShowProductDescription:
        appearance?.show_product_description ?? null,
      productInterval: rcPackage.webBillingProduct.normalPeriodDuration,
      productPrice: rcPackage.webBillingProduct.price.amountMicros,
      productCurrency: rcPackage.webBillingProduct.price.currency,
      selectedProductId: rcPackage.webBillingProduct.identifier,
      selectedPackageId: rcPackage.identifier,
      selectedPurchaseOption: purchaseOptionToUse.id,
      customerEmailProvidedByDeveloper: Boolean(customerEmail),
      paywallSessionId,
      paywallId,
      offeringId,
    },
  };
}

export function createCheckoutSessionEndFinishedEvent({
  redemptionInfo,
  mode = defaultPurchaseMode,
  paywallSessionId = null,
  paywallId = null,
  offeringId = null,
}: {
  mode?: SDKEventPurchaseMode;
  redemptionInfo: RedemptionInfo | null;
  paywallSessionId?: string | null;
  paywallId?: string | null;
  offeringId?: string | null;
}): CheckoutSessionFinishedEvent {
  return {
    eventName: SDKEventName.CheckoutSessionEnd,
    properties: {
      mode: mode,
      outcome: "finished",
      withRedemptionInfo: Boolean(redemptionInfo),
      paywallSessionId,
      paywallId,
      offeringId,
    },
  };
}

export function createCheckoutSessionEndClosedEvent(properties?: {
  mode?: SDKEventPurchaseMode;
  paywallSessionId?: string | null;
  paywallId?: string | null;
  offeringId?: string | null;
}): CheckoutSessionClosedEvent {
  return {
    eventName: SDKEventName.CheckoutSessionEnd,
    properties: {
      mode: properties?.mode ?? defaultPurchaseMode,
      outcome: "closed",
      paywallSessionId: properties?.paywallSessionId ?? null,
      paywallId: properties?.paywallId ?? null,
      offeringId: properties?.offeringId ?? null,
    },
  };
}

export function createCheckoutSessionEndErroredEvent({
  errorCode,
  errorMessage,
  mode = defaultPurchaseMode,
  paywallSessionId = null,
  paywallId = null,
  offeringId = null,
}: {
  mode?: SDKEventPurchaseMode;
  errorCode: string | null;
  errorMessage: string;
  paywallSessionId?: string | null;
  paywallId?: string | null;
  offeringId?: string | null;
}): CheckoutSessionErroredEvent {
  return {
    eventName: SDKEventName.CheckoutSessionEnd,
    properties: {
      mode,
      outcome: "errored",
      errorCode: errorCode,
      errorMessage: errorMessage,
      paywallSessionId,
      paywallId,
      offeringId,
    },
  };
}

export function createCheckoutPaymentTaxCalculationEvent({
  taxCalculation,
  taxCustomerDetails,
  mode = defaultPurchaseMode,
}: {
  mode?: SDKEventPurchaseMode;
  taxCalculation: CheckoutPricingResponse;
  taxCustomerDetails: TaxCustomerDetails | null;
}): CheckoutPaymentTaxCalculationEvent {
  const outcome =
    taxCalculation.failed_reason ===
    CheckoutPricingFailedReason.tax_collection_disabled
      ? "disabled"
      : taxCalculation.failed_reason
        ? "failed"
        : taxCalculation.tax_amount_in_micros === 0
          ? "not-taxed"
          : "taxed";

  const ui_element = taxCustomerDetails === null ? "auto" : "form";

  return {
    eventName: SDKEventName.CheckoutPaymentTaxCalculation,
    properties: {
      mode,
      outcome,
      ui_element,
      tax_inclusive: taxCalculation.tax_inclusive,
      error_code: taxCalculation.failed_reason ?? null,
    },
  };
}

export function createCheckoutPaymentFormSubmitEvent({
  selectedPaymentMethod,
  mode = defaultPurchaseMode,
}: {
  mode?: SDKEventPurchaseMode;
  selectedPaymentMethod: string | null;
}): CheckoutPaymentFormSubmitEvent {
  return {
    eventName: SDKEventName.CheckoutPaymentFormSubmit,
    properties: {
      mode,
      selectedPaymentMethod: selectedPaymentMethod ?? null,
    },
  };
}

export function createCheckoutPaymentGatewayErrorEvent({
  errorCode,
  errorMessage,
  mode = defaultPurchaseMode,
}: {
  mode?: SDKEventPurchaseMode;
  errorCode: string | null;
  errorMessage: string;
}): CheckoutPaymentFormGatewayErrorEvent {
  return {
    eventName: SDKEventName.CheckoutPaymentFormGatewayError,
    properties: {
      mode,
      errorCode: errorCode,
      errorMessage: errorMessage,
    },
  };
}

export function createCheckoutPurchaseSuccessfulDismissEvent(
  uiElement: "go_back_to_app" | "close",
  mode = defaultPurchaseMode,
): CheckoutPurchaseSuccessfulDismissEvent {
  return {
    eventName: SDKEventName.CheckoutPurchaseSuccessfulDismiss,
    properties: {
      mode,
      ui_element: uiElement,
    },
  };
}

export function createCheckoutPurchaseSuccessfulImpressionEvent(
  mode = defaultPurchaseMode,
): CheckoutPurchaseSuccessfulImpressionEvent {
  return {
    eventName: SDKEventName.CheckoutPurchaseSuccessfulImpression,
    properties: {
      mode,
    },
  };
}
