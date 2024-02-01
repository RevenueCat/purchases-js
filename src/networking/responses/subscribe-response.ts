export interface SubscribeResponse {
  operation_session_id: number;
  next_action: string;
  data: {
    client_secret?: string;
  };
}
