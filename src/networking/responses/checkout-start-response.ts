import type { GatewayParams } from "./stripe-elements";

export interface StripeBillingParams {
  client_secret: string;
  environment: string;
  publishable_api_key: string;
  stripe_account_id: string;
}

export interface WebBillingCheckoutStartResponse {
  operation_session_id: string;
  gateway_params: GatewayParams;
  stripe_billing_params: StripeBillingParams | null;
  management_url: string;
  paddle_billing_params: null;
}

export interface PaddleCheckoutStartResponse {
  operation_session_id: string;
  gateway_params: null;
  management_url: string | null;
  paddle_billing_params: {
    client_side_token: string;
    is_sandbox: boolean;
    transaction_id: string;
  };
}

export type CheckoutStartResponse =
  | WebBillingCheckoutStartResponse
  | PaddleCheckoutStartResponse;
