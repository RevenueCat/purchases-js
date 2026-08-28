import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { parseOfferingIntoVariables } from "../../helpers/paywall-variables-helpers";
import { Translator } from "../../ui/localization/translator";
import { englishLocale } from "../../ui/localization/constants";
import { PeriodUnit } from "../../helpers/duration-helper";
import {
  toOffering,
  toNonSubscriptionOffering,
  toPrice,
  buildOffering,
  buildPackage,
  buildNonSubscriptionProduct,
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
  introPhaseP1M199,
  trialPhaseP2W,
  trialPhaseP7D,
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
          "product.period_in_weeks": "4",
          "product.period_in_months": "1",
          "product.period_in_years": "0",
          "product.periodly": "monthly",
          "product.period": "month",
          "product.period_abbreviated": "mo",
          "product.price_per_year": "€108.00",
          "product.price_per_month": "€9.00",
          "product.price_per_week": "€2.07",
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
          "product.price_per_year": "€469.28",
          "product.price_per_month": "€39.10",
          "product.price_per_week": "€9.00",
          "product.price_per_day": "€1.28",
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
          "product.offer_price_per_day": "€0.07",
          "product.offer_price_per_month": "€2.25",
          "product.offer_price_per_week": "€0.51",
          "product.offer_price_per_year": "€27.00",
          "product.offer_period": "month",
          "product.offer_period_abbreviated": "mo",
          "product.offer_period_in_days": "60",
          "product.offer_period_in_months": "2",
          "product.offer_period_in_weeks": "8",
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
          "product.period_in_weeks": "4",
          "product.period_in_years": "0",
          "product.periodly": "monthly",
          "product.period": "month",
          "product.period_abbreviated": "mo",
          "product.price_per_year": "€360.00",
          "product.price_per_month": "€30.00",
          "product.price_per_week": "€6.90",
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
  test("sub_relative_discount hides differences below 1%", () => {
    /**
     * Monthly: 9€/month
     * Weekly: €2.08/week ≈ €9.04/month
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
     * Weekly: €6/week ≈ €26.07/month - most expensive
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

  test("sub_relative_discount excludes non-subscription packages from highest price calculation", () => {
    /**
     * Lifetime: €100.00 (non-subscription, should be excluded from comparison)
     * Monthly: €3.00/month = should be 88% off relative to weekly
     * Weekly: €6.00/week ≈ €26.07/month (most expensive subscription)
     * Without the fix, lifetime's raw price (100000000 micros) would be treated
     * as the highest, inflating all subscription discounts.
     */
    const subscriptionPackages = toOffering([
      {
        packageIdentifier: "$rc_monthly",
        identifier: "monthly_bingo",
        title: "Mario",
        basePriceMicros: 3000000,
      },
      {
        packageIdentifier: "$rc_weekly",
        identifier: "weekly_bingo",
        title: "Luigi",
        period: { unit: PeriodUnit.Week, number: 1 },
        basePriceMicros: 6000000,
      },
    ]);

    const lifetimePackage = buildPackage(
      "lifetime",
      buildNonSubscriptionProduct({
        identifier: "lifetime_product",
        title: "Lifetime",
        basePriceMicros: 100000000,
      }),
    );

    const mixedOffering = buildOffering([
      ...subscriptionPackages.availablePackages,
      lifetimePackage,
    ]);

    const variables = parseOfferingIntoVariables(mixedOffering, enTranslator);

    // Monthly discount should be relative to weekly (most expensive subscription),
    // not the lifetime product
    expect(variables.$rc_monthly["product.relative_discount"]).toBe("88%");
    // Weekly is the most expensive subscription, no discount
    expect(variables.$rc_weekly["product.relative_discount"]).toBe("");
    // Lifetime should always have empty relative discount
    expect(variables.lifetime["product.relative_discount"]).toBe("");
  });

  test("sub_relative_discount works when offering has only non-subscription packages", () => {
    const off = toNonSubscriptionOffering([
      {
        packageIdentifier: "lifetime",
        identifier: "lifetime_product",
        title: "Lifetime",
        basePriceMicros: 100000000,
      },
    ]);

    const variables = parseOfferingIntoVariables(off, enTranslator);
    expect(variables.lifetime["product.relative_discount"]).toBe("");
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
          "product.offer_price_per_week": "$2.30",
          "product.offer_price_per_month": "$10.00",
          "product.offer_price_per_year": "$120.00",
          "product.offer_period": "month",
          "product.offer_period_abbreviated": "mo",
          "product.offer_period_with_unit": "1 month",
          "product.offer_period_in_days": "30",
          "product.offer_period_in_weeks": "4",
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
          "product.offer_price_per_week": "$2.76",
          "product.offer_price_per_month": "$12.00",
          "product.offer_price_per_year": "$144.00",
          "product.offer_period": "month",
          "product.offer_period_abbreviated": "mo",
          "product.offer_period_with_unit": "3 months",
          "product.offer_period_in_days": "90",
          "product.offer_period_in_weeks": "12",
          "product.offer_period_in_months": "3",
          "product.offer_period_in_years": "0",
          "product.offer_end_date": "January 30, 2026",
          "product.secondary_offer_price": "",
          "product.secondary_offer_period": "",
          "product.secondary_offer_period_abbreviated": "",
        }),
      );
    });

    test("Subscription with time window discount uses base billing cadence for weekly offers", () => {
      const weeklyTimeWindowDiscount = {
        timeWindow: "P2M",
        periodDuration: "P2M",
        durationMode: "time_window",
        price: toPrice(75000000, "USD"),
        name: "Weekly Time Window Discount",
        period: { number: 1, unit: PeriodUnit.Month },
        cycleCount: 2,
        discountType: "percentage",
        percentage: 25,
        fixedAmount: null,
      } satisfies NonNullable<SubscriptionOption["discount"]>;

      const off = toOffering([
        {
          packageIdentifier: "$rc_weekly",
          identifier: "weekly_time_window_discount",
          title: "Weekly Time Window Discount",
          period: { unit: PeriodUnit.Week, number: 1 },
          basePriceMicros: 100000000,
          pricePerWeekMicros: 100000000,
          pricePerMonthMicros: 428570000,
          pricePerYearMicros: 5214280000,
          currency: "USD",
          discount: weeklyTimeWindowDiscount,
        },
      ]);

      const variables = parseOfferingIntoVariables(off, enTranslator);

      expect(variables.$rc_weekly).toEqual(
        expect.objectContaining({
          "product.offer_price": "$75.00",
          "product.offer_price_per_day": "$10.71",
          "product.offer_price_per_week": "$75.00",
          "product.offer_price_per_month": "$325.89",
          "product.offer_price_per_year": "$3,910.71",
          "product.offer_period": "month",
          "product.offer_period_abbreviated": "mo",
          "product.offer_period_with_unit": "2 months",
          "product.offer_period_in_days": "60",
          "product.offer_period_in_weeks": "8",
          "product.offer_period_in_months": "2",
          "product.offer_period_in_years": "0",
          "product.offer_end_date": "December 30, 2025",
          "product.secondary_offer_price": "",
          "product.secondary_offer_period": "",
          "product.secondary_offer_period_abbreviated": "",
        }),
      );
    });

    test("Subscription with time window discount shorter than billing cadence discounts the first monthly bill", () => {
      const monthlyShortWindowDiscount = {
        timeWindow: "P1W",
        periodDuration: "P1W",
        durationMode: "time_window",
        price: toPrice(5000000, "USD"),
        name: "Monthly Short Window Discount",
        period: { number: 1, unit: PeriodUnit.Week },
        cycleCount: 1,
        discountType: "percentage",
        percentage: 50,
        fixedAmount: null,
      } satisfies NonNullable<SubscriptionOption["discount"]>;

      const off = toOffering([
        {
          packageIdentifier: "$rc_monthly",
          identifier: "monthly_short_window_discount",
          title: "Monthly Short Window Discount",
          basePriceMicros: 10000000,
          pricePerWeekMicros: 2330000,
          pricePerMonthMicros: 10000000,
          pricePerYearMicros: 120000000,
          currency: "USD",
          discount: monthlyShortWindowDiscount,
        },
      ]);

      const variables = parseOfferingIntoVariables(off, enTranslator);

      expect(variables.$rc_monthly).toEqual(
        expect.objectContaining({
          "product.offer_price": "$5.00",
          "product.offer_price_per_day": "$0.16",
          "product.offer_price_per_week": "$1.15",
          "product.offer_price_per_month": "$5.00",
          "product.offer_price_per_year": "$60.00",
          "product.offer_period": "week",
          "product.offer_period_abbreviated": "wk",
          "product.offer_period_with_unit": "1 week",
          "product.offer_period_in_days": "7",
          "product.offer_period_in_weeks": "1",
          "product.offer_period_in_months": "0",
          "product.offer_period_in_years": "0",
          "product.offer_end_date": "November 6, 2025",
          "product.secondary_offer_price": "",
          "product.secondary_offer_period": "",
          "product.secondary_offer_period_abbreviated": "",
        }),
      );
    });

    test("Subscription with multi-cycle intro price uses the full promo window for offer duration", () => {
      const off = toOffering([
        {
          packageIdentifier: "$rc_monthly",
          identifier: "monthly_multi_cycle_intro_price",
          title: "Monthly Multi-Cycle Intro Price",
          basePriceMicros: 9000000,
          introPrice: introPhaseP1M199,
        },
      ]);

      const variables = parseOfferingIntoVariables(off, enTranslator);

      expect(variables.$rc_monthly).toEqual(
        expect.objectContaining({
          "product.offer_price": "$1.99",
          "product.offer_price_per_day": "$0.06",
          "product.offer_price_per_week": "$0.45",
          "product.offer_price_per_month": "$1.99",
          "product.offer_price_per_year": "$23.88",
          "product.offer_period": "month",
          "product.offer_period_abbreviated": "mo",
          "product.offer_period_with_unit": "3 months",
          "product.offer_period_in_days": "90",
          "product.offer_period_in_weeks": "12",
          "product.offer_period_in_months": "3",
          "product.offer_period_in_years": "0",
          "product.offer_end_date": "January 30, 2026",
          "product.secondary_offer_price": "",
          "product.secondary_offer_period": "",
          "product.secondary_offer_period_abbreviated": "",
        }),
      );
    });

    test("Subscription with paid-upfront intro price keeps offer_price as the upfront charge", () => {
      const introPricePaidUpfront: SubscriptionOption["introPrice"] = {
        period: { unit: PeriodUnit.Month, number: 6 },
        periodDuration: "P6M",
        cycleCount: 1,
        price: toPrice(6990000, "USD"),
        pricePerWeek: toPrice(270000, "USD"),
        pricePerMonth: toPrice(1160000, "USD"),
        pricePerYear: toPrice(14170000, "USD"),
      } satisfies PricingPhase;

      const off = toOffering([
        {
          packageIdentifier: "$rc_monthly",
          identifier: "monthly_paid_upfront_intro_price",
          title: "Monthly Paid Upfront Intro Price",
          basePriceMicros: 9000000,
          currency: "USD",
          introPrice: introPricePaidUpfront,
        },
      ]);

      const variables = parseOfferingIntoVariables(off, enTranslator);

      expect(variables.$rc_monthly).toEqual(
        expect.objectContaining({
          "product.offer_price": "$6.99",
          "product.offer_price_per_day": "$0.03",
          "product.offer_price_per_week": "$0.26",
          "product.offer_price_per_month": "$1.16",
          "product.offer_price_per_year": "$13.98",
          "product.offer_period": "month",
          "product.offer_period_abbreviated": "mo",
          "product.offer_period_with_unit": "6 months",
          "product.offer_period_in_days": "180",
          "product.offer_period_in_weeks": "25",
          "product.offer_period_in_months": "6",
          "product.offer_period_in_years": "0",
          "product.offer_end_date": "April 30, 2026",
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
          "product.offer_price_per_week": "$2.99",
          "product.offer_price_per_month": "$13.00",
          "product.offer_price_per_year": "$156.00",
          "product.offer_period": "",
          "product.offer_period_abbreviated": "",
          "product.offer_period_with_unit": "",
          "product.offer_period_in_days": "",
          "product.offer_period_in_weeks": "",
          "product.offer_period_in_months": "",
          "product.offer_period_in_years": "",
          "product.offer_end_date": "",
          "product.secondary_offer_price": "",
          "product.secondary_offer_period": "",
          "product.secondary_offer_period_abbreviated": "",
        }),
      );
    });
  });

  describe("Trial logic for subscriptions", () => {
    test("Subscription with day-unit trial (e.g. Stripe trial_days) populates offer_period variables", () => {
      const off = toOffering([
        {
          packageIdentifier: "$rc_monthly",
          identifier: "monthly_stripe_trial",
          title: "Monthly Stripe Trial",
          basePriceMicros: 9000000,
          trial: trialPhaseP7D,
        },
      ]);

      const variables = parseOfferingIntoVariables(off, enTranslator);

      expect(variables.$rc_monthly).toEqual(
        expect.objectContaining({
          "product.offer_price": "",
          "product.offer_price_per_day": "",
          "product.offer_price_per_week": "",
          "product.offer_price_per_month": "",
          "product.offer_price_per_year": "",
          "product.offer_period": "day",
          "product.offer_period_abbreviated": "d",
          "product.offer_period_with_unit": "7 days",
          "product.offer_period_in_days": "7",
          "product.offer_period_in_weeks": "0",
          "product.offer_period_in_months": "0",
          "product.offer_period_in_years": "0",
          "product.offer_end_date": "November 6, 2025",
          "product.secondary_offer_price": "",
          "product.secondary_offer_period": "",
          "product.secondary_offer_period_abbreviated": "",
        }),
      );
    });

    test("Subscription with trial and intro price exposes intro price as secondary offer", () => {
      const off = toOffering([
        {
          packageIdentifier: "$rc_monthly",
          identifier: "monthly_trial_with_intro",
          title: "Monthly Trial With Intro",
          basePriceMicros: 9000000,
          trial: trialPhaseP7D,
          introPrice: introPhaseP1M199,
        },
      ]);

      const variables = parseOfferingIntoVariables(off, enTranslator);

      expect(variables.$rc_monthly).toEqual(
        expect.objectContaining({
          "product.offer_period": "day",
          "product.offer_period_with_unit": "7 days",
          "product.offer_period_in_days": "7",
          "product.offer_end_date": "November 6, 2025",
          "product.secondary_offer_price": "$1.99",
          "product.secondary_offer_period": "month",
          "product.secondary_offer_period_abbreviated": "mo",
        }),
      );
    });

    test("Subscription without trial or other offers leaves offer variables empty", () => {
      const off = toOffering([
        {
          packageIdentifier: "$rc_monthly",
          identifier: "monthly_no_offer",
          title: "Monthly No Offer",
          basePriceMicros: 9000000,
        },
      ]);

      const variables = parseOfferingIntoVariables(off, enTranslator);

      expect(variables.$rc_monthly).toEqual(
        expect.objectContaining({
          "product.offer_price": "",
          "product.offer_period": "",
          "product.offer_period_with_unit": "",
          "product.offer_period_in_days": "",
          "product.offer_end_date": "",
          "product.secondary_offer_price": "",
          "product.secondary_offer_period": "",
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

describe("discount variables", () => {
  test("absolute_discount is expressed over the package's own period", () => {
    /**
     * Monthly €10.00/mo is the anchor. Annual €60.00/yr is €5.00/mo, so the
     * per-month gap is €5.00 — but the annual buyer's actual saving over the
     * year they're buying is (€10.00 × 12) − €60.00 = €60.00.
     */
    const off = toOffering([
      {
        packageIdentifier: "$rc_monthly",
        identifier: "monthly_bingo",
        title: "Monthly",
        basePriceMicros: 10000000,
      },
      {
        packageIdentifier: "$rc_annual",
        identifier: "annual_bingo",
        title: "Annual",
        period: { unit: PeriodUnit.Year, number: 1 },
        basePriceMicros: 60000000,
      },
    ]);

    const variables = parseOfferingIntoVariables(off, enTranslator);

    expect(variables.$rc_annual["product.absolute_discount"]).toBe("€60.00");
    expect(variables.$rc_annual["product.relative_discount"]).toBe("50%");
  });

  test("absolute_discount is empty for the anchor package itself", () => {
    const off = toOffering([
      {
        packageIdentifier: "$rc_monthly",
        identifier: "monthly_bingo",
        title: "Monthly",
        basePriceMicros: 10000000,
      },
      {
        packageIdentifier: "$rc_annual",
        identifier: "annual_bingo",
        title: "Annual",
        period: { unit: PeriodUnit.Year, number: 1 },
        basePriceMicros: 60000000,
      },
    ]);

    const variables = parseOfferingIntoVariables(off, enTranslator);

    expect(variables.$rc_monthly["product.absolute_discount"]).toBe("");
    expect(variables.$rc_monthly["product.relative_discount"]).toBe("");
  });

  test("absolute_discount normalizes a weekly anchor to the package's period", () => {
    /**
     * Weekly €6.00/wk ≈ €26.07/mo is the anchor; the monthly package's own
     * period is 1 month, so it saves ≈ €23.07 per month.
     */
    const off = toOffering([
      {
        packageIdentifier: "$rc_monthly",
        identifier: "monthly_bingo",
        title: "Monthly",
        basePriceMicros: 3000000,
      },
      {
        packageIdentifier: "$rc_weekly",
        identifier: "weekly_bingo",
        title: "Weekly",
        period: { unit: PeriodUnit.Week, number: 1 },
        basePriceMicros: 6000000,
      },
    ]);

    const variables = parseOfferingIntoVariables(off, enTranslator);

    expect(variables.$rc_monthly["product.absolute_discount"]).toBe("€23.07");
    expect(variables.$rc_monthly["product.relative_discount"]).toBe("88%");
  });

  test("absolute_discount is empty for non-subscription packages", () => {
    const off = toNonSubscriptionOffering([
      {
        packageIdentifier: "lifetime",
        identifier: "lifetime_basic",
        title: "Lifetime Basic",
        basePriceMicros: 100000000,
      },
    ]);

    const variables = parseOfferingIntoVariables(off, enTranslator);

    expect(variables.lifetime["product.absolute_discount"]).toBe("");
  });

  test("offer discounts compare the offer price to the standard renewal price", () => {
    // €9.00/mo base with a €1.99/mo intro for 3 cycles: saves €7.01, 78% off.
    const off = toOffering([
      {
        packageIdentifier: "$rc_monthly",
        identifier: "monthly_bingo",
        title: "Monthly",
        basePriceMicros: 9000000,
        introPrice: {
          periodDuration: "P1M",
          period: { number: 1, unit: PeriodUnit.Month },
          cycleCount: 3,
          price: toPrice(1990000, "EUR"),
          pricePerWeek: null,
          pricePerMonth: null,
          pricePerYear: null,
        },
      },
    ]);

    const variables = parseOfferingIntoVariables(off, enTranslator);

    expect(variables.$rc_monthly["product.offer_absolute_discount"]).toBe(
      "€7.01",
    );
    expect(variables.$rc_monthly["product.offer_relative_discount"]).toBe(
      "78%",
    );
  });

  test("offer discounts are empty when the offer period differs from the base period", () => {
    // €15.00 for the first 3 months isn't comparable to a €9.00 monthly price.
    const off = toOffering([
      {
        packageIdentifier: "$rc_monthly",
        identifier: "monthly_bingo",
        title: "Monthly",
        basePriceMicros: 9000000,
        introPrice: {
          periodDuration: "P3M",
          period: { number: 3, unit: PeriodUnit.Month },
          cycleCount: 1,
          price: toPrice(15000000, "EUR"),
          pricePerWeek: null,
          pricePerMonth: null,
          pricePerYear: null,
        },
      },
    ]);

    const variables = parseOfferingIntoVariables(off, enTranslator);

    expect(variables.$rc_monthly["product.offer_absolute_discount"]).toBe("");
    expect(variables.$rc_monthly["product.offer_relative_discount"]).toBe("");
  });

  test("offer discounts are empty for a free offer", () => {
    // A free month would otherwise render "100%" / the full price as a saving.
    const off = toOffering([
      {
        packageIdentifier: "$rc_monthly",
        identifier: "monthly_bingo",
        title: "Monthly",
        basePriceMicros: 9000000,
        introPrice: {
          periodDuration: "P1M",
          period: { number: 1, unit: PeriodUnit.Month },
          cycleCount: 1,
          price: toPrice(0, "EUR"),
          pricePerWeek: null,
          pricePerMonth: null,
          pricePerYear: null,
        },
      },
    ]);

    const variables = parseOfferingIntoVariables(off, enTranslator);

    expect(variables.$rc_monthly["product.offer_absolute_discount"]).toBe("");
    expect(variables.$rc_monthly["product.offer_relative_discount"]).toBe("");
  });

  test("offer discounts are empty when the package has no offer", () => {
    const off = toOffering([
      {
        packageIdentifier: "$rc_monthly",
        identifier: "monthly_bingo",
        title: "Monthly",
        basePriceMicros: 9000000,
      },
    ]);

    const variables = parseOfferingIntoVariables(off, enTranslator);

    expect(variables.$rc_monthly["product.offer_absolute_discount"]).toBe("");
    expect(variables.$rc_monthly["product.offer_relative_discount"]).toBe("");
  });
});

describe("discount variables - offer sources beyond introPrice", () => {
  test("a time_window discount populates the offer discounts", () => {
    // discountPhaseTimeWindow is $12.00 against a $14.99 monthly base: saves $2.99, 20% off.
    const off = toOffering([
      {
        packageIdentifier: "$rc_monthly",
        identifier: "monthly_bingo",
        title: "Monthly",
        currency: "USD",
        basePriceMicros: 14990000,
        discount: discountPhaseTimeWindow,
      },
    ]);

    const variables = parseOfferingIntoVariables(off, enTranslator);

    expect(variables.$rc_monthly["product.offer_absolute_discount"]).toBe(
      "$2.99",
    );
    expect(variables.$rc_monthly["product.offer_relative_discount"]).toBe(
      "20%",
    );
  });

  test("a one_time discount on a multi-month base still compares against the base price", () => {
    /**
     * Regression: `toDiscountPhase` normalizes a discount's period to a single unit and
     * moves the count into `cycleCount`, so a discount on a 3-month plan carries
     * `{number: 1, unit: Month}`. Comparing that to the base period raw would wrongly
     * suppress a discount that does apply to the base plan's own renewal.
     */
    const off = toOffering([
      {
        packageIdentifier: "$rc_three_month",
        identifier: "quarterly_bingo",
        title: "Quarterly",
        currency: "USD",
        period: { unit: PeriodUnit.Month, number: 3 },
        basePriceMicros: 27000000,
        discount: {
          ...discountPhaseOneTime,
          periodDuration: "P3M",
          price: toPrice(15000000, "USD"),
          period: { number: 1, unit: PeriodUnit.Month },
          cycleCount: 3,
        },
      },
    ]);

    const variables = parseOfferingIntoVariables(off, enTranslator);

    expect(variables.$rc_three_month["product.offer_absolute_discount"]).toBe(
      "$12.00",
    );
    expect(variables.$rc_three_month["product.offer_relative_discount"]).toBe(
      "44%",
    );
  });

  test("a free trial phase leaves the offer discounts empty", () => {
    // trialPhaseP2W carries `price: null`, a different guard branch from `price: 0`.
    const off = toOffering([
      {
        packageIdentifier: "$rc_monthly",
        identifier: "monthly_bingo",
        title: "Monthly",
        basePriceMicros: 9000000,
        trial: trialPhaseP2W,
      },
    ]);

    const variables = parseOfferingIntoVariables(off, enTranslator);

    expect(variables.$rc_monthly["product.offer_absolute_discount"]).toBe("");
    expect(variables.$rc_monthly["product.offer_relative_discount"]).toBe("");
  });

  test("absolute_discount is empty when every package is free", () => {
    // A zero anchor makes the ratio NaN; the guard must not fall through to "€0".
    const off = toOffering([
      {
        packageIdentifier: "$rc_monthly",
        identifier: "monthly_bingo",
        title: "Monthly",
        basePriceMicros: 0,
      },
      {
        packageIdentifier: "$rc_annual",
        identifier: "annual_bingo",
        title: "Annual",
        period: { unit: PeriodUnit.Year, number: 1 },
        basePriceMicros: 0,
      },
    ]);

    const variables = parseOfferingIntoVariables(off, enTranslator);

    expect(variables.$rc_monthly["product.absolute_discount"]).toBe("");
    expect(variables.$rc_annual["product.absolute_discount"]).toBe("");
    expect(variables.$rc_monthly["product.relative_discount"]).toBe("");
    expect(variables.$rc_annual["product.relative_discount"]).toBe("");
  });

  test("absolute_discount normalizes onto a multi-month package period", () => {
    // €10.00/mo anchor vs. a €21.00 quarterly package: saves (€10.00 x 3) - €21.00 = €9.00.
    const off = toOffering([
      {
        packageIdentifier: "$rc_monthly",
        identifier: "monthly_bingo",
        title: "Monthly",
        basePriceMicros: 10000000,
      },
      {
        packageIdentifier: "$rc_three_month",
        identifier: "quarterly_bingo",
        title: "Quarterly",
        period: { unit: PeriodUnit.Month, number: 3 },
        basePriceMicros: 21000000,
      },
    ]);

    const variables = parseOfferingIntoVariables(off, enTranslator);

    expect(variables.$rc_three_month["product.absolute_discount"]).toBe(
      "€9.00",
    );
  });
});
