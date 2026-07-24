export interface SubscriptionChangeResponse {
  operation_session_id: string;
  change_type: "immediate" | "deferred";
  new_product_id: string;
}
