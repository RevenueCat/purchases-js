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
  price_breakdown: SubscriptionChangePriceBreakdownSummary | null;
  estimated_credit_in_micros: number | null;
  email: string;
  payment_method: SubscriptionChangePaymentMethodSummary | null;
  billing_address: SubscriptionChangeBillingAddressSummary | null;
}

export interface SubscriptionChangeConfirmResponse {
  operation_session_id: string;
  change_type: "immediate" | "deferred";
  new_product_id: string;
}
