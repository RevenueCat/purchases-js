import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { parseOfferingIntoVariables } from "../../helpers/paywall-variables-helpers";
import { Translator } from "../../ui/localization/translator";
import { englishLocale } from "../../ui/localization/constants";
import { PeriodUnit } from "../../helpers/duration-helper";
import {
  toOffering,
  toNonSubscriptionOffering,
  toPrice,
} from "../utils/fixtures-utils";
import type { VariableDictionary } from "@revenuecat/purchases-ui-js";
import type {
  PricingPhase,
  SubscriptionOption,
} from "../../entities/offerings";
import {
  discountPhaseOneTime,
  discountPhaseTimeWindow,
  discountPhaseForever,
  trialPhaseP2W,
} from "../fixtures/price-phases";
const enTranslator = new Translator({}, englishLocale);

describe("getPaywallVariables", () => {
  const introPrice: SubscriptionOption["introPrice"] = {
    period: { unit: PeriodUnit.Month, number: 2 },
    periodDuration: "P2M",
    cycleCount: 1,
    price: toPrice(4500000, "EUR"),
    pricePerWeek: null,
    pricePerMonth: null,
    pricePerYear: null,
  } satisfies PricingPhase;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime("2025-10-30T12:00:00.000Z");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

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
        trial: trialPhaseP2W,
        introPrice,
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
        trial: trialPhaseP2W,
      },
      {
        packageIdentifier: "$rc_yearly",
        identifier: "yearly_bingo",
        title: "Peach",
        period: { unit: PeriodUnit.Year, number: 1 },
        basePriceMicros: 9000000,
        // Server side PerPeriod prices are ignored for now and recalculated locally
        //pricePerMonthMicros: 39000000,
        //pricePerWeekMicros: 9000000,
        //pricePerYearMicros: 474000000,
        introPrice,
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
          "product.period_in_days": "30",
          "product.period_in_weeks": "4.33",
          "product.period_in_months": "1",
          "product.period_in_years": "0",
          "product.periodly": "monthly",
          "product.period": "month",
          "product.period_abbreviated": "mo",
          "product.price_per_year": "€108.00",
          "product.price_per_month": "€9.00",
          "product.price_per_week": "€2.08",
          "product.price_per_day": "€0.30",
          "product.relative_discount": "77%",
          "product.currency_code": "EUR",
          "product.currency_symbol": "€",
          "product.offer_price": "",
          "product.offer_price_per_day": "",
          "product.offer_price_per_week": "",
          "product.offer_price_per_month": "",
          "product.offer_price_per_year": "",
          "product.offer_period": "week",
          "product.offer_period_abbreviated": "wk",
          "product.offer_period_in_days": "14",
          "product.offer_period_in_months": "0",
          "product.offer_period_in_weeks": "2",
          "product.offer_period_in_years": "0",
          "product.offer_period_with_unit": "2 weeks",
          "product.offer_end_date": "November 13, 2025",
          "product.secondary_offer_period": "month",
          "product.secondary_offer_period_abbreviated": "mo",
          "product.secondary_offer_price": "€4.50",
        } satisfies VariableDictionary),
        $rc_weekly: expect.objectContaining({
          "product.store_product_name": "Luigi",
          "product.price": "€9.00",
          "product.price_per_period_abbreviated": "€9.00/wk",
          "product.price_per_period": "€9.00/week",
          "product.period_with_unit": "1 week",
          "product.period_in_days": "7",
          "product.period_in_months": "0",
          "product.period_in_weeks": "1",
          "product.period_in_years": "0",
          "product.periodly": "weekly",
          "product.period": "week",
          "product.period_abbreviated": "wk",
          "product.price_per_year": "€468.00",
          "product.price_per_month": "€38.97",
          "product.price_per_week": "€9.00",
          "product.price_per_day": "€1.29",
          "product.relative_discount": "",
          "product.currency_code": "EUR",
          "product.currency_symbol": "€",
          "product.offer_price": "",
          "product.offer_price_per_day": "",
          "product.offer_price_per_week": "",
          "product.offer_price_per_month": "",
          "product.offer_price_per_year": "",
          "product.offer_period": "week",
          "product.offer_period_abbreviated": "wk",
          "product.offer_period_in_days": "14",
          "product.offer_period_in_months": "0",
          "product.offer_period_in_weeks": "2",
          "product.offer_period_in_years": "0",
          "product.offer_period_with_unit": "2 weeks",
          "product.offer_end_date": "November 13, 2025",
          "product.secondary_offer_price": "",
          "product.secondary_offer_period": "",
          "product.secondary_offer_period_abbreviated": "",
        } satisfies VariableDictionary),
        $rc_yearly: expect.objectContaining({
          "product.store_product_name": "Peach",
          "product.price": "€9.00",
          "product.price_per_period_abbreviated": "€9.00/yr",
          "product.price_per_period": "€9.00/year",
          "product.period_with_unit": "1 year",
          "product.period_in_days": "365",
          "product.period_in_months": "12",
          "product.period_in_weeks": "52",
          "product.period_in_years": "1",
          "product.periodly": "yearly",
          "product.period": "year",
          "product.period_abbreviated": "yr",
          "product.price_per_year": "€9.00",
          "product.price_per_month": "€0.75",
          "product.price_per_week": "€0.17",
          "product.price_per_day": "€0.02",
          "product.relative_discount": "98%",
          "product.currency_code": "EUR",
          "product.currency_symbol": "€",
          "product.offer_price": "€4.50",
          "product.offer_price_per_day": "€0.08",
          "product.offer_price_per_month": "€2.25",
          "product.offer_price_per_week": "€0.52",
          "product.offer_price_per_year": "€27.00",
          "product.offer_period": "month",
          "product.offer_period_abbreviated": "mo",
          "product.offer_period_in_days": "60",
          "product.offer_period_in_months": "2",
          "product.offer_period_in_weeks": "8.66",
          "product.offer_period_in_years": "0",
          "product.offer_period_with_unit": "2 months",
          "product.offer_end_date": "December 30, 2025",
          "product.secondary_offer_price": "",
          "product.secondary_offer_period": "",
          "product.secondary_offer_period_abbreviated": "",
        } satisfies VariableDictionary),
        trial: expect.objectContaining({
          "product.store_product_name": "Mario with Trial",
          "product.price": "€30.00",
          "product.price_per_period_abbreviated": "€30.00/mo",
          "product.price_per_period": "€30.00/month",
          "product.period_with_unit": "1 month",
          "product.period_in_days": "30",
          "product.period_in_months": "1",
          "product.period_in_weeks": "4.33",
          "product.period_in_years": "0",
          "product.periodly": "monthly",
          "product.period": "month",
          "product.period_abbreviated": "mo",
          "product.price_per_year": "€360.00",
          "product.price_per_month": "€30.00",
          "product.price_per_week": "€6.93",
          "product.price_per_day": "€1.00",
          "product.relative_discount": "23%",
          "product.currency_code": "EUR",
          "product.currency_symbol": "€",
          "product.offer_price": "",
          "product.offer_price_per_day": "",
          "product.offer_price_per_month": "",
          "product.offer_price_per_week": "",
          "product.offer_price_per_year": "",
          "product.offer_period": "",
          "product.offer_period_abbreviated": "",
          "product.offer_period_in_days": "",
          "product.offer_period_in_months": "",
          "product.offer_period_in_weeks": "",
          "product.offer_period_in_years": "",
          "product.offer_period_with_unit": "",
          "product.offer_end_date": "",
          "product.secondary_offer_price": "",
          "product.secondary_offer_period": "",
          "product.secondary_offer_period_abbreviated": "",
        } satisfies VariableDictionary),
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

  describe("Discount price logic for subscriptions", () => {
    test("Subscription with one-time discount uses discount as primary offer", () => {
      const off = toOffering([
        {
          packageIdentifier: "$rc_monthly",
          identifier: "monthly_one_time_discount",
          title: "Monthly One-Time Discount",
          basePriceMicros: 9000000,
          discount: discountPhaseOneTime,
        },
      ]);

      const variables = parseOfferingIntoVariables(off, enTranslator);

      expect(variables.$rc_monthly).toEqual(
        expect.objectContaining({
          "product.offer_price": "$10.00",
          "product.offer_price_per_day": "$0.33",
          "product.offer_price_per_week": "$2.31",
          "product.offer_price_per_month": "$10.00",
          "product.offer_price_per_year": "$120.00",
          "product.offer_period": "month",
          "product.offer_period_abbreviated": "mo",
          "product.offer_period_with_unit": "1 month",
          "product.offer_period_in_days": "30",
          "product.offer_period_in_weeks": "4.33",
          "product.offer_period_in_months": "1",
          "product.offer_period_in_years": "0",
          "product.offer_end_date": "November 30, 2025",
          "product.secondary_offer_price": "",
          "product.secondary_offer_period": "",
          "product.secondary_offer_period_abbreviated": "",
        }),
      );
    });

    test("Subscription with time window discount uses discount as primary offer", () => {
      const off = toOffering([
        {
          packageIdentifier: "$rc_monthly",
          identifier: "monthly_time_window_discount",
          title: "Monthly Time Window Discount",
          basePriceMicros: 9000000,
          discount: discountPhaseTimeWindow,
        },
      ]);

      const variables = parseOfferingIntoVariables(off, enTranslator);

      expect(variables.$rc_monthly).toEqual(
        expect.objectContaining({
          "product.offer_price": "$12.00",
          "product.offer_price_per_day": "$0.40",
          "product.offer_price_per_week": "$2.77",
          "product.offer_price_per_month": "$12.00",
          "product.offer_price_per_year": "$144.00",
          "product.offer_period": "month",
          "product.offer_period_abbreviated": "mo",
          "product.offer_period_with_unit": "1 month",
          "product.offer_period_in_days": "30",
          "product.offer_period_in_weeks": "4.33",
          "product.offer_period_in_months": "1",
          "product.offer_period_in_years": "0",
          "product.offer_end_date": "November 30, 2025",
          "product.secondary_offer_price": "",
          "product.secondary_offer_period": "",
          "product.secondary_offer_period_abbreviated": "",
        }),
      );
    });

    test("Subscription with forever discount uses discount as primary offer", () => {
      const off = toOffering([
        {
          packageIdentifier: "$rc_monthly",
          identifier: "monthly_forever_discount",
          title: "Monthly Forever Discount",
          basePriceMicros: 9000000,
          discount: discountPhaseForever,
        },
      ]);

      const variables = parseOfferingIntoVariables(off, enTranslator);

      expect(variables.$rc_monthly).toEqual(
        expect.objectContaining({
          "product.offer_price": "$13.00",
          "product.offer_price_per_day": "$0.43",
          "product.offer_price_per_week": "$3.00",
          "product.offer_price_per_month": "$13.00",
          "product.offer_price_per_year": "$156.00",
          "product.offer_period": "month",
          "product.offer_period_abbreviated": "mo",
          "product.offer_period_with_unit": "1 month",
          "product.offer_period_in_days": "30",
          "product.offer_period_in_weeks": "4.33",
          "product.offer_period_in_months": "1",
          "product.offer_period_in_years": "0",
          "product.offer_end_date": "November 30, 2025",
          "product.secondary_offer_price": "",
          "product.secondary_offer_period": "",
          "product.secondary_offer_period_abbreviated": "",
        }),
      );
    });
  });

  describe("Discount price logic for non-subscriptions", () => {
    test("Non-subscription with discount sets offer_price", () => {
      const off = toNonSubscriptionOffering([
        {
          packageIdentifier: "lifetime",
          identifier: "lifetime_discount",
          title: "Lifetime Discount",
          basePriceMicros: 100000000,
          discount: discountPhaseOneTime,
        },
      ]);

      const variables = parseOfferingIntoVariables(off, enTranslator);

      expect(variables.lifetime).toEqual(
        expect.objectContaining({
          "product.offer_price": "$10.00",
        }),
      );
    });

    test("Non-subscription without discount does not set offer_price", () => {
      const off = toNonSubscriptionOffering([
        {
          packageIdentifier: "lifetime",
          identifier: "lifetime_basic",
          title: "Lifetime Basic",
          basePriceMicros: 100000000,
        },
      ]);

      const variables = parseOfferingIntoVariables(off, enTranslator);

      expect(variables.lifetime).toEqual(
        expect.objectContaining({
          "product.offer_price": "",
        }),
      );
    });
  });
});
