import type { GatewayParams } from "./stripe-elements";

export interface CheckoutStartResponse {
  operation_session_id: string;
  gateway_params: GatewayParams | null;
  management_url: string | null;
  paddle_billing_params: {
    client_side_token: string;
    is_sandbox: boolean;
    transaction_id: string;
  } | null;
}
