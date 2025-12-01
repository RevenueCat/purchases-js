import type { GatewayParams } from "./stripe-elements";

export interface WebBillingCheckoutStartResponse {
  operation_session_id: string;
  gateway_params: GatewayParams;
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
