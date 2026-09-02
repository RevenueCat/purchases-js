import { describe, expect, test } from "vitest";
import {
  floorMicrosToCurrencyUnit,
  formatPrice,
  formatPriceWithPeriod,
  getPeriodDurationLabel,
  getTranslatedPeriodFrequency,
} from "../../helpers/price-labels";
import { getOfferDuration } from "../../helpers/paywall-offer-helpers";
import { PeriodUnit } from "../../helpers/duration-helper";
import { Translator } from "../../ui/localization/translator";
import {
  subscriptionOptionWithMultipleWeeksIntroPriceRecurring,
  subscriptionOptionWithSingleWeekIntroPriceRecurring,
} from "../../stories/fixtures";

describe("getRenewsLabel", () => {
  const translator: Translator = new Translator();

  test("should return correct text for single period durations", () => {
    expect(getTranslatedPeriodFrequency("P1Y", translator)).toEqual("yearly");
    expect(getTranslatedPeriodFrequency("P1M", translator)).toEqual("monthly");
    expect(getTranslatedPeriodFrequency("P1W", translator)).toEqual("weekly");
    expect(getTranslatedPeriodFrequency("P1D", translator)).toEqual("daily");
  });

  test("should return correct text for multiple period durations", () => {
    expect(getTranslatedPeriodFrequency("P2Y", translator)).toEqual(
      "every 2 years",
    );
    expect(getTranslatedPeriodFrequency("P3M", translator)).toEqual(
      "every 3 months",
    );
    expect(getTranslatedPeriodFrequency("P2W", translator)).toEqual(
      "every 2 weeks",
    );
    expect(getTranslatedPeriodFrequency("P14D", translator)).toEqual(
      "every 14 days",
    );
  });
});

describe("floorMicrosToCurrencyUnit", () => {
  test("floors to nearest cent for 2-decimal currencies (USD)", () => {
    // 1,166,666 micros = $1.166666 → floor to $1.16 = 1,160,000 micros
    expect(floorMicrosToCurrencyUnit(1166666, "USD")).toBe(1160000);
  });

  test("does not change exact cent boundaries", () => {
    expect(floorMicrosToCurrencyUnit(1160000, "USD")).toBe(1160000);
    expect(floorMicrosToCurrencyUnit(5000000, "USD")).toBe(5000000);
  });

  test("handles zero", () => {
    expect(floorMicrosToCurrencyUnit(0, "USD")).toBe(0);
  });

  test("floors to nearest unit for 0-decimal currencies (JPY)", () => {
    // 19,178,082 micros = 19.178082 JPY → floor to 19 JPY = 19,000,000 micros
    expect(floorMicrosToCurrencyUnit(19178082, "JPY")).toBe(19000000);
    expect(floorMicrosToCurrencyUnit(1000000, "JPY")).toBe(1000000);
  });

  test("handles 2-decimal EUR", () => {
    expect(floorMicrosToCurrencyUnit(2077000, "EUR")).toBe(2070000);
  });

  test("handles floating-point epsilon (value that is mathematically exact)", () => {
    // 5,000,000 * (30/365) = 410,958.904109... but in FP might have epsilon
    // The result should be consistent regardless of FP noise
    const micros = 5000000 * (30 / 365);
    const result = floorMicrosToCurrencyUnit(micros, "USD");
    expect(result).toBe(410000);
  });
});

describe("formatPrice", () => {
  test("should return expected formatted price", () => {
    expect(formatPrice(9990000, "USD", "en-US")).toEqual("$9.99");
    expect(formatPrice(10000000, "USD", "en-US")).toEqual("$10.00");
    expect(formatPrice(990000, "USD", "en-US")).toEqual("$0.99");
    expect(formatPrice(9900000, "USD", "es-MX")).toEqual("USD 9.90");
    expect(formatPrice(9900000, "MXN", "es-MX")).toEqual("$9.90");
    expect(formatPrice(9990000, "EUR", "en-US")).toEqual("€9.99");
    expect(formatPrice(9990000, "USD", "es-ES")).toEqual("9,99 $");
    expect(formatPrice(9990000, "USD", "en-GB")).toEqual("$9.99");
    expect(formatPrice(9990000, "CNY", "en-US")).toEqual("CN¥9.99");
    expect(formatPrice(9990000, "CNY", "zh-CN")).toEqual("¥9.99");
  });
});

describe("formatPriceWithPeriod", () => {
  const translator: Translator = new Translator();

  test("returns the bare price when period is missing", () => {
    expect(formatPriceWithPeriod("$9.99", null, translator)).toEqual("$9.99");
    expect(formatPriceWithPeriod("$9.99", undefined, translator)).toEqual(
      "$9.99",
    );
  });

  test("appends a short singular period unit", () => {
    expect(
      formatPriceWithPeriod(
        "$9.99",
        { number: 1, unit: PeriodUnit.Month },
        translator,
      ),
    ).toEqual("$9.99/mo");
  });

  test("appends a short multi-unit period", () => {
    expect(
      formatPriceWithPeriod(
        "$9.99",
        { number: 3, unit: PeriodUnit.Month },
        translator,
      ),
    ).toEqual("$9.99/3mo");
  });
});

describe("getPeriodDurationLabel", () => {
  const translator: Translator = new Translator();
  const spanishTranslator: Translator = new Translator({}, "es", "en");

  const oneWeek = { number: 1, unit: PeriodUnit.Week };
  const twoWeeks = { number: 2, unit: PeriodUnit.Week };

  test("pluralises multi-unit durations", () => {
    expect(getPeriodDurationLabel(twoWeeks, translator)).toEqual("2 weeks");
  });

  test("keeps the leading 1 by default", () => {
    expect(getPeriodDurationLabel(oneWeek, translator)).toEqual("1 week");
  });

  test("drops the leading 1 in English when asked", () => {
    expect(
      getPeriodDurationLabel(oneWeek, translator, {
        collapseSingularInEnglish: true,
      }),
    ).toEqual("week");
  });

  test("keeps the leading 1 outside English even when asked", () => {
    expect(
      getPeriodDurationLabel(oneWeek, spanishTranslator, {
        collapseSingularInEnglish: true,
      }),
    ).toEqual("1 semana");
  });

  test.each(["en-US", "en_US", "en-GB", "EN"])(
    "collapses for the English variant %s",
    (locale) => {
      // selectedLocale is often navigator.language or a paywall locale key, and
      // Translator resolves those to the English strings, so the collapse has to
      // match on the language subtag rather than the whole locale.
      expect(
        getPeriodDurationLabel(oneWeek, new Translator({}, locale, "en"), {
          collapseSingularInEnglish: true,
        }),
      ).toEqual("week");
    },
  );

  test("does not collapse for a non-English regional locale", () => {
    expect(
      getPeriodDurationLabel(oneWeek, new Translator({}, "es-MX", "en"), {
        collapseSingularInEnglish: true,
      }),
    ).toEqual("1 semana");
  });

  test("returns an empty label when there is no period", () => {
    expect(getPeriodDurationLabel(null, translator)).toEqual("");
  });

  test("clamps a zero cycle count via getOfferDuration", () => {
    // cycleCount defaults to 0 in the offerings entity, which must read as one
    // cycle rather than "0 weeks" — the label and the end date are derived from
    // the same getOfferDuration result so they cannot disagree.
    const zeroCycleWeek = {
      ...subscriptionOptionWithSingleWeekIntroPriceRecurring.introPrice!,
      cycleCount: 0,
    };
    expect(
      getPeriodDurationLabel(getOfferDuration(zeroCycleWeek), translator),
    ).toEqual("1 week");
  });

  test("multiplies the phase period by its cycle count via getOfferDuration", () => {
    const threeCyclesOfOneWeek = {
      ...subscriptionOptionWithSingleWeekIntroPriceRecurring.introPrice!,
      cycleCount: 3,
    };
    expect(
      getPeriodDurationLabel(
        getOfferDuration(threeCyclesOfOneWeek),
        translator,
      ),
    ).toEqual("3 weeks");
    expect(
      getPeriodDurationLabel(
        getOfferDuration(
          subscriptionOptionWithMultipleWeeksIntroPriceRecurring.introPrice!,
        ),
        translator,
      ),
    ).toEqual("2 weeks");
  });
});
