import { describe, expect, test } from "vitest";
import { parseOfferingIntoVariables } from "../../../helpers/paywall-variables-helpers";
import { Translator } from "../../../ui/localization/translator";
import { englishLocale } from "../../../ui/localization/constants";
import { PeriodUnit } from "../../../helpers/duration-helper";
import { toOffering } from "./fixtures-utils";

const enTranslator = new Translator({}, englishLocale);

describe("getPaywallVariables", () => {
  test("should return expected paywall variables", () => {
    const off = toOffering([
      {
        packageIdentifier: "$rc_monthly",
        identifier: "monthly_bingo",
        title: "Mario",
        basePriceMicros: 9000000,
        // Server side PerPeriod prices are ignored for now and recalculated locally
        //pricePerWeekMicros: 2100000,
        //pricePerMonthMicros: 9000000,
        //pricePerYearMicros: 109500000,
      },
      {
        packageIdentifier: "$rc_weekly",
        identifier: "weekly_bingo",
        title: "Luigi",
        period: { unit: PeriodUnit.Week, number: 1 },
        basePriceMicros: 9000000,
        // Server side PerPeriod prices are ignored for now and recalculated locally
        //pricePerMonthMicros: 39000000,
        //pricePerWeekMicros: 9000000,
        //pricePerYearMicros: 474000000,
      },
      {
        packageIdentifier: "trial",
        identifier: "trial_bingo",
        title: "Mario with Trial",
        basePriceMicros: 30000000,
        // Server side PerPeriod prices are ignored for now and recalculated locally
        //pricePerMonthMicros: 30000000,
        //pricePerWeekMicros: 6923100,
        //pricePerYearMicros: 365000000,
      },
    ]);

    expect(parseOfferingIntoVariables(off, enTranslator)).toEqual(
      expect.objectContaining({
        $rc_monthly: expect.objectContaining({
          "product.store_product_name": "Mario",
          "product.price": "€9.00",
          "product.price_per_period_abbreviated": "€9.00/mo",
          "product.price_per_period": "€9.00/month",
          "product.period_with_unit": "1 month",
          "product.period_in_months": "1 month",
          "product.periodly": "monthly",
          "product.period": "month",
          "product.period_abbreviated": "mo",
          "product.price_per_month": "€9.00",
          "product.price_per_week": "€2.08",
          "product.relative_discount": "77%",
        }),
        $rc_weekly: expect.objectContaining({
          "product.store_product_name": "Luigi",
          "product.price": "€9.00",
          "product.price_per_period_abbreviated": "€9.00/wk",
          "product.price_per_period": "€9.00/week",
          "product.period_with_unit": "1 week",
          "product.period_in_months": "1 week",
          "product.periodly": "weekly",
          "product.period": "week",
          "product.period_abbreviated": "wk",
          "product.price_per_month": "€38.97",
          "product.price_per_week": "€9.00",
          "product.relative_discount": "",
        }),
        trial: expect.objectContaining({
          "product.store_product_name": "Mario with Trial",
          "product.price": "€30.00",
          "product.price_per_period_abbreviated": "€30.00/mo",
          "product.price_per_period": "€30.00/month",
          "product.period_with_unit": "1 month",
          "product.period_in_months": "1 month",
          "product.periodly": "monthly",
          "product.period": "month",
          "product.period_abbreviated": "mo",
          "product.price_per_month": "€30.00",
          "product.price_per_week": "€6.93",
          "product.relative_discount": "23%",
        }),
      }),
    );
  });
  test("sub_relative_discount is calculated correctly for same-priced packages", () => {
    /**
     * Monthly: 9€/month
     * Weekly: 2.08€/week - 9€/month
     * Trial: 9€/month after trial
     */
    const off = toOffering([
      {
        packageIdentifier: "$rc_monthly",
        identifier: "monthly_bingo",
        title: "Mario",
        basePriceMicros: 9000000,
        // Server side PerPeriod prices are ignored for now and recalculated locally
        //pricePerMonthMicros: 9000000,
        //pricePerWeekMicros: 2100000,
        //pricePerYearMicros: 109500000,
      },
      {
        packageIdentifier: "$rc_weekly",
        identifier: "weekly_bingo",
        title: "Luigi",
        period: { unit: PeriodUnit.Week, number: 1 },
        basePriceMicros: 2080000,
        // Server side PerPeriod prices are ignored for now and recalculated locally
        //pricePerMonthMicros: 9000000,
        //pricePerWeekMicros: 2080000,
        //pricePerYearMicros: 109500000,
      },
      {
        packageIdentifier: "trial",
        identifier: "trial_bingo",
        title: "Mario with Trial",
        basePriceMicros: 9000000,
        // Server side PerPeriod prices are ignored for now and recalculated locally
        //pricePerMonthMicros: 9000000,
        //pricePerWeekMicros: 6923100,
        //pricePerYearMicros: 109500000,
      },
    ]);

    const variables = parseOfferingIntoVariables(off, enTranslator);
    Object.values(variables).forEach((variable) =>
      expect(variable["product.relative_discount"]).toBe(""),
    );
  });

  test("sub_relative_discount is calculated correctly for packages with different prices", () => {
    /**
     * Monthly: 3€/month = 88%off
     * Weekly: 6€/week - 25.98€/month - most expensive
     * Trial: 9€/month after trial = 65%off
     */
    const expectedValues = ["88%", "", "65%"];

    const off = toOffering([
      {
        packageIdentifier: "$rc_monthly",
        identifier: "monthly_bingo",
        title: "Mario",
        basePriceMicros: 3000000,
        // Server side PerPeriod prices are ignored for now and recalculated locally
        //pricePerMonthMicros: 9000000,
        //pricePerWeekMicros: 2100000,
        //pricePerYearMicros: 109500000,
      },
      {
        packageIdentifier: "$rc_weekly",
        identifier: "weekly_bingo",
        title: "Luigi",
        period: { unit: PeriodUnit.Week, number: 1 },
        basePriceMicros: 6000000,
        // Server side PerPeriod prices are ignored for now and recalculated locally
        //pricePerMonthMicros: 9000000,
        //pricePerWeekMicros: 2080000,
        //pricePerYearMicros: 109500000,
      },
      {
        packageIdentifier: "trial",
        identifier: "trial_bingo",
        title: "Mario with Trial",
        basePriceMicros: 9000000,
        // Server side PerPeriod prices are ignored for now and recalculated locally
        //pricePerMonthMicros: 9000000,
        //pricePerWeekMicros: 6923100,
        //pricePerYearMicros: 109500000,
      },
    ]);

    const variables = parseOfferingIntoVariables(off, enTranslator);

    Object.values(variables).forEach((variable, idx) => {
      expect(variable["product.relative_discount"]).toBe(expectedValues[idx]);
    });
  });
});
