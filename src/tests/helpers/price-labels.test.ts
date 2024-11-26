import { describe, expect, test } from "vitest";
import {
  formatPrice,
  getTranslatedPeriodFrequency,
} from "../../helpers/price-labels";

describe("getRenewsLabel", () => {
  test("should return correct text for single period durations", () => {
    expect(getTranslatedPeriodFrequency("P1Y", "en-US")).toEqual("yearly");
    expect(getTranslatedPeriodFrequency("P1M", "en-US")).toEqual("monthly");
    expect(getTranslatedPeriodFrequency("P1W", "en-US")).toEqual("weekly");
    expect(getTranslatedPeriodFrequency("P1D", "en-US")).toEqual("daily");
  });

  test("should return correct text for multiple period durations", () => {
    expect(getTranslatedPeriodFrequency("P2Y", "en")).toEqual("every 2 years");
    expect(getTranslatedPeriodFrequency("P3M", "en")).toEqual("every 3 months");
    expect(getTranslatedPeriodFrequency("P2W", "en")).toEqual("every 2 weeks");
    expect(getTranslatedPeriodFrequency("P14D", "en")).toEqual("every 14 days");
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
