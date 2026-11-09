import {
  type Offering,
  type Package,
  ProductType,
} from "../entities/offerings";
import { type PackageInfo } from "@revenuecat/purchases-ui-js";
import { type Translator } from "../ui/localization/translator";
import { getDiscountVariablesByMostExpensivePricePerMonth } from "./paywall-discount-helpers";
import { getPackageMonthlyPrice } from "./paywall-variables-helpers";

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

interface ScopedDiscountContext {
  translator: Translator;
  /** Every subscription's monthly price in the offering: the candidates for a tab's most expensive. */
  pricesPerMonthMicros: number[];
}

function getPackageInfo(
  pkg: Package,
  offeringWebCheckoutURL?: string | null,
  scopedDiscounts?: ScopedDiscountContext,
): PackageInfo {
  // This would not work with Paddle.
  const product = pkg.product;

  const webCheckoutURL = resolveWebCheckoutURL(pkg, offeringWebCheckoutURL);
  const checkoutFields = webCheckoutURL !== undefined ? { webCheckoutURL } : {};

  const isSubscription = product.productType === ProductType.Subscription;
  const subscriptionOption = product.defaultSubscriptionOption;

  if (isSubscription && subscriptionOption) {
    const pricePerMonthMicros = getPackageMonthlyPrice(pkg);
    const scopedDiscountFields = scopedDiscounts
      ? {
          discountVariablesByMostExpensivePricePerMonth:
            getDiscountVariablesByMostExpensivePricePerMonth(
              subscriptionOption,
              product.price,
              product.period || subscriptionOption.base.period,
              // A tab that has this package can't have a cheaper most expensive package.
              scopedDiscounts.pricesPerMonthMicros.filter(
                (price) => price >= pricePerMonthMicros,
              ),
              scopedDiscounts.translator,
            ),
        }
      : {};
    return {
      hasTrial: subscriptionOption.trial !== null,
      hasIntroOffer: subscriptionOption.introPrice !== null,
      hasPromoOffer: subscriptionOption.discount !== null,
      pricePerMonthMicros,
      ...scopedDiscountFields,
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

  return {
    hasTrial: false,
    hasIntroOffer: false,
    hasPromoOffer: false,
    ...checkoutFields,
  };
}

/**
 * With a `translator`, subscriptions also carry their discount variables for each possible tab, so
 * ui-js can scope them to the selected tab.
 */
export function parseOfferingIntoPackageInfoPerPackage(
  offering: Offering,
  translator?: Translator,
): Record<string, PackageInfo> {
  const packages = Object.values(offering.packagesById);
  const scopedDiscounts = translator && {
    translator,
    pricesPerMonthMicros: [
      ...new Set(
        packages
          .filter(
            (pkg) =>
              pkg.product.productType === ProductType.Subscription &&
              pkg.product.defaultSubscriptionOption,
          )
          .map(getPackageMonthlyPrice),
      ),
    ],
  };
  const mappedEntries = Object.entries(offering.packagesById).map(
    ([packageId, pkg]) => [
      packageId,
      getPackageInfo(pkg, offering.webCheckoutURL, scopedDiscounts),
    ],
  );
  return Object.fromEntries(mappedEntries);
}
