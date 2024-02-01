import { PeriodType, Store } from "../../entities/customer-info";

export interface SubscriberEntitlementResponse {
  expires_date: string | null;
  grace_period_expires_date?: string | null;
  product_identifier: string;
  product_plan_identifier?: string | null;
  purchase_date: string;
}

export interface SubscriberSubscriptionResponse {
  auto_resume_date?: string | null;
  billing_issues_detected_at: string | null;
  expires_date: string | null;
  grace_period_expires_date?: string | null;
  is_sandbox: boolean;
  original_purchase_date: string;
  period_type: PeriodType;
  product_plan_identifier?: string | null;
  purchase_date: string;
  refunded_at?: string | null;
  store: Store;
  store_transaction_id?: string | null;
  unsubscribe_detected_at: string | null;
}

export interface SubscriberInnerResponse {
  entitlements: { [entitlementId: string]: SubscriberEntitlementResponse };
  first_seen: string;
  last_seen?: string | null;
  management_url: string | null;
  non_subscriptions: { [key: string]: unknown }; // TODO: Add proper types
  original_app_user_id: string;
  original_application_version: string | null;
  original_purchase_date: string | null;
  other_purchases?: { [key: string]: unknown } | null; // TODO: Add proper types
  subscriptions: { [productId: string]: SubscriberSubscriptionResponse };
}

export interface SubscriberResponse {
  request_date: string;
  request_date_ms: number;
  subscriber: SubscriberInnerResponse;
}
