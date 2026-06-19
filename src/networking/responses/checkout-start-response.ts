import type { GatewayParams } from "./stripe-elements";

export interface StripeBillingParams {
  client_secret: string;
  environment: string;
  publishable_api_key: string;
  stripe_account_id: string;
}

export interface WhopGatewayParams {
  checkout_session_id: string;
  environment: string;
  plan_id: string | null;
}

export interface StripeWebBillingCheckoutStartResponse {
  operation_session_id: string;
  gateway_params: GatewayParams;
  stripe_billing_params: StripeBillingParams | null;
  whop_gateway_params: null;
  management_url: string;
  paddle_billing_params: null;
}

export interface WhopCheckoutStartResponse {
  operation_session_id: string;
  gateway_params: null;
  stripe_billing_params: null;
  whop_gateway_params: WhopGatewayParams;
  management_url: string | null;
  paddle_billing_params: null;
}

export type WebBillingCheckoutStartResponse =
  | StripeWebBillingCheckoutStartResponse
  | WhopCheckoutStartResponse;

export interface PaddleCheckoutStartResponse {
  operation_session_id: string;
  gateway_params: null;
  management_url: string | null;
  whop_gateway_params: null;
  paddle_billing_params: {
    client_side_token: string;
    is_sandbox: boolean;
    transaction_id: string;
    /**
     * Per-project gate for the Paddle inline checkout rollout. When `true`,
     * present Paddle's checkout inline (embedded in our own container); when
     * absent or `false`, fall back to the legacy overlay (modal popup).
     * Toggled server-side by RevenueCat so the rollout can be staged and
     * managed accounts can opt in without shipping a code change.
     */
    inline_checkout_enabled?: boolean;
  };
}

export type CheckoutStartResponse =
  | WebBillingCheckoutStartResponse
  | PaddleCheckoutStartResponse;
