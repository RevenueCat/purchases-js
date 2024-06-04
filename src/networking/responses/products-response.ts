export interface PriceResponse {
  amount: number;
  currency: string;
}

export interface PurchaseOptionPhaseResponse {
  period_duration: string | null;
  price: PriceResponse | null;
  cycle_count: number;
}

export interface PurchaseOptionResponse {
  id: string;
}

export interface SubscriptionPurchaseOptionResponse
  extends PurchaseOptionResponse {
  base_phase: PurchaseOptionPhaseResponse | null;
  trial_phase: PurchaseOptionPhaseResponse | null;
}

export interface ProductResponse {
  identifier: string;
  product_type: string;
  title: string;
  default_subscription_purchase_option_id: string | null;
  subscription_purchase_options: Map<
    string,
    SubscriptionPurchaseOptionResponse
  >;
}

export interface ProductsResponse {
  product_details: ProductResponse[];
}
