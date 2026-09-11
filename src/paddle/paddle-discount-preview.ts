import type { PricePreviewResponse } from "@paddle/paddle-js";
import {
  type DiscountPhase,
  getPriceForCurrency,
  type NonSubscriptionOption,
  type Offering,
  type Package,
  type Product,
  ProductType,
  type SubscriptionOption,
} from "../entities/offerings";
import { parseISODuration, type Period } from "../helpers/duration-helper";
import { getCurrencyFractionDigits } from "../helpers/price-labels";

type PricePreviewLineItem =
  PricePreviewResponse["data"]["details"]["lineItems"][number];

/**
 * Paddle returns amounts as strings in the currency's minor unit (e.g. "1999"
 * for $19.99, "1500" for ¥1500). Convert to RevenueCat micros.
 */
export function paddleAmountToMicros(amount: string, currency: string): number {
  const minorUnits = Number(amount);
  if (!Number.isFinite(minorUnits)) {
    return 0;
  }
  const fractionDigits = getCurrencyFractionDigits(currency);
  return Math.round(minorUnits * 10 ** (6 - fractionDigits));
}

function toPeriod(
  billingCycle: PricePreviewLineItem["price"]["billingCycle"],
  fallbackPeriodDuration: string | null,
): { period: Period | null; periodDuration: string | null } {
  if (billingCycle) {
    const unitLetter = { day: "D", week: "W", month: "M", year: "Y" }[
      billingCycle.interval
    ];
    const periodDuration = `P${billingCycle.frequency}${unitLetter}`;
    return { period: parseISODuration(periodDuration), periodDuration };
  }
  if (fallbackPeriodDuration) {
    return {
      period: parseISODuration(fallbackPeriodDuration),
      periodDuration: fallbackPeriodDuration,
    };
  }
  return { period: null, periodDuration: null };
}

/**
 * Maps the first line item of a Paddle `PricePreview` response into a
 * RevenueCat {@link DiscountPhase}. Returns `null` when Paddle did not apply
 * any discount to the item (unknown, expired or non-applicable discount).
 */
export function toDiscountPhaseFromPricePreview(
  response: PricePreviewResponse,
  fallbackPeriodDuration: string | null,
): DiscountPhase | null {
  const lineItem = response.data.details.lineItems[0];
  const applied = lineItem?.discounts?.[0];
  if (!lineItem || !applied) {
    return null;
  }

  const currency = response.data.currencyCode;
  const subtotalMicros = paddleAmountToMicros(
    lineItem.totals.subtotal,
    currency,
  );
  const discountMicros = paddleAmountToMicros(
    lineItem.totals.discount,
    currency,
  );
  if (discountMicros <= 0) {
    return null;
  }
  const discountedMicros = Math.max(subtotalMicros - discountMicros, 0);

  const { discount } = applied;
  const isPercentage = discount.type === "percentage";
  const { period, periodDuration } = toPeriod(
    lineItem.price.billingCycle,
    fallbackPeriodDuration,
  );

  let durationMode: DiscountPhase["durationMode"] = "one_time";
  let cycleCount = 0;
  if (discount.recur) {
    if (discount.maximumRecurringIntervals) {
      durationMode = "time_window";
      cycleCount = discount.maximumRecurringIntervals;
    } else {
      durationMode = "forever";
    }
  }

  return {
    durationMode,
    timeWindow: durationMode === "time_window" ? periodDuration : null,
    price: getPriceForCurrency(discountedMicros, currency),
    name: discount.description || null,
    periodDuration,
    period,
    cycleCount,
    discountType: isPercentage ? "percentage" : "fixed_amount",
    percentage: isPercentage ? Number(discount.amount) : null,
    fixedAmount: isPercentage
      ? null
      : getPriceForCurrency(
          paddleAmountToMicros(
            discount.amount,
            discount.currencyCode ?? currency,
          ),
          discount.currencyCode ?? currency,
        ),
  };
}

function withDiscountOnSubscriptionOption(
  option: SubscriptionOption,
  discount: DiscountPhase,
): SubscriptionOption {
  return { ...option, discount };
}

function withDiscountOnNonSubscriptionOption(
  option: NonSubscriptionOption,
  discount: DiscountPhase,
): NonSubscriptionOption {
  return { ...option, discount };
}

/**
 * Returns a copy of `product` with `discount` applied to its default
 * purchase option (and the matching entry in `subscriptionOptions`), so the
 * existing paywall variable/package-info helpers surface it like a catalog
 * discount.
 */
export function withPaddleDiscountOnProduct(
  product: Product,
  discount: DiscountPhase,
): Product {
  if (
    product.productType === ProductType.Subscription &&
    product.defaultSubscriptionOption
  ) {
    const defaultOption = withDiscountOnSubscriptionOption(
      product.defaultSubscriptionOption,
      discount,
    );
    const subscriptionOptions = { ...product.subscriptionOptions };
    if (subscriptionOptions[defaultOption.id]) {
      subscriptionOptions[defaultOption.id] = defaultOption;
    }
    return {
      ...product,
      defaultPurchaseOption: defaultOption,
      defaultSubscriptionOption: defaultOption,
      subscriptionOptions,
      discountPhase: discount,
    };
  }

  if (product.defaultNonSubscriptionOption) {
    const defaultOption = withDiscountOnNonSubscriptionOption(
      product.defaultNonSubscriptionOption,
      discount,
    );
    return {
      ...product,
      defaultPurchaseOption: defaultOption,
      defaultNonSubscriptionOption: defaultOption,
      discountPhase: discount,
    };
  }

  return product;
}

export function withPaddleDiscountOnPackage(
  pkg: Package,
  discount: DiscountPhase,
): Package {
  const product = withPaddleDiscountOnProduct(pkg.webBillingProduct, discount);
  return { ...pkg, rcBillingProduct: product, webBillingProduct: product };
}

/**
 * Returns a copy of `offering` where the packages in `discountsByPackage`
 * carry the given discount phase. Packages without an entry are left as-is.
 */
export function withPaddleDiscountsOnOffering(
  offering: Offering,
  discountsByPackage: Record<string, DiscountPhase>,
): Offering {
  const replace = (pkg: Package | null): Package | null => {
    if (!pkg) return null;
    const discount = discountsByPackage[pkg.identifier];
    return discount ? withPaddleDiscountOnPackage(pkg, discount) : pkg;
  };

  const availablePackages = offering.availablePackages.map(
    (pkg) => replace(pkg) as Package,
  );
  const packagesById = Object.fromEntries(
    availablePackages.map((pkg) => [pkg.identifier, pkg]),
  );

  return {
    ...offering,
    availablePackages,
    packagesById,
    lifetime: replace(offering.lifetime),
    annual: replace(offering.annual),
    sixMonth: replace(offering.sixMonth),
    threeMonth: replace(offering.threeMonth),
    twoMonth: replace(offering.twoMonth),
    monthly: replace(offering.monthly),
    weekly: replace(offering.weekly),
  };
}
