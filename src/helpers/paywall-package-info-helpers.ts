import {
  type Offering,
  type Package,
  ProductType,
} from "../entities/offerings";
import { type PackageInfo } from "@revenuecat/purchases-ui-js";

function getPackageInfo(pkg: Package): PackageInfo {
  // This would not work with Paddle.
  const product = pkg.webBillingProduct;

  const isSubscription = product.productType === ProductType.Subscription;
  const subscriptionOption = product.defaultSubscriptionOption;

  if (isSubscription && subscriptionOption) {
    return {
      hasTrial: subscriptionOption.trial !== null,
      hasIntroOffer:
        subscriptionOption.discountPrice !== null ||
        subscriptionOption.introPrice !== null,
    };
  }

  const nonSubscriptionOption = product.defaultNonSubscriptionOption;
  if (!isSubscription && nonSubscriptionOption) {
    return {
      hasTrial: false,
      hasIntroOffer: nonSubscriptionOption.discountPrice !== null,
    };
  }

  return {};
}

export function parseOfferingIntoPackageInfoPerPackage(
  offering: Offering,
): Record<string, PackageInfo> {
  const mappedEntries = Object.entries(offering.packagesById).map(
    ([packageId, pkg]) => [packageId, getPackageInfo(pkg)],
  );
  return Object.fromEntries(mappedEntries);
}
