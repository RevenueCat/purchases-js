import type {
  CheckoutFlowErrorEvent,
  CheckoutSessionFinishedEvent,
  CheckoutSessionClosedEvent,
  CheckoutSessionErroredEvent,
  CheckoutPurchaseSuccessfulDismissEvent,
  CheckoutPaymentFormGatewayErrorEvent,
  CheckoutPaymentFormSubmitEvent,
  CheckoutPaymentFormErrorEvent,
  CheckoutSessionStartEvent,
  CheckoutPaymentTaxCalculationEvent,
} from "./sdk-events";
import { SDKEventName } from "./sdk-events";
import type { Package } from "../entities/offerings";
import type { PurchaseOption } from "../entities/offerings";
import type { RedemptionInfo } from "../entities/redemption-info";
import type { BrandingAppearance } from "../entities/branding";
import { CheckoutCalculateTaxFailedReason } from "../networking/responses/checkout-calculate-tax-response";
import type { CheckoutCalculateTaxResponse } from "../networking/responses/checkout-calculate-tax-response";
import type { TaxCustomerDetails } from "src/stripe/stripe-service";

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

export function createCheckoutPaymentFormErrorEvent({
  errorCode,
  errorMessage,
}: {
  errorCode: string | null;
  errorMessage: string;
}): CheckoutPaymentFormErrorEvent {
  return {
    eventName: SDKEventName.CheckoutPaymentFormError,
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
  appearance: BrandingAppearance | null | undefined;
  rcPackage: Package;
  purchaseOptionToUse: PurchaseOption;
  customerEmail: string | undefined;
}): CheckoutSessionStartEvent {
  return {
    eventName: SDKEventName.CheckoutSessionStart,
    properties: {
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
      productPrice: rcPackage.webBillingProduct.currentPrice.amountMicros,
      productCurrency: rcPackage.webBillingProduct.currentPrice.currency,
      selectedProductId: rcPackage.webBillingProduct.identifier,
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

export function createCheckoutPaymentTaxCalculationEvent({
  taxCalculation,
  taxCustomerDetails,
}: {
  taxCalculation: CheckoutCalculateTaxResponse;
  taxCustomerDetails: TaxCustomerDetails | null;
}): CheckoutPaymentTaxCalculationEvent {
  const outcome =
    taxCalculation.failed_reason ===
    CheckoutCalculateTaxFailedReason.tax_collection_disabled
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
      outcome,
      ui_element,
      tax_inclusive: taxCalculation.tax_inclusive,
      error_code: taxCalculation.failed_reason ?? null,
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
