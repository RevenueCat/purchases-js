import {
  type Offering,
  type Package,
  ProductType,
} from "../entities/offerings";
import { type PackageInfo } from "@revenuecat/purchases-ui-js";

function getPackageInfo(pkg: Package): PackageInfo {
  // This would not work with Paddle.
  const product = pkg.webBillingProduct;

  if (product.productType !== ProductType.Subscription) {
    return {};
  }

  const subscriptionOption = product.defaultSubscriptionOption;
  if (!subscriptionOption) {
    return {};
  }

  return {
    hasTrial: subscriptionOption.trial !== null,
    hasIntroOffer: subscriptionOption.introPrice !== null,
  };
}

export function parseOfferingIntoPackageInfoPerPackage(
  offering: Offering,
): Record<string, PackageInfo> {
  const mappedEntries = Object.entries(offering.packagesById).map(
    ([packageId, pkg]) => [packageId, getPackageInfo(pkg)],
  );
  return Object.fromEntries(mappedEntries);
}
