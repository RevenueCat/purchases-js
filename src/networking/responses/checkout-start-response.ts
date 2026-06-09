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

/**
 * Paddle-specific checkout configuration the backend returns per project.
 * Lets RevenueCat gate checkout presentation/behavior server-side without
 * requiring an SDK upgrade.
 */
export interface PaddleCheckoutConfig {
  /**
   * When `true`, present Paddle's checkout inline (embedded in our own
   * container); when absent or `false`, fall back to the legacy overlay
   * (modal popup). Toggled server-side so the rollout can be staged and
   * managed accounts can opt in without shipping a code change.
   */
  inline_checkout_enabled?: boolean;
}

/** Per-project checkout configuration, keyed by gateway. */
export interface CheckoutConfig {
  paddle_config?: PaddleCheckoutConfig | null;
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
  checkout_config?: CheckoutConfig | null;
}

export type CheckoutStartResponse =
  | WebBillingCheckoutStartResponse
  | PaddleCheckoutStartResponse;
