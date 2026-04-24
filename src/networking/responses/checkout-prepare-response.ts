import type { GatewayParams } from "./stripe-elements";

export type CheckoutPrepareStripeGatewayParams = GatewayParams;

export interface CheckoutPreparePayPalGatewayParams {
  is_sandbox: boolean;
}

export interface CheckoutPreparePaddleBillingParams {
  client_side_token: string;
  is_sandbox: boolean;
}

export interface CheckoutPrepareResponse {
  stripe_gateway_params: CheckoutPrepareStripeGatewayParams | null;
  paypal_gateway_params: CheckoutPreparePayPalGatewayParams | null;
  paddle_billing_params: CheckoutPreparePaddleBillingParams | null;
}
