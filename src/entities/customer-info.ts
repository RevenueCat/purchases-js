import {
  SubscriberEntitlementResponse,
  SubscriberResponse,
  SubscriberSubscriptionResponse,
} from "../networking/responses/subscriber-response";

export type Store =
  | "app_store"
  | "mac_app_store"
  | "play_store"
  | "amazon"
  | "stripe"
  | "rc_billing"
  | "promotional"
  | "unknown";

export type PeriodType = "normal" | "intro" | "trial";

export interface EntitlementInfo {
  readonly identifier: string;
  readonly isActive: boolean;
  readonly willRenew: boolean;
  readonly store: Store;
  readonly originalPurchaseDate: Date;
  readonly expirationDate: Date | null;
  readonly productIdentifier: string;
  readonly unsubscribeDetectedAt: Date | null;
  readonly billingIssueDetectedAt: Date | null;
  readonly isSandbox: boolean;
  readonly periodType: PeriodType;
}

export interface EntitlementInfos {
  readonly all: { [entitlementId: string]: EntitlementInfo };
  readonly active: { [entitlementId: string]: EntitlementInfo };
}

export interface CustomerInfo {
  readonly entitlements: EntitlementInfos;
  readonly allExpirationDatesByProduct: {
    [productIdentifier: string]: Date | null;
  };
  readonly allPurchaseDatesByProduct: {
    [productIdentifier: string]: Date;
  };
  readonly activeSubscriptions: Set<string>;
  readonly managementURL: string | null;
  readonly requestDate: Date;
  readonly firstSeenDate: Date;
  readonly originalPurchaseDate: Date | null;
  readonly originalAppUserId: string;
}

function isActive(
  entitlementInfoResponse: SubscriberEntitlementResponse,
): boolean {
  if (entitlementInfoResponse.expires_date == null) return true;
  const expirationDate = new Date(entitlementInfoResponse.expires_date);
  const currentDate = new Date();
  return expirationDate > currentDate;
}

function toEntitlementInfo(
  entitlementIdentifier: string,
  entitlementInfoResponse: SubscriberEntitlementResponse,
  subscriptionResponse: SubscriberSubscriptionResponse | null, // TODO: Support non-subscription purchases
): EntitlementInfo {
  return {
    identifier: entitlementIdentifier,
    isActive: isActive(entitlementInfoResponse),
    willRenew: getWillRenew(entitlementInfoResponse, subscriptionResponse),
    store: subscriptionResponse?.store ?? "unknown",
    originalPurchaseDate: new Date(entitlementInfoResponse.purchase_date),
    expirationDate: toDateIfNotNull(entitlementInfoResponse.expires_date),
    productIdentifier: entitlementInfoResponse.product_identifier,
    unsubscribeDetectedAt: toDateIfNotNull(
      subscriptionResponse?.unsubscribe_detected_at,
    ),
    billingIssueDetectedAt: toDateIfNotNull(
      subscriptionResponse?.billing_issues_detected_at,
    ),
    isSandbox: subscriptionResponse?.is_sandbox ?? false,
    periodType: subscriptionResponse?.period_type ?? "normal",
  };
}

function toEntitlementInfos(
  entitlementsResponse: {
    [entitlementId: string]: SubscriberEntitlementResponse;
  },
  subscriptions: { [productId: string]: SubscriberSubscriptionResponse },
): EntitlementInfos {
  const allEntitlementInfo: { [entitlementId: string]: EntitlementInfo } = {};
  const activeEntitlementInfo: { [entitlementId: string]: EntitlementInfo } =
    {};
  for (const key in entitlementsResponse) {
    const subscription = subscriptions[key] ?? null;
    const entitlementInfo = toEntitlementInfo(
      key,
      entitlementsResponse[key],
      subscription,
    );
    allEntitlementInfo[key] = entitlementInfo;
    if (entitlementInfo.isActive) {
      activeEntitlementInfo[key] = entitlementInfo;
    }
  }
  return {
    all: allEntitlementInfo,
    active: activeEntitlementInfo,
  };
}

function toDateIfNotNull(value: string | undefined | null): Date | null {
  if (value == null) return null;
  return new Date(value);
}

export function toCustomerInfo(
  customerInfoResponse: SubscriberResponse,
): CustomerInfo {
  const expirationDatesByProductId =
    getExpirationDatesByProductId(customerInfoResponse);
  const subscriberResponse = customerInfoResponse.subscriber;
  return {
    entitlements: toEntitlementInfos(
      subscriberResponse.entitlements,
      subscriberResponse.subscriptions,
    ),
    allExpirationDatesByProduct: expirationDatesByProductId,
    allPurchaseDatesByProduct:
      getPurchaseDatesByProductId(customerInfoResponse),
    activeSubscriptions: getActiveSubscriptions(expirationDatesByProductId),
    managementURL: subscriberResponse.management_url,
    requestDate: new Date(customerInfoResponse.request_date),
    firstSeenDate: new Date(subscriberResponse.first_seen),
    originalPurchaseDate: toDateIfNotNull(
      subscriberResponse.original_purchase_date,
    ),
    originalAppUserId: customerInfoResponse.subscriber.original_app_user_id,
  };
}

function getWillRenew(
  entitlementInfoResponse: SubscriberEntitlementResponse,
  subscriptionResponse: SubscriberSubscriptionResponse | null,
) {
  if (subscriptionResponse == null) return false;
  const isPromo = subscriptionResponse.store == "promotional";
  const isLifetime = entitlementInfoResponse.expires_date == null;
  const hasUnsubscribed = subscriptionResponse.unsubscribe_detected_at != null;
  const hasBillingIssues =
    subscriptionResponse.billing_issues_detected_at != null;
  return !(isPromo || isLifetime || hasUnsubscribed || hasBillingIssues);
}

function getPurchaseDatesByProductId(
  customerInfoResponse: SubscriberResponse,
): { [productId: string]: Date } {
  const purchaseDatesByProduct: { [productId: string]: Date } = {};
  for (const subscriptionId in customerInfoResponse.subscriber.subscriptions) {
    const subscription =
      customerInfoResponse.subscriber.subscriptions[subscriptionId];
    purchaseDatesByProduct[subscriptionId] = new Date(
      subscription.purchase_date,
    );
  }
  return purchaseDatesByProduct;
}

function getExpirationDatesByProductId(
  customerInfoResponse: SubscriberResponse,
): { [productId: string]: Date | null } {
  const expirationDatesByProduct: { [productId: string]: Date | null } = {};
  for (const subscriptionId in customerInfoResponse.subscriber.subscriptions) {
    const subscription =
      customerInfoResponse.subscriber.subscriptions[subscriptionId];
    if (subscription.expires_date == null) {
      expirationDatesByProduct[subscriptionId] = null;
    } else {
      expirationDatesByProduct[subscriptionId] = new Date(
        subscription.expires_date,
      );
    }
  }
  return expirationDatesByProduct;
}

function getActiveSubscriptions(expirationDatesByProductId: {
  [productId: string]: Date | null;
}): Set<string> {
  const activeSubscriptions: Set<string> = new Set();
  const currentDate = new Date();
  for (const productId in expirationDatesByProductId) {
    const expirationDate = expirationDatesByProductId[productId];
    if (expirationDate == null) {
      activeSubscriptions.add(productId);
    } else if (expirationDate > currentDate) {
      activeSubscriptions.add(productId);
    }
  }
  return activeSubscriptions;
}
