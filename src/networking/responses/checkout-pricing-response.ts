import type { StripeElementsConfiguration } from "./stripe-elements";
import type { PriceBreakdown, TaxCalculationStatus } from "../../ui/ui-types";
import type {
  NonSubscriptionOptionResponse,
  SubscriptionOptionResponse,
} from "./products-response";

export interface TaxBreakdown {
  tax_amount_in_micros: number;
  display_name: string;
}

export interface CheckoutAppliedDiscountResponse {
  identifier: string | null;
  display_name: string;
  discounted_amount_in_micros: number;
  percentage: number | null;
  discount_code: string | null;
  duration_mode?: "time_window" | null;
  time_window?: string | null;
}

export type CheckoutPurchaseOptionResponse =
  | NonSubscriptionOptionResponse
  | SubscriptionOptionResponse;

export type CheckoutPurchaseOptionsResponse = Record<
  string,
  CheckoutPurchaseOptionResponse
>;

export enum CheckoutPricingFailedReason {
  tax_collection_disabled = "tax_collection_disabled",
  invalid_tax_location = "invalid_tax_location",
  rate_limit_exceeded = "rate_limit_exceeded",
  missing_required_permission = "missing_required_permission",
  invalid_origin_address = "invalid_origin_address",
  invalid_head_office_address = "invalid_head_office_address",
  taxes_not_active = "taxes_not_active",
  stripe_tax_unsupported_country = "stripe_tax_unsupported_country",
  unexpected_gateway_error = "unexpected_gateway_error",
}

export interface CheckoutPricingResponse {
  operation_session_id: string;
  currency: string;
  total_amount_in_micros: number;
  tax_amount_in_micros: number;
  total_excluding_tax_in_micros: number;
  tax_inclusive: boolean;
  tax_breakdown: TaxBreakdown[];
  gateway_params: {
    elements_configuration: StripeElementsConfiguration;
  };
  failed_reason?: CheckoutPricingFailedReason | string;
  interrupt_checkout?: boolean;
  original_amount_in_micros?: number;
  applied_discounts?: CheckoutAppliedDiscountResponse[];
  selected_purchase_option?: CheckoutPurchaseOptionResponse | null;
}

export function createPriceBreakdownFromCheckoutPricingResponse(
  response: CheckoutPricingResponse,
  taxCalculationStatus: TaxCalculationStatus,
): PriceBreakdown {
  const originalAmountInMicros =
    response.original_amount_in_micros ??
    response.total_excluding_tax_in_micros;
  const appliedDiscounts = response.applied_discounts ?? [];

  return {
    currency: response.currency,
    originalAmountInMicros,
    totalAmountInMicros: response.total_amount_in_micros,
    totalExcludingTaxInMicros: response.total_excluding_tax_in_micros,
    taxCalculationStatus,
    taxAmountInMicros: response.tax_amount_in_micros,
    taxBreakdown: response.tax_breakdown,
    appliedDiscounts: appliedDiscounts.map((discount) => ({
      identifier: discount.identifier,
      displayName: discount.display_name,
      discountedAmountInMicros: discount.discounted_amount_in_micros,
      percentage: discount.percentage,
      discountCode: discount.discount_code,
      durationMode: discount.duration_mode,
      timeWindow: discount.time_window,
    })),
  };
}
