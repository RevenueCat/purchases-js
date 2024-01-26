export interface ProductResponse {
  current_price: {
    amount: number;
    currency: string;
  };
  identifier: string;
  normal_period_duration: string;
  product_type: string;
  title: string;
}

export interface ProductsResponse {
  product_details: ProductResponse[];
}
