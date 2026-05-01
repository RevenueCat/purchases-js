import type { CheckoutPricingResponse } from "../networking/responses/checkout-calculate-tax-response";
import type { PriceBreakdown, TaxCalculationStatus } from "./ui-types";

export function createPriceBreakdownFromCheckoutPricingResponse(
  response: CheckoutPricingResponse,
  taxCalculationStatus: TaxCalculationStatus,
): PriceBreakdown {
  const originalAmountInMicros =
    "original_amount_in_micros" in response
      ? response.original_amount_in_micros
      : response.total_excluding_tax_in_micros;
  const appliedDiscounts =
    "applied_discounts" in response ? response.applied_discounts : [];

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
    })),
  };
}
