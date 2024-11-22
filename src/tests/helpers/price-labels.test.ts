import { describe, expect, test } from "vitest";
import { formatPrice, getTranslatedPeriodFrequency } from "../../helpers/price-labels";

describe("getRenewsLabel", () => {
  test("should return correct text for single period durations", () => {
    expect(getTranslatedPeriodFrequency("P1Y")).toEqual("yearly");
    expect(getTranslatedPeriodFrequency("P1M")).toEqual("monthly");
    expect(getTranslatedPeriodFrequency("P1W")).toEqual("weekly");
    expect(getTranslatedPeriodFrequency("P1D")).toEqual("daily");
  });

  test("should return correct text for multiple period durations", () => {
    expect(getTranslatedPeriodFrequency("P2Y")).toEqual("every 2 years");
    expect(getTranslatedPeriodFrequency("P3M")).toEqual("every 3 months");
    expect(getTranslatedPeriodFrequency("P2W")).toEqual("every 2 weeks");
    expect(getTranslatedPeriodFrequency("P14D")).toEqual("every 14 days");
  });
});

describe("formatPrice", () => {
  test("should return expected formatted price", () => {
    expect(formatPrice(9990000, "USD", "en-US")).toEqual("$9.99");
    expect(formatPrice(10000000, "USD", "en-US")).toEqual("$10.00");
    expect(formatPrice(990000, "USD", "en-US")).toEqual("$0.99");
    expect(formatPrice(9990000, "EUR", "en-US")).toEqual("€9.99");
    expect(formatPrice(9990000, "USD", "es-ES")).toEqual("9,99 US$");
    expect(formatPrice(9990000, "CNY", "en-US")).toEqual("CN¥9.99");
    expect(formatPrice(9990000, "CNY", "zh-CN")).toEqual("¥9.99");
  });
});
