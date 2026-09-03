import type { PaywallPackage } from "@revenuecat/purchases-ui-js";
import {
  type Offering,
  type Package,
  type Price,
  type Product,
  ProductType,
} from "../entities/offerings";

/**
 * Map an offering's packages to SDK PaywallPackage[] for custom-component context.
 *
 * Mapping rules:
 * - offering.availablePackages -> PaywallPackage[]
 * - package.identifier; display_name from webBillingProduct.title (fallback identifier)
 * - product.identifier; display_name from title; is_subscription when ProductType.Subscription; period from normalPeriodDuration
 * - price: amountMicros / 1_000_000 (NOT deprecated Price.amount cents); omit price if missing
 * - store.store_type: "rc_billing"; omit country and is_family_shareable
 * - is_auto_renewing: true only for Subscription, else omit
 */
export function buildPaywallContextPackages(
  offering: Offering,
): PaywallPackage[] {
  return offering.availablePackages.map(mapPackage);
}

function mapPackage(pkg: Package): PaywallPackage {
  const product = pkg.webBillingProduct;
  return {
    identifier: pkg.identifier,
    display_name: product?.title || pkg.identifier,
    products: product ? [mapProduct(product)] : [],
  };
}

function mapProduct(product: Product): PaywallPackage["products"][number] {
  const isSubscription = product.productType === ProductType.Subscription;
  const price = mapPrice(product.price);

  return {
    identifier: product.identifier,
    store: { store_type: "rc_billing" },
    display_name: product.title || product.identifier,
    is_subscription: isSubscription,
    ...(product.normalPeriodDuration
      ? { period: product.normalPeriodDuration }
      : {}),
    ...(isSubscription ? { is_auto_renewing: true } : {}),
    ...(price ? { price } : {}),
  };
}

function mapPrice(
  price: Price | null | undefined,
): { amount: number; currency: string } | undefined {
  if (price == null || typeof price.amountMicros !== "number") {
    return undefined;
  }
  return {
    amount: price.amountMicros / 1_000_000,
    currency: price.currency,
  };
}
