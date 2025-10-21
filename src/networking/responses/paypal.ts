export interface PayPalGatewayParams {
  client_access_token: string;
  currency: string;
}

export interface CreatePayPalOrderResponse {
  order_id: string;
}
