export interface Price {
  amount: number;
  currency: string;
}

export interface PurchaseOptionPrice {
  period_duration: string | null;
  price: Price | null;
  cycle_count: number;
}

export interface PurchaseOption {
  id: string;
}

export interface SubscriptionPurchaseOption extends PurchaseOption {
  base_price: PurchaseOptionPrice;
  trial: PurchaseOptionPrice | null;
}

export interface ProductResponse {
  current_price: Price;
  identifier: string;
  normal_period_duration: string;
  product_type: string;
  title: string;
  default_subscription_purchase_option_id: string | null;
  subscription_purchase_options: Map<string, SubscriptionPurchaseOption>;
}

export interface ProductsResponse {
  product_details: ProductResponse[];
}
