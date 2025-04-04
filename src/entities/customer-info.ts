import {
  type NonSubscriptionResponse,
  type SubscriberEntitlementResponse,
  type SubscriberResponse,
  type SubscriberSubscriptionResponse,
} from "../networking/responses/subscriber-response";
import { ErrorCode, PurchasesError } from "./errors";

/**
 * The store where the user originally subscribed.
 * @public
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
 * - "prepaid" If the entitlement is a prepaid entitlement. Only for Google Play subscriptions.
 * @public
 */
export type PeriodType = "normal" | "intro" | "trial" | "prepaid";

/**
 * The types used to describe whether a transaction was purchased by the user,
 * or is available to them through Family Sharing.
 * @public
 */
export type OwnershipType = "PURCHASED" | "FAMILY_SHARED" | "UNKNOWN";

/**
 * This object gives you access to all the information about the status
 * of a user's entitlements.
 * @public
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
   * The latest purchase or renewal date for the entitlement.
   */
  readonly latestPurchaseDate: Date;
  /**
   * The first date this entitlement was purchased.
   */
  readonly originalPurchaseDate: Date;
  /**
   * The expiration date for the entitlement, can be `null` for lifetime
   * access. If the {@link EntitlementInfo.periodType} is `trial`, this is the trial
   * expiration date.
   */
  readonly expirationDate: Date | null;
  /**
   * The product identifier that unlocked this entitlement.
   */
  readonly productIdentifier: string;
  /**
   * The base plan identifier that unlocked this entitlement (For Google Play subs only).
   */
  readonly productPlanIdentifier: string | null;
  /**
   * The date an unsubscribe was detected. Can be `null`.
   * Note: Entitlement may still be active even if user has unsubscribed.
   * Check the {@link EntitlementInfo.isActive} property.
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
  /**
   * Use this property to determine whether a purchase was made by the
   * current user or shared to them by a family member. This can be useful
   * for onboarding users who have had an entitlement shared with them,
   * but might not be entirely aware of the benefits they now have.
   */
  readonly ownershipType: OwnershipType | null;
}

/**
 * Contains all the entitlements associated to the user.
 * @public
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
 * Information that represents a non-subscription purchase made by a user.
 * @public
 */
export interface NonSubscriptionTransaction {
  /**
   * The unique identifier for the transaction created by RevenueCat.
   */
  readonly transactionIdentifier: string;
  /**
   * The product identifier.
   */
  readonly productIdentifier: string;
  /**
   * The date that the store charged the user’s account.
   */
  readonly purchaseDate: Date;
  /**
   * The unique identifier for the transaction created by the Store.
   */
  readonly storeTransactionId: string | null;
  /**
   * The {@link Store} where the transaction was made.
   */
  readonly store: Store;
}

/**
 * Subscription purchases of the Customer.
 * @public
 */
export interface SubscriptionInfo {
  /**
   * The product identifier.
   */
  readonly productIdentifier: string;
  /**
   * Date when the last subscription period started.
   */
  readonly purchaseDate: Date;
  /**
   * Date when this subscription first started. This property does not update with renewals.
   * This property also does not update for product changes within a subscription group or
   * re-subscriptions by lapsed subscribers.
   */
  readonly originalPurchaseDate: Date | null;
  /**
   * Date when the subscription expires/expired
   */
  readonly expiresDate: Date | null;
  /**
   * Store where the subscription was purchased.
   */
  readonly store: Store;
  /**
   * Date when RevenueCat detected that auto-renewal was turned off for this subscription.
   * Note the subscription may still be active, check the {@link SubscriptionInfo.expiresDate} attribute.
   */
  readonly unsubscribeDetectedAt: Date | null;
  /**
   * Whether or not the purchase was made in sandbox mode.
   */
  readonly isSandbox: boolean;
  /**
   * Date when RevenueCat detected any billing issues with this subscription.
   * If and when the billing issue gets resolved, this field is set to null.
   * Note the subscription may still be active, check the {@link SubscriptionInfo.expiresDate} attribute.
   */
  readonly billingIssuesDetectedAt: Date | null;
  /**
   * Date when any grace period for this subscription expires/expired.
   * null if the customer has never been in a grace period.
   */
  readonly gracePeriodExpiresDate: Date | null;
  /**
   * How the Customer received access to this subscription:
   * - "PURCHASED": The customer bought the subscription.
   * - "FAMILY_SHARED": The customer has access to the product via their family.
   */
  readonly ownershipType: OwnershipType;
  /**
   * Type of the current subscription period:
   * - "normal": The product is in a normal period (default)
   * - "trial": The product is in a free trial period
   * - "intro": The product is in an introductory pricing period
   * - "prepaid": The product is in a prepaid pricing period
   */
  readonly periodType: PeriodType;
  /**
   * Date when RevenueCat detected a refund of this subscription.
   */
  readonly refundedAt: Date | null;
  /**
   * The transaction id in the store of the subscription.
   */
  readonly storeTransactionId: string | null;
  /**
   * Whether the subscription is currently active
   * (at the time this object was obtained).
   */
  readonly isActive: boolean;
  /**
   * Whether the subscription will renew at the next billing period.
   */
  readonly willRenew: boolean;
}

/**
 * Type containing all information regarding the customer.
 * @public
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
    [productIdentifier: string]: Date | null;
  };
  /**
   * Set of active subscription product identifiers.
   */
  readonly activeSubscriptions: Set<string>;
  /**
   * URL to manage the active subscription of the user.
   * If this user has an active Web Billing subscription, a link to the management page.
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
  /**
   * The list of non-subscription transactions made by the user.
   */
  readonly nonSubscriptionTransactions: NonSubscriptionTransaction[];
  /**
   * Dictionary of all subscription product identifiers and their subscription info.
   */
  readonly subscriptionsByProductIdentifier: {
    [productId: string]: SubscriptionInfo;
  };
}

function isActive(expires_date: string | null): boolean {
  if (expires_date == null) return true;
  const expirationDate = new Date(expires_date);
  const currentDate = new Date();
  return expirationDate > currentDate;
}

function toEntitlementInfo(
  entitlementIdentifier: string,
  entitlementInfoResponse: SubscriberEntitlementResponse,
  subscriptions: { [productId: string]: SubscriberSubscriptionResponse },
  latestNonSubscriptionPurchaseByProduct: {
    [key: string]: NonSubscriptionResponse;
  },
): EntitlementInfo {
  const productIdentifier = entitlementInfoResponse.product_identifier;
  if (productIdentifier in subscriptions) {
    return toSubscriptionEntitlementInfo(
      entitlementIdentifier,
      entitlementInfoResponse,
      subscriptions[productIdentifier],
    );
  } else if (productIdentifier in latestNonSubscriptionPurchaseByProduct) {
    return toNonSubscriptionEntitlementInfo(
      entitlementIdentifier,
      entitlementInfoResponse,
      latestNonSubscriptionPurchaseByProduct[productIdentifier],
    );
  }
  throw new PurchasesError(
    ErrorCode.CustomerInfoError,
    "Could not find entitlement product in subscriptions or non-subscriptions.",
  );
}

function toSubscriptionEntitlementInfo(
  entitlementIdentifier: string,
  entitlementInfoResponse: SubscriberEntitlementResponse,
  subscriptionResponse: SubscriberSubscriptionResponse | null,
): EntitlementInfo {
  return {
    identifier: entitlementIdentifier,
    isActive: isActive(entitlementInfoResponse.expires_date),
    willRenew: getWillRenew(
      entitlementInfoResponse.expires_date,
      subscriptionResponse,
    ),
    store: subscriptionResponse?.store ?? "unknown",
    latestPurchaseDate: new Date(entitlementInfoResponse.purchase_date),
    originalPurchaseDate: new Date(entitlementInfoResponse.purchase_date),
    expirationDate: toDateIfNotNull(entitlementInfoResponse.expires_date),
    productIdentifier: entitlementInfoResponse.product_identifier,
    productPlanIdentifier:
      entitlementInfoResponse.product_plan_identifier ?? null,
    unsubscribeDetectedAt: toDateIfNotNull(
      subscriptionResponse?.unsubscribe_detected_at,
    ),
    billingIssueDetectedAt: toDateIfNotNull(
      subscriptionResponse?.billing_issues_detected_at,
    ),
    isSandbox: subscriptionResponse?.is_sandbox ?? false,
    periodType: subscriptionResponse?.period_type ?? "normal",
    ownershipType: subscriptionResponse?.ownership_type ?? "UNKNOWN",
  };
}

function toNonSubscriptionEntitlementInfo(
  entitlementIdentifier: string,
  entitlementInfoResponse: SubscriberEntitlementResponse,
  nonSubscriptionResponse: NonSubscriptionResponse,
): EntitlementInfo {
  return {
    identifier: entitlementIdentifier,
    isActive: true,
    willRenew: false,
    store: nonSubscriptionResponse.store,
    latestPurchaseDate: new Date(entitlementInfoResponse.purchase_date),
    originalPurchaseDate: new Date(
      nonSubscriptionResponse.original_purchase_date,
    ),
    expirationDate: null,
    productIdentifier: entitlementInfoResponse.product_identifier,
    productPlanIdentifier: null,
    unsubscribeDetectedAt: null,
    billingIssueDetectedAt: null,
    isSandbox: nonSubscriptionResponse.is_sandbox,
    periodType: "normal",
    ownershipType: "UNKNOWN",
  };
}

function toEntitlementInfos(
  entitlementsResponse: {
    [entitlementId: string]: SubscriberEntitlementResponse;
  },
  subscriptions: { [productId: string]: SubscriberSubscriptionResponse },
  latestNonSubscriptionPurchaseByProduct: {
    [key: string]: NonSubscriptionResponse;
  },
): EntitlementInfos {
  const allEntitlementInfo: { [entitlementId: string]: EntitlementInfo } = {};
  const activeEntitlementInfo: { [entitlementId: string]: EntitlementInfo } =
    {};
  for (const key in entitlementsResponse) {
    const entitlementInfo = toEntitlementInfo(
      key,
      entitlementsResponse[key],
      subscriptions,
      latestNonSubscriptionPurchaseByProduct,
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

  const latestNonSubscriptionPurchaseByProduct =
    getLatestNonSubscriptionPurchaseByProduct(
      subscriberResponse.non_subscriptions,
    );

  const nonSubscriptionTransactions: NonSubscriptionTransaction[] =
    Object.entries(customerInfoResponse.subscriber.non_subscriptions).flatMap(
      ([productIdentifier, responses]) =>
        responses.map((response) => ({
          transactionIdentifier: response.id,
          productIdentifier: productIdentifier,
          purchaseDate: new Date(
            response.purchase_date || response.original_purchase_date,
          ),
          storeTransactionId: response.store_transaction_id || null,
          store: response.store,
        })),
    );

  const requestDate = new Date(customerInfoResponse.request_date);

  const subscriptionsByProductIdentifier: Record<string, SubscriptionInfo> =
    Object.fromEntries(
      Object.entries(customerInfoResponse.subscriber.subscriptions).map(
        ([productIdentifier, response]) => [
          productIdentifier,
          {
            productIdentifier,
            purchaseDate: new Date(response.purchase_date),
            originalPurchaseDate: toDateIfNotNull(
              response.original_purchase_date,
            ),
            expiresDate: toDateIfNotNull(response.expires_date),
            store: response.store,
            unsubscribeDetectedAt: toDateIfNotNull(
              response.unsubscribe_detected_at,
            ),
            isSandbox: response.is_sandbox,
            billingIssuesDetectedAt: toDateIfNotNull(
              response.billing_issues_detected_at,
            ),
            gracePeriodExpiresDate: toDateIfNotNull(
              response.grace_period_expires_date,
            ),
            ownershipType: response.ownership_type ?? "UNKNOWN",
            periodType: response.period_type,
            refundedAt: toDateIfNotNull(response.refunded_at),
            storeTransactionId: response.store_transaction_id || null,
            isActive: isActive(response.expires_date),
            willRenew: getWillRenew(response.expires_date, response),
          },
        ],
      ),
    );

  return {
    entitlements: toEntitlementInfos(
      subscriberResponse.entitlements,
      subscriberResponse.subscriptions,
      latestNonSubscriptionPurchaseByProduct,
    ),
    allExpirationDatesByProduct: expirationDatesByProductId,
    allPurchaseDatesByProduct: getPurchaseDatesByProductId(
      customerInfoResponse,
      latestNonSubscriptionPurchaseByProduct,
    ),
    activeSubscriptions: getActiveSubscriptions(expirationDatesByProductId),
    managementURL: subscriberResponse.management_url,
    requestDate: requestDate,
    firstSeenDate: new Date(subscriberResponse.first_seen),
    originalPurchaseDate: toDateIfNotNull(
      subscriberResponse.original_purchase_date,
    ),
    originalAppUserId: customerInfoResponse.subscriber.original_app_user_id,
    nonSubscriptionTransactions: nonSubscriptionTransactions,
    subscriptionsByProductIdentifier: subscriptionsByProductIdentifier,
  };
}

function getWillRenew(
  expires_date: string | null,
  subscriptionResponse: SubscriberSubscriptionResponse | null,
) {
  if (subscriptionResponse == null) return false;
  const isPromo = subscriptionResponse.store == "promotional";
  const isLifetime = expires_date == null;
  const hasUnsubscribed = subscriptionResponse.unsubscribe_detected_at != null;
  const hasBillingIssues =
    subscriptionResponse.billing_issues_detected_at != null;
  return !(isPromo || isLifetime || hasUnsubscribed || hasBillingIssues);
}

function getPurchaseDatesByProductId(
  customerInfoResponse: SubscriberResponse,
  latestNonSubscriptionPurchaseByProduct: {
    [key: string]: NonSubscriptionResponse;
  },
): { [productId: string]: Date | null } {
  const purchaseDatesByProduct: { [productId: string]: Date | null } = {};
  for (const subscriptionId in customerInfoResponse.subscriber.subscriptions) {
    const subscription =
      customerInfoResponse.subscriber.subscriptions[subscriptionId];
    purchaseDatesByProduct[subscriptionId] = new Date(
      subscription.purchase_date,
    );
  }
  for (const productId in latestNonSubscriptionPurchaseByProduct) {
    const purchaseDate =
      latestNonSubscriptionPurchaseByProduct[productId].purchase_date;
    if (purchaseDate == null) {
      purchaseDatesByProduct[productId] = null;
    } else {
      purchaseDatesByProduct[productId] = new Date(purchaseDate);
    }
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

function getLatestNonSubscriptionPurchaseByProduct(nonSubscriptions: {
  [key: string]: NonSubscriptionResponse[];
}): { [key: string]: NonSubscriptionResponse } {
  const latestNonSubscriptionPurchaseByProduct: {
    [key: string]: NonSubscriptionResponse;
  } = {};
  for (const key in nonSubscriptions) {
    if (nonSubscriptions[key].length === 0) continue;
    const numberPurchases = nonSubscriptions[key].length;
    latestNonSubscriptionPurchaseByProduct[key] =
      nonSubscriptions[key][numberPurchases - 1];
  }
  return latestNonSubscriptionPurchaseByProduct;
}
