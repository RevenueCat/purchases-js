import type { PaywallPackage } from "@revenuecat/purchases-ui-js";
import type { Offering } from "../entities/offerings";

/**
 * Map an offering's packages to SDK PaywallPackage[] for custom-component context.
 *
 * Mapping rules (implement the body):
 * - offering.availablePackages -> PaywallPackage[]
 * - package.identifier; display_name from webBillingProduct.title
 * - product.identifier; display_name from title; is_subscription when ProductType.Subscription; period from normalPeriodDuration
 * - price: amountMicros / 1_000_000 (NOT deprecated Price.amount cents); omit price if missing
 * - store.store_type: "rc_billing"; omit country and is_family_shareable
 * - is_auto_renewing: true only for Subscription, else omit
 */
export function buildPaywallContextPackages(
  offering: Offering,
): PaywallPackage[] {
  // TODO(PWENG-229): implement the mapping rules in the comment above.
  void offering;
  return [];
}
