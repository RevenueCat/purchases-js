import { describe, expect, test } from "vitest";
import type { VariableDictionary } from "@revenuecat/purchases-ui-js";
import type { PricingPhase } from "../../entities/offerings";
import { PeriodUnit, type Period } from "../../helpers/duration-helper";
import { parseOfferingIntoVariables } from "../../helpers/paywall-variables-helpers";
import { englishLocale } from "../../ui/localization/constants";
import { Translator } from "../../ui/localization/translator";
import {
  discountPhaseForever,
  discountPhaseOneTime,
  discountPhaseTimeWindow,
  trialPhaseP1W,
  trialPhaseP2W,
} from "../fixtures/price-phases";
import {
  toNonSubscriptionOffering,
  toOffering,
  toPrice,
} from "../utils/fixtures-utils";

const enTranslator = new Translator({}, englishLocale);

const MONTH: Period = { unit: PeriodUnit.Month, number: 1 };
const YEAR: Period = { unit: PeriodUnit.Year, number: 1 };

function introPhase(
  priceMicros: number,
  currency: string,
  period: Period,
  cycleCount: number,
): PricingPhase {
  return {
    periodDuration: null,
    period,
    cycleCount,
    price: toPrice(priceMicros, currency),
    pricePerWeek: null,
    pricePerMonth: null,
    pricePerYear: null,
  };
}

function discountVariables(variables: VariableDictionary | undefined) {
  return {
    absolute: variables?.["product.absolute_discount"],
    offerRelative: variables?.["product.offer_relative_discount"],
    offerAbsolute: variables?.["product.offer_absolute_discount"],
    withOfferRelative: variables?.["product.relative_discount_with_offer"],
    withOfferAbsolute: variables?.["product.absolute_discount_with_offer"],
    fullPeriodRelative:
      variables?.["product.relative_discount_with_offer_full_period"],
    fullPeriodAbsolute:
      variables?.["product.absolute_discount_with_offer_full_period"],
  };
}

const EMPTY = {
  absolute: "",
  offerRelative: "",
  offerAbsolute: "",
  withOfferRelative: "",
  withOfferAbsolute: "",
  fullPeriodRelative: "",
  fullPeriodAbsolute: "",
};

function annualVsMonthly(
  annual: { priceMicros: number; trial?: PricingPhase; intro?: PricingPhase },
  monthlyPriceMicros: number,
  currency = "USD",
) {
  const variables = parseOfferingIntoVariables(
    toOffering([
      {
        packageIdentifier: "$rc_monthly",
        identifier: "monthly",
        title: "Monthly",
        period: MONTH,
        basePriceMicros: monthlyPriceMicros,
        currency,
      },
      {
        packageIdentifier: "$rc_annual",
        identifier: "annual",
        title: "Annual",
        period: YEAR,
        basePriceMicros: annual.priceMicros,
        currency,
        trial: annual.trial ?? null,
        introPrice: annual.intro ?? null,
      },
    ]),
    enTranslator,
  );
  return {
    monthly: discountVariables(variables.$rc_monthly),
    annual: discountVariables(variables.$rc_annual),
  };
}

describe("discount variables", () => {
  test("a short paid intro differs between the offer term and the first period", () => {
    const { annual, monthly } = annualVsMonthly(
      {
        priceMicros: 99_990_000,
        intro: introPhase(990_000, "USD", MONTH, 1),
      },
      9_990_000,
    );

    expect(annual).toEqual({
      absolute: "$19.89",
      offerRelative: "7%",
      offerAbsolute: "$7.23",
      withOfferRelative: "90%",
      withOfferAbsolute: "$9.00",
      fullPeriodRelative: "23%",
      fullPeriodAbsolute: "$27.12",
    });
    expect(monthly).toEqual(EMPTY);
  });

  test("a multi-cycle intro counts every cycle", () => {
    const { annual } = annualVsMonthly(
      {
        priceMicros: 99_990_000,
        intro: introPhase(4_990_000, "USD", MONTH, 3),
      },
      29_990_000,
    );

    expect(annual).toEqual({
      absolute: "$259.89",
      offerRelative: "10%",
      offerAbsolute: "$9.69",
      withOfferRelative: "83%",
      withOfferAbsolute: "$75.00",
      fullPeriodRelative: "75%",
      fullPeriodAbsolute: "$269.58",
    });
  });

  test("a free trial counts as no offer for the offer term", () => {
    const { annual } = annualVsMonthly(
      { priceMicros: 35_990_000, trial: trialPhaseP2W },
      4_790_000,
      "EUR",
    );

    expect(annual).toEqual({
      absolute: "€21.49",
      offerRelative: "4%",
      offerAbsolute: "€1.38",
      withOfferRelative: "37%",
      withOfferAbsolute: "€21.49",
      fullPeriodRelative: "40%",
      fullPeriodAbsolute: "€22.87",
    });
  });

  test("relative discounts use the unrounded amount", () => {
    const variables = parseOfferingIntoVariables(
      toOffering([
        {
          packageIdentifier: "$rc_weekly",
          identifier: "weekly",
          title: "Weekly",
          period: { unit: PeriodUnit.Week, number: 1 },
          basePriceMicros: 50_000_000,
          currency: "JPY",
          trial: {
            ...trialPhaseP1W,
            periodDuration: "P3D",
            period: { number: 3, unit: PeriodUnit.Day },
          },
        },
      ]),
      enTranslator,
    );

    // 50 * 3 / 7 = 21.43 saved, shown as ¥21, but 43% rather than 21 / 50
    expect(discountVariables(variables.$rc_weekly).offerRelative).toBe("43%");
  });

  test("a trial followed by an intro uses the intro for the offer term", () => {
    const { annual } = annualVsMonthly(
      {
        priceMicros: 99_990_000,
        trial: trialPhaseP1W,
        intro: introPhase(990_000, "USD", MONTH, 1),
      },
      9_990_000,
    );

    expect(annual).toEqual({
      absolute: "$19.89",
      offerRelative: "9%",
      offerAbsolute: "$9.15",
      withOfferRelative: "90%",
      withOfferAbsolute: "$9.00",
      fullPeriodRelative: "24%",
      fullPeriodAbsolute: "$29.04",
    });
  });

  test("a one-time discount covers the first invoice", () => {
    const variables = parseOfferingIntoVariables(
      toOffering([
        {
          packageIdentifier: "$rc_monthly",
          identifier: "monthly",
          title: "Monthly",
          period: MONTH,
          basePriceMicros: 15_000_000,
          currency: "USD",
          discount: discountPhaseOneTime,
        },
      ]),
      enTranslator,
    );

    expect(discountVariables(variables.$rc_monthly)).toEqual({
      ...EMPTY,
      offerRelative: "33%",
      offerAbsolute: "$5.00",
      withOfferRelative: "33%",
      withOfferAbsolute: "$5.00",
      fullPeriodRelative: "33%",
      fullPeriodAbsolute: "$5.00",
    });
  });

  test("a time-window discount covers every invoice in the window", () => {
    const variables = parseOfferingIntoVariables(
      toOffering([
        {
          packageIdentifier: "$rc_monthly",
          identifier: "monthly",
          title: "Monthly",
          period: MONTH,
          basePriceMicros: 15_000_000,
          currency: "USD",
          discount: discountPhaseTimeWindow,
        },
      ]),
      enTranslator,
    );

    expect(discountVariables(variables.$rc_monthly)).toEqual({
      ...EMPTY,
      offerRelative: "20%",
      offerAbsolute: "$3.00",
      withOfferRelative: "20%",
      withOfferAbsolute: "$9.00",
      fullPeriodRelative: "20%",
      fullPeriodAbsolute: "$3.00",
    });
  });

  test("a one-year time-window discount covers twelve monthly invoices", () => {
    const variables = parseOfferingIntoVariables(
      toOffering([
        {
          packageIdentifier: "$rc_monthly",
          identifier: "monthly",
          title: "Monthly",
          period: MONTH,
          basePriceMicros: 15_000_000,
          currency: "USD",
          discount: {
            ...discountPhaseTimeWindow,
            timeWindow: "P1Y",
            periodDuration: "P1Y",
            period: YEAR,
            cycleCount: 1,
          },
        },
      ]),
      enTranslator,
    );

    // 12 invoices at $12 instead of $15, not 365 / 30 rounded up to 13
    expect(discountVariables(variables.$rc_monthly).withOfferAbsolute).toBe(
      "$36.00",
    );
  });

  test("a forever discount has no offer term", () => {
    const variables = parseOfferingIntoVariables(
      toOffering([
        {
          packageIdentifier: "$rc_monthly",
          identifier: "monthly",
          title: "Monthly",
          period: MONTH,
          basePriceMicros: 26_000_000,
          currency: "USD",
          discount: discountPhaseForever,
        },
      ]),
      enTranslator,
    );

    expect(discountVariables(variables.$rc_monthly)).toEqual({
      ...EMPTY,
      offerRelative: "50%",
      offerAbsolute: "$13.00",
      fullPeriodRelative: "50%",
      fullPeriodAbsolute: "$13.00",
    });
  });

  test("non-subscription products have no discount variables", () => {
    const variables = parseOfferingIntoVariables(
      toNonSubscriptionOffering([
        {
          packageIdentifier: "$rc_lifetime",
          identifier: "lifetime",
          title: "Lifetime",
          basePriceMicros: 199_990_000,
        },
      ]),
      enTranslator,
    );

    expect(discountVariables(variables.$rc_lifetime)).toEqual(EMPTY);
  });
});
