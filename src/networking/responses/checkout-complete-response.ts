export interface CheckoutCompleteResponse {
  operation_session_id: string;
  gateway_params: {
    client_secret?: string | null;
    intent_type?: "payment_intent" | "setup_intent" | null;
  };
  checkout_mode: "purchase";
}
