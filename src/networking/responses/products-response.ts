export interface PriceResponse {
  amount: number;
  currency: string;
}

export interface PricingPhaseResponse {
  period_duration: string | null;
  price: PriceResponse | null;
  cycle_count: number;
}

export interface PurchaseOptionResponse {
  id: string;
}

export interface SubscriptionOptionResponse extends PurchaseOptionResponse {
  base_phase: PricingPhaseResponse | null;
  trial_phase: PricingPhaseResponse | null;
}

export interface ProductResponse {
  identifier: string;
  product_type: string;
  title: string;
  default_subscription_purchase_option_id: string | null;
  subscription_purchase_options: Map<string, SubscriptionOptionResponse>;
}

export interface ProductsResponse {
  product_details: ProductResponse[];
}
