export interface CheckoutCompleteResponse {
  operation_session_id: string;
  gateway_params: {
    client_secret?: string | null;
  };
}
