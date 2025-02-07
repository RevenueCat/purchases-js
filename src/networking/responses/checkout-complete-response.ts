export interface CheckoutCompleteResponse {
  operation_session_id: string;
  data: {
    client_secret?: string;
  };
}
