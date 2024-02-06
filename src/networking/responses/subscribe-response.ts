export interface SubscribeResponse {
  operation_session_id: string;
  next_action: string;
  data: {
    client_secret?: string;
    stripe_account_id?: string;
    publishable_api_key?: string;
  };
}
