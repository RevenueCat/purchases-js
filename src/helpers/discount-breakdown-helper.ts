import type { DiscountPhase } from "../entities/offerings";
import type { Period } from "./duration-helper";
import {
  formatDiscountDisplayLabel,
  formatDiscountSuffixForPricingTable,
  formatLabelWithDiscountSuffix,
} from "./discount-suffix-helper";
import type { PriceBreakdown } from "../ui/ui-types";
import type { Translator } from "../ui/localization/translator";

export type ResolvedDiscountBreakdown = {
  discountAmountInMicros: number;
  label: string;
};

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
    const suffix = formatDiscountSuffixForPricingTable({
      appliedDiscount: promoCodeDiscount,
      appliedDiscountPercentage: promoCodeDiscount.percentage,
      promotionalPricePhase: purchaseOptionDiscount,
      basePeriod,
      translator,
    });
    return {
      discountAmountInMicros: promoCodeDiscount.discountedAmountInMicros,
      label: formatLabelWithDiscountSuffix(
        promoCodeDiscount.displayName,
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

  return {
    discountAmountInMicros,
    label: formatDiscountDisplayLabel(
      purchaseOptionDiscount.name,
      purchaseOptionDiscount,
      basePeriod,
      translator,
      fallbackDiscountName,
    ),
  };
}
