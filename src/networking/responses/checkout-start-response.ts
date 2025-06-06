import type { GatewayParams } from "./stripe-elements";

export interface CheckoutStartResponse {
  operation_session_id: string;
  gateway_params: GatewayParams;
  management_url: string;
}
