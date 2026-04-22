import {
  type Offering,
  type Package,
  ProductType,
} from "../entities/offerings";
import { type PackageInfo } from "@revenuecat/purchases-ui-js";

function resolveWebCheckoutURL(
  pkg: Package,
  offeringWebCheckoutURL?: string | null,
): string | undefined {
  const fromPackage = pkg.webCheckoutURL;
  if (typeof fromPackage === "string" && fromPackage.length > 0) {
    return fromPackage;
  }

  if (
    typeof offeringWebCheckoutURL === "string" &&
    offeringWebCheckoutURL.length > 0
  ) {
    return offeringWebCheckoutURL;
  }

  return undefined;
}

function getPackageInfo(
  pkg: Package,
  offeringWebCheckoutURL?: string | null,
): PackageInfo {
  // This would not work with Paddle.
  const product = pkg.webBillingProduct;

  const webCheckoutURL = resolveWebCheckoutURL(pkg, offeringWebCheckoutURL);
  const checkoutFields = webCheckoutURL !== undefined ? { webCheckoutURL } : {};

  const isSubscription = product.productType === ProductType.Subscription;
  const subscriptionOption = product.defaultSubscriptionOption;

  if (isSubscription && subscriptionOption) {
    return {
      hasTrial: subscriptionOption.trial !== null,
      hasIntroOffer: subscriptionOption.introPrice !== null,
      hasPromoOffer: subscriptionOption.discount !== null,
      ...checkoutFields,
    };
  }

  const nonSubscriptionOption = product.defaultNonSubscriptionOption;
  if (!isSubscription && nonSubscriptionOption) {
    return {
      hasTrial: false,
      hasIntroOffer: false,
      hasPromoOffer: nonSubscriptionOption.discount !== null,
      ...checkoutFields,
    };
  }

  return { ...checkoutFields };
}

export function parseOfferingIntoPackageInfoPerPackage(
  offering: Offering,
): Record<string, PackageInfo> {
  const mappedEntries = Object.entries(offering.packagesById).map(
    ([packageId, pkg]) => [
      packageId,
      getPackageInfo(pkg, offering.webCheckoutURL),
    ],
  );
  return Object.fromEntries(mappedEntries);
}
