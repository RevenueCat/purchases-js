import { describe, expect, test } from "vitest";
import { PeriodUnit } from "../../helpers/duration-helper";
import { getPriceVariables } from "../../helpers/paywall-price-helpers";
import { englishLocale } from "../../ui/localization/constants";
import { Translator } from "../../ui/localization/translator";
import { toPrice } from "../utils/fixtures-utils";

describe("getPriceVariables", () => {
  test("normalizes multi-year prices", () => {
    const translator = new Translator({}, englishLocale);

    expect(
      getPriceVariables(
        toPrice(239_980_000, "USD"),
        { unit: PeriodUnit.Year, number: 2 },
        translator,
      ),
    ).toEqual({
      pricePerDay: "$0.32",
      pricePerWeek: "$2.30",
      pricePerMonth: "$9.99",
      pricePerYear: "$119.99",
    });
  });
});
