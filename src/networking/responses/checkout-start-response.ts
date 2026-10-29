import type { GatewayParams } from "./stripe-elements";
import type { PaddleCheckoutSettings } from "./paddle-checkout-settings";
import type { PayrailsGatewayParams } from "./payrails-gateway-params";

export interface StripeBillingParams {
  client_secret: string;
  environment: string;
  publishable_api_key: string;
  stripe_account_id: string;
}

export interface StripeBillingApplePayParams {
  publishable_api_key: string;
  stripe_account_id: string;
  account_country: string | null;
  amount_in_micros: number;
  currency: string;
  expires_at: string;
}

export type CheckoutMode = "purchase" | "subscription_change";

export interface WebBillingCheckoutStartResponse {
  operation_session_id: string;
  gateway_params: GatewayParams;
  stripe_billing_params: StripeBillingParams | null;
  management_url: string;
  paddle_billing_params: null;
  payrails_gateway_params?: null;
  checkout_mode: "purchase";
}

/**
 * Web Billing checkout backed by Payrails. Uses the same `rcb_` API key as
 * Stripe Web Billing. `payrails_gateway_params.init_payload` is the client init body.
 */
export interface PayrailsCheckoutStartResponse {
  operation_session_id: string;
  management_url: string;
  checkout_mode: "purchase";
  payrails_gateway_params: PayrailsGatewayParams;
}

export interface StripeBillingApplePayCheckoutStartResponse {
  operation_session_id: string;
  gateway_params: null;
  stripe_billing_params: null;
  stripe_billing_apple_pay_params: StripeBillingApplePayParams;
  management_url: string;
  paddle_billing_params: null;
  checkout_mode: "purchase";
}

export interface PaddleCheckoutStartResponse {
  operation_session_id: string;
  gateway_params: null;
  management_url: string | null;
  paddle_billing_params: {
    client_side_token: string;
    is_sandbox: boolean;
    transaction_id: string;
    checkout_settings?: PaddleCheckoutSettings;
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
  | PayrailsCheckoutStartResponse
  | StripeBillingApplePayCheckoutStartResponse
  | PaddleCheckoutStartResponse;

export interface ExternalCheckoutStartResponse {
  operation_session_id: string;
}

export function isPayrailsCheckoutStartResponse(
  response: object,
): response is PayrailsCheckoutStartResponse {
  if (!("payrails_gateway_params" in response)) {
    return false;
  }

  const params = response.payrails_gateway_params;
  if (typeof params !== "object" || params === null) {
    return false;
  }

  if (
    !("always_store_instrument" in params) ||
    typeof params.always_store_instrument !== "boolean" ||
    !("init_payload" in params)
  ) {
    return false;
  }

  const initPayload = params.init_payload;
  if (typeof initPayload !== "object" || initPayload === null) {
    return false;
  }

  return (
    "version" in initPayload &&
    typeof initPayload.version === "string" &&
    initPayload.version.length > 0 &&
    "data" in initPayload &&
    typeof initPayload.data === "string" &&
    initPayload.data.length > 0
  );
}
