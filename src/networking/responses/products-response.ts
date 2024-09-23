export interface PriceResponse {
  amount_micros: number;
  currency: string;
}

export interface PricingPhaseResponse {
  period_duration: string | null;
  price: PriceResponse | null;
  cycle_count: number;
}

export interface PurchaseOptionResponse {
  id: string;
  price_id: string;
}

export interface SubscriptionOptionResponse extends PurchaseOptionResponse {
  base: PricingPhaseResponse | null;
  trial: PricingPhaseResponse | null;
}

export interface NonRenewableOptionResponse extends PurchaseOptionResponse {
  base_price: PriceResponse;
}

export interface ProductResponse {
  identifier: string;
  product_type: string;
  title: string;
  description: string | null;
  default_subscription_option_id: string | null;
  // TODO: Finalize specs
  default_non_renewable_option_id: string | null;
  subscription_options: Map<string, SubscriptionOptionResponse>;
  // TODO: Finalize specs
  non_renewable_options: Map<string, NonRenewableOptionResponse>;
}

export interface ProductsResponse {
  product_details: ProductResponse[];
}
