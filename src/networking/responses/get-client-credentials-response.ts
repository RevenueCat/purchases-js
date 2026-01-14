export interface GetClientCredentialsStripeGatewayParams {
  publishable_api_key: string;
  stripe_account_id: string;
}

export interface GetClientCredentialsPayPalGatewayParams {
  client_access_token: string;
}

export interface GetClientCredentialsPaddleBillingParams {
  client_side_token: string;
  is_sandbox: boolean;
}

export interface GetClientCredentialsResponse {
  stripe_gateway_params: GetClientCredentialsStripeGatewayParams | null;
  paypal_gateway_params: GetClientCredentialsPayPalGatewayParams | null;
  paddle_billing_params: GetClientCredentialsPaddleBillingParams | null;
}
