import {
  SubscriberEntitlementResponse,
  SubscriberResponse,
  SubscriberSubscriptionResponse,
} from "../networking/responses/subscriber-response";

/**
 * The store where the user originally subscribed.
 */
export type Store =
  | "app_store"
  | "mac_app_store"
  | "play_store"
  | "amazon"
  | "stripe"
  | "rc_billing"
  | "promotional"
  | "unknown";

/**
 * Supported period types for an entitlement.
 * - "normal" If the entitlement is not under an introductory or trial period.
 * - "intro" If the entitlement is under an introductory period.
 * - "trial" If the entitlement is under a trial period.
 */
export type PeriodType = "normal" | "intro" | "trial";

/**
 * This object gives you access to all the information about the status
 * of a user's entitlements.
 */
export interface EntitlementInfo {
  /**
   * The entitlement identifier configured in the RevenueCat dashboard.
   */
  readonly identifier: string;
  /**
   * True if the user has access to the entitlement.
   */
  readonly isActive: boolean;
  /**
   * True if the underlying subscription is set to renew at the end of the
   * billing period (expirationDate). Will always be True if entitlement is
   * for lifetime access.
   */
  readonly willRenew: boolean;
  /**
   * The store where this entitlement was unlocked from.
   */
  readonly store: Store;
  /**
   * The first date this entitlement was purchased.
   */
  readonly originalPurchaseDate: Date;
  /**
   * The expiration date for the entitlement, can be `null` for lifetime
   * access. If the {@link periodType} is `trial`, this is the trial
   * expiration date.
   */
  readonly expirationDate: Date | null;
  /**
   * The product identifier that unlocked this entitlement.
   */
  readonly productIdentifier: string;
  /**
   * The date an unsubscribe was detected. Can be `null`.
   * Note: Entitlement may still be active even if user has unsubscribed.
   * Check the {@link isActive} property.
   */
  readonly unsubscribeDetectedAt: Date | null;
  /**
   * The date a billing issue was detected. Can be `null` if there is
   * no billing issue or an issue has been resolved. Note: Entitlement may
   * still be active even if there is a billing issue.
   * Check the `isActive` property.
   */
  readonly billingIssueDetectedAt: Date | null;
  /**
   * False if this entitlement is unlocked via a production purchase.
   */
  readonly isSandbox: boolean;
  /**
   * The last period type this entitlement was in.
   */
  readonly periodType: PeriodType;
}

/**
 * Contains all the entitlements associated to the user.
 */
export interface EntitlementInfos {
  /**
   * Map of all {@link EntitlementInfo} objects (active and inactive) keyed by
   * entitlement identifier.
   */
  readonly all: { [entitlementId: string]: EntitlementInfo };
  /**
   * Dictionary of active {@link EntitlementInfo} keyed by entitlement identifier.
   */
  readonly active: { [entitlementId: string]: EntitlementInfo };
}

/**
 * Type containing all information regarding the customer.
 */
export interface CustomerInfo {
  /**
   * Entitlements attached to this customer info.
   */
  readonly entitlements: EntitlementInfos;
  /**
   * Map of productIds to expiration dates.
   */
  readonly allExpirationDatesByProduct: {
    [productIdentifier: string]: Date | null;
  };
  /**
   * Map of productIds to purchase dates.
   */
  readonly allPurchaseDatesByProduct: {
    [productIdentifier: string]: Date;
  };
  /**
   * Set of active subscription product identifiers.
   */
  readonly activeSubscriptions: Set<string>;
  /**
   * URL to manage the active subscription of the user.
   * If this user has an active RC Billing subscription, a link to the management page.
   * If this user has an active iOS subscription, this will point to the App Store.
   * If the user has an active Play Store subscription it will point there.
   * If there are no active subscriptions it will be null.
   */
  readonly managementURL: string | null;
  /**
   * Date when this info was requested.
   */
  readonly requestDate: Date;
  /**
   * The date this user was first seen in RevenueCat.
   */
  readonly firstSeenDate: Date;
  /**
   * The purchase date for the version of the application when the user bought the app.
   * Use this for grandfathering users when migrating to subscriptions. This can be null.
   */
  readonly originalPurchaseDate: Date | null;
  /**
   * The original App User Id recorded for this user.
   */
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
