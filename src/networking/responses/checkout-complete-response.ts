export interface CheckoutCompleteResponse {
  operation_session_id: string;
  data: {
    client_secret?: string;
    stripe_account_id?: string;
    publishable_api_key?: string;
  };
}
