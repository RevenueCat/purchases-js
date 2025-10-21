import type { GatewayParams } from "./stripe-elements";
import type { PayPalGatewayParams } from "./paypal";

export interface CheckoutStartResponse {
  operation_session_id: string;
  gateway_params: GatewayParams;
  stripe_gateway_params: GatewayParams;
  paypal_gateway_params: PayPalGatewayParams | null;
  management_url: string;
}
