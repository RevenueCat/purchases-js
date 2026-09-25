import type { PricePreviewResponse } from "@paddle/paddle-js";
import {
  type DiscountPhase,
  getPriceForCurrency,
  type NonSubscriptionOption,
  type Offering,
  type Package,
  type Price,
  type Product,
  ProductType,
  type SubscriptionOption,
} from "../entities/offerings";
import { parseISODuration, type Period } from "../helpers/duration-helper";
import { getCurrencyFractionDigits } from "../helpers/price-labels";

type PricePreviewLineItem =
  PricePreviewResponse["data"]["details"]["lineItems"][number];

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
 * Scales `basePrice` by the fraction of the pre-tax subtotal Paddle keeps
 * after the discount, rounded down to the currency's minor unit.
 *
 * Paddle applies discounts to the pre-tax `subtotal`, which for tax-inclusive
 * prices is lower than the catalog price shown to the customer (e.g. $29.99
 * with 22% VAT has a $24.58 subtotal). Scaling the displayed price instead of
 * subtracting the raw discount keeps the offer price consistent with the base
 * price on the paywall and with the total charged at checkout, whether the
 * price is tax-inclusive or not.
 */
function scalePriceByPaidFraction(
  basePrice: Price,
  subtotalMinorUnits: number,
  discountMinorUnits: number,
): number {
  const fractionDigits = getCurrencyFractionDigits(basePrice.currency);
  const microsPerMinorUnit = 10 ** (6 - fractionDigits);
  const paidMinorUnits = Math.max(subtotalMinorUnits - discountMinorUnits, 0);
  const discountedMinorUnits =
    (basePrice.amountMicros * paidMinorUnits) /
    (subtotalMinorUnits * microsPerMinorUnit);
  // Small epsilon so exact results (e.g. 1999.0000000001) are not floored down.
  return Math.floor(discountedMinorUnits + 1e-6) * microsPerMinorUnit;
}

/**
 * Maps the first line item of a Paddle `PricePreview` response into a
 * RevenueCat {@link DiscountPhase}. Returns `null` when Paddle did not apply
 * any discount to the item (unknown, expired or non-applicable discount).
 *
 * `basePrice` is the RevenueCat product price displayed on the paywall; the
 * discounted price is derived from it (see {@link scalePriceByPaidFraction}).
 */
export function toDiscountPhaseFromPricePreview(
  response: PricePreviewResponse,
  fallbackPeriodDuration: string | null,
  basePrice: Price,
): DiscountPhase | null {
  const lineItem = response.data.details.lineItems[0];
  const applied = lineItem?.discounts?.[0];
  if (!lineItem || !applied) {
    return null;
  }

  const subtotalMinorUnits = Number(lineItem.totals.subtotal);
  const discountMinorUnits = Number(lineItem.totals.discount);
  if (
    !Number.isFinite(subtotalMinorUnits) ||
    !Number.isFinite(discountMinorUnits) ||
    subtotalMinorUnits <= 0 ||
    discountMinorUnits <= 0
  ) {
    return null;
  }

  const currency = basePrice.currency;
  const discountedMicros = scalePriceByPaidFraction(
    basePrice,
    subtotalMinorUnits,
    discountMinorUnits,
  );

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
    // Expressed against the displayed base price so "X off" matches the
    // base → offer price pair shown on the paywall.
    fixedAmount: isPercentage
      ? null
      : getPriceForCurrency(
          Math.max(basePrice.amountMicros - discountedMicros, 0),
          currency,
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
 *
 * Trial and intro phases are intentionally kept: Paddle never discounts the
 * trial charge and instead applies the discount to the first billing period
 * after the trial, so both offers are genuinely present at checkout. The
 * paywall helpers already prefer the discount when both exist.
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
  const product = withPaddleDiscountOnProduct(pkg.product, discount);
  return {
    ...pkg,
    rcBillingProduct: product,
    webBillingProduct: product,
    product,
  };
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
