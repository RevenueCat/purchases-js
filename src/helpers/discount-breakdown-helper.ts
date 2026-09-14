import {
  ProductType,
  type DiscountPhase,
  type NonSubscriptionOption,
  type Product,
  type PurchaseOption,
  type SubscriptionOption,
} from "../entities/offerings";
import { parseISODuration, type Period } from "./duration-helper";
import { getDurationInDays } from "./paywall-period-helpers";
import type { AppliedDiscount, PriceBreakdown } from "../ui/ui-types";
import type { Translator } from "../ui/localization/translator";
import { LocalizationKeys } from "../ui/localization/supportedLanguages";

type DiscountSuffixSource = Pick<
  DiscountPhase,
  "percentage" | "durationMode" | "timeWindow" | "period" | "cycleCount"
>;

export type ResolvedDiscountBreakdown = {
  discountAmountInMicros: number;
  displayName: string;
  suffix: string | null;
  label: string;
};

function shouldRenderDiscountPeriodSuffix(
  basePeriod: Period | null | undefined,
  discountDuration: Period | null | undefined,
): boolean {
  if (!basePeriod || !discountDuration) {
    return false;
  }

  const billingCycleDays = getDurationInDays(basePeriod);
  const discountWindowDays = getDurationInDays(discountDuration);

  return billingCycleDays > 0 && discountWindowDays > billingCycleDays;
}

function formatPercentageDiscountSuffix(percentage: number): string {
  return `${percentage}% off`;
}

function formatTimeWindowDiscountSuffix(
  percentage: number,
  discountDuration: Period | null,
  basePeriod: Period | null | undefined,
  translator: Translator,
): string {
  if (!shouldRenderDiscountPeriodSuffix(basePeriod, discountDuration)) {
    return formatPercentageDiscountSuffix(percentage);
  }

  const translatedPeriod = translator.translatePeriod(
    discountDuration!.number,
    discountDuration!.unit,
  );

  return `${percentage}% off for ${translatedPeriod}`;
}

function getDiscountDurationFromPhase(
  discount: DiscountSuffixSource,
): Period | null {
  if (discount.durationMode === "time_window" && discount.timeWindow) {
    return parseISODuration(discount.timeWindow);
  }

  if (
    discount.durationMode === "time_window" &&
    discount.period &&
    discount.cycleCount > 0
  ) {
    return {
      number: discount.period.number * discount.cycleCount,
      unit: discount.period.unit,
    };
  }

  return null;
}

function formatDiscountSuffixFromDiscountPhase(
  discount: DiscountSuffixSource,
  basePeriod: Period | null | undefined,
  translator: Translator,
): string | null {
  if (discount.percentage == null) {
    return null;
  }

  if (discount.durationMode === "time_window") {
    return formatTimeWindowDiscountSuffix(
      discount.percentage,
      getDiscountDurationFromPhase(discount),
      basePeriod,
      translator,
    );
  }

  return formatPercentageDiscountSuffix(discount.percentage);
}

function formatDiscountSuffixForPromo({
  appliedDiscount,
  purchaseOptionDiscount,
  basePeriod,
  translator,
}: {
  appliedDiscount: AppliedDiscount;
  purchaseOptionDiscount: DiscountPhase | null;
  basePeriod: Period | null | undefined;
  translator: Translator;
}): string | null {
  const percentage = appliedDiscount.percentage;
  if (percentage == null) {
    return null;
  }

  if (
    appliedDiscount.durationMode === "time_window" &&
    appliedDiscount.timeWindow
  ) {
    return formatTimeWindowDiscountSuffix(
      percentage,
      parseISODuration(appliedDiscount.timeWindow),
      basePeriod,
      translator,
    );
  }

  if (
    !purchaseOptionDiscount ||
    purchaseOptionDiscount.durationMode !== "time_window"
  ) {
    return formatPercentageDiscountSuffix(percentage);
  }

  const discountPeriod = purchaseOptionDiscount.period;
  if (!discountPeriod || purchaseOptionDiscount.cycleCount <= 0) {
    return formatPercentageDiscountSuffix(percentage);
  }

  return formatTimeWindowDiscountSuffix(
    percentage,
    {
      number: discountPeriod.number * purchaseOptionDiscount.cycleCount,
      unit: discountPeriod.unit,
    },
    basePeriod,
    translator,
  );
}

function formatLabelWithDiscountSuffix(
  displayName: string | null | undefined,
  suffix: string | null,
  fallbackName: string,
): string {
  const name = displayName?.trim() || fallbackName;
  return suffix ? `${name} (${suffix})` : name;
}

function formatDiscountDisplayLabel(
  displayName: string | null | undefined,
  discount: DiscountSuffixSource,
  basePeriod: Period | null | undefined,
  translator: Translator,
  fallbackName: string,
): string {
  const suffix = formatDiscountSuffixFromDiscountPhase(
    discount,
    basePeriod,
    translator,
  );

  return formatLabelWithDiscountSuffix(displayName, suffix, fallbackName);
}

export function resolveDiscountBreakdown({
  priceBreakdown,
  purchaseOptionDiscount,
  fullPriceMicros,
  basePeriod,
  translator,
  fallbackDiscountName,
}: {
  priceBreakdown: PriceBreakdown;
  purchaseOptionDiscount: DiscountPhase | null;
  fullPriceMicros: number;
  basePeriod: Period | null | undefined;
  translator: Translator;
  fallbackDiscountName: string;
}): ResolvedDiscountBreakdown | null {
  const promoCodeDiscount = priceBreakdown.appliedDiscounts?.[0];
  if (promoCodeDiscount && promoCodeDiscount.discountedAmountInMicros > 0) {
    const suffix = formatDiscountSuffixForPromo({
      appliedDiscount: promoCodeDiscount,
      purchaseOptionDiscount,
      basePeriod,
      translator,
    });
    const displayName = promoCodeDiscount.displayName;
    return {
      discountAmountInMicros: promoCodeDiscount.discountedAmountInMicros,
      displayName: displayName?.trim() || fallbackDiscountName,
      suffix,
      label: formatLabelWithDiscountSuffix(
        displayName,
        suffix,
        fallbackDiscountName,
      ),
    };
  }

  if (!purchaseOptionDiscount) return null;

  const discountedPriceMicros = purchaseOptionDiscount.price?.amountMicros;
  if (discountedPriceMicros == null) return null;

  const discountAmountInMicros = fullPriceMicros - discountedPriceMicros;
  if (discountAmountInMicros <= 0) return null;

  const suffix = formatDiscountSuffixFromDiscountPhase(
    purchaseOptionDiscount,
    basePeriod,
    translator,
  );
  const displayName = purchaseOptionDiscount.name;

  return {
    discountAmountInMicros,
    displayName: displayName?.trim() || fallbackDiscountName,
    suffix,
    label: formatDiscountDisplayLabel(
      displayName,
      purchaseOptionDiscount,
      basePeriod,
      translator,
      fallbackDiscountName,
    ),
  };
}

export function resolveDiscountBreakdownForPurchaseOption({
  priceBreakdown,
  productDetails,
  purchaseOption,
  translator,
}: {
  priceBreakdown: PriceBreakdown;
  productDetails: Product;
  purchaseOption: PurchaseOption;
  translator: Translator;
}): ResolvedDiscountBreakdown | null {
  const isSubscription =
    productDetails.productType === ProductType.Subscription;
  const subscriptionOption = isSubscription
    ? (purchaseOption as SubscriptionOption)
    : null;
  const nonSubscriptionOption = !isSubscription
    ? (purchaseOption as NonSubscriptionOption)
    : null;

  const purchaseOptionDiscount =
    subscriptionOption?.discount ?? nonSubscriptionOption?.discount ?? null;
  const fullPriceMicros = isSubscription
    ? (subscriptionOption?.base.price?.amountMicros ??
      productDetails.price.amountMicros)
    : (nonSubscriptionOption?.basePrice.amountMicros ??
      productDetails.price.amountMicros);
  const basePeriod = isSubscription ? subscriptionOption?.base.period : null;

  return resolveDiscountBreakdown({
    priceBreakdown,
    purchaseOptionDiscount,
    fullPriceMicros,
    basePeriod,
    translator,
    fallbackDiscountName: translator.translate(
      LocalizationKeys.PricingTableDiscount,
    ),
  });
}
