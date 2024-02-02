export interface SubscribeResponse {
  operation_session_id: string;
  next_action: string;
  data: {
    client_secret?: string;
  };
}
