import type { CustomerInfo } from "../entities/customer-info";
import type { Package } from "../entities/offerings";

export function getRenewalDateFromPackage(customerInfo: CustomerInfo, rcPackage: Package): Date | null {
  const productIdentifier = rcPackage.webBillingProduct.identifier;

  const isActiveSubscription = customerInfo.activeSubscriptions.has(productIdentifier);

  if (!isActiveSubscription) {
    return null;
  }

  for (const entitlementId in customerInfo.entitlements.active) {
    const entitlement = customerInfo.entitlements.active[entitlementId];
    if (entitlement.productIdentifier === productIdentifier) {

      if (entitlement.willRenew) {
        return entitlement.expirationDate;
      }
    }
  }

  return null;
}
