import type { DiscountPhase, PricingPhase } from "../entities/offerings";
import { parseISODuration, type Period } from "./duration-helper";
import { getDurationInDays } from "./paywall-period-helpers";
import type { AppliedDiscount } from "../ui/ui-types";
import type { Translator } from "../ui/localization/translator";

type DiscountSuffixSource = Pick<
  DiscountPhase,
  "percentage" | "durationMode" | "timeWindow" | "period" | "cycleCount"
>;

export function shouldRenderDiscountPeriodSuffix(
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

export function formatPercentageDiscountSuffix(percentage: number): string {
  return `${percentage}% off`;
}

export function formatTimeWindowDiscountSuffix(
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

export function formatDiscountSuffixFromDiscountPhase(
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

export function formatDiscountSuffixForPricingTable({
  appliedDiscount,
  appliedDiscountPercentage,
  promotionalPricePhase,
  basePeriod,
  translator,
}: {
  appliedDiscount: AppliedDiscount | null;
  appliedDiscountPercentage: number | null;
  promotionalPricePhase: PricingPhase | DiscountPhase | null;
  basePeriod: Period | null | undefined;
  translator: Translator;
}): string | null {
  const percentage = appliedDiscount?.percentage ?? appliedDiscountPercentage;
  if (percentage == null) {
    return null;
  }

  if (
    appliedDiscount?.durationMode === "time_window" &&
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
    !promotionalPricePhase ||
    !("durationMode" in promotionalPricePhase) ||
    promotionalPricePhase.durationMode !== "time_window"
  ) {
    return formatPercentageDiscountSuffix(percentage);
  }

  const discountPeriod = promotionalPricePhase.period;
  if (!discountPeriod || promotionalPricePhase.cycleCount <= 0) {
    return formatPercentageDiscountSuffix(percentage);
  }

  return formatTimeWindowDiscountSuffix(
    percentage,
    {
      number: discountPeriod.number * promotionalPricePhase.cycleCount,
      unit: discountPeriod.unit,
    },
    basePeriod,
    translator,
  );
}

export function formatLabelWithDiscountSuffix(
  displayName: string | null | undefined,
  suffix: string | null,
  fallbackName: string,
): string {
  const name = displayName?.trim() || fallbackName;
  return suffix ? `${name} (${suffix})` : name;
}

export function formatDiscountDisplayLabel(
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
