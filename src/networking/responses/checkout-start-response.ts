export interface CheckoutStartResponse {
  operation_session_id: string;
  data: {
    stripe_account_id?: string;
    publishable_api_key?: string;
  };
}
