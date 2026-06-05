import { describe, expect, test } from "vitest";
import { PeriodUnit } from "../../helpers/duration-helper";
import { resolveDiscountBreakdown } from "../../helpers/discount-breakdown-helper";
import type { DiscountPhase } from "../../entities/offerings";
import type { PriceBreakdown } from "../../ui/ui-types";
import { Translator } from "../../ui/localization/translator";

const translator = new Translator();
const fallback = "Discount";

const baseBreakdown: PriceBreakdown = {
  currency: "USD",
  totalAmountInMicros: 8_900_000,
  totalExcludingTaxInMicros: 8_900_000,
  taxCalculationStatus: "disabled",
  taxAmountInMicros: 0,
  taxBreakdown: null,
};

const purchaseOptionDiscount: DiscountPhase = {
  durationMode: "one_time",
  timeWindow: null,
  name: "One-time Discount to $1",
  periodDuration: "P1M",
  period: { number: 1, unit: PeriodUnit.Month },
  cycleCount: 1,
  discountType: "percentage",
  percentage: 20,
  fixedAmount: null,
  price: {
    amount: 1,
    amountMicros: 1_000_000,
    currency: "USD",
    formattedPrice: "$1.00",
  },
};

describe("resolveDiscountBreakdown", () => {
  test("returns purchaseOptionDiscount amount and label", () => {
    const result = resolveDiscountBreakdown({
      priceBreakdown: baseBreakdown,
      purchaseOptionDiscount,
      fullPriceMicros: 9_900_000,
      basePeriod: { number: 1, unit: PeriodUnit.Month },
      translator,
      fallbackDiscountName: fallback,
    });

    expect(result).toEqual({
      discountAmountInMicros: 8_900_000,
      label: "One-time Discount to $1 (20% off)",
    });
  });

  test("returns promoCodeDiscount when purchase option has no discount", () => {
    const result = resolveDiscountBreakdown({
      priceBreakdown: {
        ...baseBreakdown,
        appliedDiscounts: [
          {
            identifier: "save10",
            displayName: "SAVE10",
            discountedAmountInMicros: 1_000_000,
            percentage: 10,
            discountCode: "SAVE10",
          },
        ],
      },
      purchaseOptionDiscount: null,
      fullPriceMicros: 9_900_000,
      basePeriod: { number: 1, unit: PeriodUnit.Month },
      translator,
      fallbackDiscountName: fallback,
    });

    expect(result).toEqual({
      discountAmountInMicros: 1_000_000,
      label: "SAVE10 (10% off)",
    });
  });

  test("prefers promoCodeDiscount over purchaseOptionDiscount", () => {
    const result = resolveDiscountBreakdown({
      priceBreakdown: {
        ...baseBreakdown,
        appliedDiscounts: [
          {
            identifier: "save10",
            displayName: "SAVE10",
            discountedAmountInMicros: 1_000_000,
            percentage: 10,
            discountCode: "SAVE10",
          },
        ],
      },
      purchaseOptionDiscount,
      fullPriceMicros: 9_900_000,
      basePeriod: { number: 1, unit: PeriodUnit.Month },
      translator,
      fallbackDiscountName: fallback,
    });

    expect(result?.discountAmountInMicros).toBe(1_000_000);
    expect(result?.label).toBe("SAVE10 (10% off)");
  });

  test("returns null when there is no discount", () => {
    expect(
      resolveDiscountBreakdown({
        priceBreakdown: baseBreakdown,
        purchaseOptionDiscount: null,
        fullPriceMicros: 9_900_000,
        basePeriod: null,
        translator,
        fallbackDiscountName: fallback,
      }),
    ).toBeNull();
  });
});
