import { describe, expect, test } from "vitest";
import {
  formatPrice,
  getTranslatedPeriodFrequency,
} from "../../helpers/price-labels";
import { Translator } from "../../ui/localization/translator";

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
