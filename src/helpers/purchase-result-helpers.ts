import type { CustomerInfo } from "../entities/customer-info";
import type { Package } from "../entities/offerings";

export function getRenewalDateFromPackage(
  customerInfo: CustomerInfo,
  rcPackage: Package,
): Date | null {
  const productIdentifier = rcPackage.webBillingProduct.identifier;

  const isActiveSubscription =
    customerInfo.activeSubscriptions.has(productIdentifier);

  if (!isActiveSubscription) {
    return null;
  }

  const expirationDate =
    customerInfo.allExpirationDatesByProduct[productIdentifier];

  if (!expirationDate) {
    return null;
  }

  return expirationDate;
}
