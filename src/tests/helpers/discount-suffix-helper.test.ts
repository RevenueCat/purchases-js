import { describe, expect, test } from "vitest";
import { PeriodUnit } from "../../helpers/duration-helper";
import {
  formatDiscountDisplayLabel,
  formatDiscountSuffixForPricingTable,
  formatDiscountSuffixFromDiscountPhase,
  shouldRenderDiscountPeriodSuffix,
} from "../../helpers/discount-suffix-helper";
import { Translator } from "../../ui/localization/translator";
import type { DiscountPhase } from "../../entities/offerings";

const translator = new Translator();

const baseDiscountFields = {
  price: {
    amount: 1,
    amountMicros: 1_000_000,
    currency: "USD",
    formattedPrice: "$1.00",
  },
  name: "Holiday Sale",
  periodDuration: "P1M",
  period: { number: 1, unit: PeriodUnit.Month },
  cycleCount: 1,
  discountType: "percentage" as const,
  fixedAmount: null,
};

describe("discount-suffix-helper", () => {
  describe("shouldRenderDiscountPeriodSuffix", () => {
    test("returns false when discount window fits within one billing cycle", () => {
      expect(
        shouldRenderDiscountPeriodSuffix(
          { number: 1, unit: PeriodUnit.Month },
          { number: 1, unit: PeriodUnit.Month },
        ),
      ).toBe(false);
    });

    test("returns true when discount window exceeds one billing cycle", () => {
      expect(
        shouldRenderDiscountPeriodSuffix(
          { number: 1, unit: PeriodUnit.Month },
          { number: 3, unit: PeriodUnit.Month },
        ),
      ).toBe(true);
    });
  });

  describe("formatDiscountSuffixFromDiscountPhase", () => {
    test("returns percentage-only suffix for one_time discounts", () => {
      const discount: DiscountPhase = {
        ...baseDiscountFields,
        durationMode: "one_time",
        timeWindow: null,
        percentage: 20,
      };

      expect(
        formatDiscountSuffixFromDiscountPhase(
          discount,
          { number: 1, unit: PeriodUnit.Month },
          translator,
        ),
      ).toBe("20% off");
    });

    test("returns percentage-only suffix for forever discounts", () => {
      const discount: DiscountPhase = {
        ...baseDiscountFields,
        durationMode: "forever",
        timeWindow: null,
        percentage: 30,
      };

      expect(
        formatDiscountSuffixFromDiscountPhase(
          discount,
          { number: 1, unit: PeriodUnit.Month },
          translator,
        ),
      ).toBe("30% off");
    });

    test("appends period for multi-cycle time_window discounts", () => {
      const discount: DiscountPhase = {
        ...baseDiscountFields,
        durationMode: "time_window",
        timeWindow: "P3M",
        percentage: 20,
      };

      expect(
        formatDiscountSuffixFromDiscountPhase(
          discount,
          { number: 1, unit: PeriodUnit.Month },
          translator,
        ),
      ).toBe("20% off for 3 months");
    });

    test("returns null when discount has no percentage", () => {
      const discount: DiscountPhase = {
        ...baseDiscountFields,
        durationMode: "one_time",
        timeWindow: null,
        percentage: null,
      };

      expect(
        formatDiscountSuffixFromDiscountPhase(
          discount,
          { number: 1, unit: PeriodUnit.Month },
          translator,
        ),
      ).toBeNull();
    });
  });

  describe("formatDiscountDisplayLabel", () => {
    test("suffixes the discount name when percentage is available", () => {
      const discount: DiscountPhase = {
        ...baseDiscountFields,
        durationMode: "time_window",
        timeWindow: "P3M",
        percentage: 20,
        name: "Holiday Sale $7.99",
      };

      expect(
        formatDiscountDisplayLabel(
          discount.name,
          discount,
          { number: 1, unit: PeriodUnit.Month },
          translator,
          "Discount",
        ),
      ).toBe("Holiday Sale $7.99 (20% off for 3 months)");
    });

    test("falls back to the provided name when discount name is empty", () => {
      const discount: DiscountPhase = {
        ...baseDiscountFields,
        durationMode: "one_time",
        timeWindow: null,
        percentage: 20,
        name: null,
      };

      expect(
        formatDiscountDisplayLabel(
          discount.name,
          discount,
          { number: 1, unit: PeriodUnit.Month },
          translator,
          "Discount",
        ),
      ).toBe("Discount (20% off)");
    });
  });

  describe("formatDiscountSuffixForPricingTable", () => {
    test("uses refreshed pricing metadata for applied promo codes", () => {
      expect(
        formatDiscountSuffixForPricingTable({
          appliedDiscount: {
            identifier: "SAVE10",
            displayName: "SAVE10",
            discountedAmountInMicros: 100_000,
            percentage: 10,
            discountCode: "SAVE10",
            durationMode: "time_window",
            timeWindow: "P3M",
          },
          appliedDiscountPercentage: null,
          promotionalPricePhase: null,
          basePeriod: { number: 1, unit: PeriodUnit.Month },
          translator,
        }),
      ).toBe("10% off for 3 months");
    });
  });
});
