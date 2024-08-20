import { describe, expect, test } from "vitest";
import { formatPrice, getRenewsLabel } from "../../helpers/price-labels";

describe("getRenewsLabel", () => {
  test("should return correct text for single period durations", () => {
    expect(getRenewsLabel("P1Y")).toEqual("yearly");
    expect(getRenewsLabel("P1M")).toEqual("monthly");
    expect(getRenewsLabel("P1W")).toEqual("weekly");
    expect(getRenewsLabel("P1D")).toEqual("daily");
  });

  test("should return correct text for multiple period durations", () => {
    expect(getRenewsLabel("P2Y")).toEqual("every 2 years");
    expect(getRenewsLabel("P3M")).toEqual("every 3 months");
    expect(getRenewsLabel("P2W")).toEqual("every 2 weeks");
    expect(getRenewsLabel("P14D")).toEqual("every 14 days");
  });
});

describe("formatPrice", () => {
  test("should return expected formatted price", () => {
    expect(formatPrice(999, "USD")).toEqual("$9.99");
    expect(formatPrice(1000, "USD")).toEqual("$10.00");
    expect(formatPrice(999, "EUR")).toEqual("€9.99");
    expect(formatPrice(999, "EUR", "en-US")).toEqual("€9.99");
    expect(formatPrice(999, "USD", "es-ES")).toEqual("9,99 US$");
  });
});
