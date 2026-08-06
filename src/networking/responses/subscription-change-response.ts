export interface SubscriptionChangeProductSummary {
  product_id: string;
  display_name: string | null;
  price_in_micros: number;
  currency: string;
}

export interface SubscriptionChangePaymentMethodSummary {
  type: string;
  last_4: string | null;
  brand: string | null;
  exp_month: number | null;
  exp_year: number | null;
}

export interface SubscriptionChangeBillingAddressSummary {
  country_code: string | null;
  postal_code: string | null;
}

export interface SubscriptionChangePriceBreakdownSummary {
  currency: string;
  total_amount_in_micros: number;
  tax_amount_in_micros: number | null;
  total_excluding_tax_in_micros: number;
  original_amount_in_micros: number | null;
}

export interface SubscriptionChangeCheckoutStartResponse {
  operation_session_id: string;
  change_type: "immediate" | "deferred";
  from_product: SubscriptionChangeProductSummary;
  to_product: SubscriptionChangeProductSummary;
  /** Amount due now for immediate upgrades. Null for deferred changes. */
  price_breakdown: SubscriptionChangePriceBreakdownSummary | null;
  /**
   * Estimated next-renewal total for deferred changes (quote-only tax).
   * Null for immediate upgrades.
   */
  estimated_renewal_price: SubscriptionChangePriceBreakdownSummary | null;
  email: string;
  payment_method: SubscriptionChangePaymentMethodSummary | null;
  billing_address: SubscriptionChangeBillingAddressSummary | null;
  checkout_mode?: "subscription_change";
}

export interface SubscriptionChangeConfirmResponse {
  operation_session_id: string;
  change_type: "immediate" | "deferred";
  new_product_id: string;
  checkout_mode?: "subscription_change";
}

export function isSubscriptionChangeCheckoutStartResponse(
  response: unknown,
): response is SubscriptionChangeCheckoutStartResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    "checkout_mode" in response &&
    response.checkout_mode === "subscription_change"
  );
}
