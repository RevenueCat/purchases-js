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
  intro_price: PricingPhaseResponse | null;
}

export interface NonSubscriptionOptionResponse extends PurchaseOptionResponse {
  base_price: PriceResponse;
}

export interface ProductResponse {
  identifier: string;
  product_type: string;
  title: string;
  description: string | null;
  default_purchase_option_id: string | null;
  purchase_options: {
    [key: string]: NonSubscriptionOptionResponse | SubscriptionOptionResponse;
  };
}

export interface ProductsResponse {
  product_details: ProductResponse[];
}
