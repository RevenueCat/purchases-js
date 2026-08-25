import type { GatewayParams } from "./stripe-elements";
import type { PaddleCheckoutSettings } from "./paddle-checkout-settings";

export type CheckoutPrepareStripeGatewayParams = GatewayParams;

export interface CheckoutPreparePayPalGatewayParams {
  client_access_token: string;
}

export interface CheckoutPreparePaddleBillingParams {
  client_side_token: string;
  is_sandbox: boolean;
  checkout_settings?: PaddleCheckoutSettings;
}

export interface CheckoutPrepareResponse {
  stripe_gateway_params: CheckoutPrepareStripeGatewayParams | null;
  paypal_gateway_params: CheckoutPreparePayPalGatewayParams | null;
  paddle_billing_params: CheckoutPreparePaddleBillingParams | null;
}
