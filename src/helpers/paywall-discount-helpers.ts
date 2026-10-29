import type { VariableDictionary } from "@revenuecat/purchases-ui-js";
import type { Price, SubscriptionOption } from "../entities/offerings";
import { LocalizationKeys } from "../ui/localization/supportedLanguages";
import { type Translator } from "../ui/localization/translator";
import { PeriodUnit, type Period } from "./duration-helper";
import { getPricePerPeriodFactors } from "./price-conversion-helper";
import { getCurrencyFractionDigits } from "./price-labels";

/**
 * A run of consecutive billing cycles at one price. `cycles` is null when it never ends.
 */
interface OfferSegment {
  priceMicros: number;
  period: Period;
  cycles: number | null;
}

interface DiscountSavings {
  amountMicros: number;
  relative: number;
}

function periodInDays(period: Period): number {
  const perDay = getPricePerPeriodFactors(period).perDay;
  return perDay > 0 ? 1 / perDay : 0;
}

function periodInMonths(period: Period): number {
  const perMonth = getPricePerPeriodFactors(period).perMonth;
  return perMonth > 0 ? 1 / perMonth : 0;
}

function isCalendarPeriod(period: Period): boolean {
  return period.unit === PeriodUnit.Month || period.unit === PeriodUnit.Year;
}

/**
 * How many base periods fit in the window. Months and years are compared in months, so a year holds
 * 12 monthly invoices rather than 365 / 30.
 */
function periodsInWindow(window: Period, base: Period): number {
  const length =
    isCalendarPeriod(window) && isCalendarPeriod(base)
      ? periodInMonths
      : periodInDays;
  const baseLength = length(base);
  return baseLength > 0 ? stripFloatNoise(length(window) / baseLength) : 0;
}

/**
 * The offer the customer gets, in billing order. A discount replaces the trial and intro price, matching
 * `setOfferVariables`. A discount's price is per base-plan invoice.
 */
function getOfferSegments(option: SubscriptionOption): OfferSegment[] {
  const { base, discount } = option;
  if (discount !== null) {
    if (base.period === null) {
      return [];
    }

    switch (discount.durationMode) {
      case "forever":
        return [
          {
            priceMicros: discount.price.amountMicros,
            period: base.period,
            cycles: null,
          },
        ];
      case "time_window": {
        // Every invoice issued within the window is discounted.
        const invoices = discount.period
          ? Math.ceil(
              periodsInWindow(discount.period, base.period) *
                discount.cycleCount,
            )
          : 0;
        return invoices > 0
          ? [
              {
                priceMicros: discount.price.amountMicros,
                period: base.period,
                cycles: invoices,
              },
            ]
          : [];
      }
      default:
        return [
          {
            priceMicros: discount.price.amountMicros,
            period: base.period,
            cycles: 1,
          },
        ];
    }
  }

  return [option.trial, option.introPrice].flatMap((phase) =>
    phase?.period
      ? [
          {
            priceMicros: phase.price?.amountMicros ?? 0,
            period: phase.period,
            cycles: phase.cycleCount > 0 ? phase.cycleCount : 1,
          },
        ]
      : [],
  );
}

/**
 * What the first billing period costs. Offer segments count, in order, for the part of the period they
 * cover, and the regular price is prorated over the rest.
 */
function firstPeriodCostMicros(
  price: Price,
  period: Period,
  segments: OfferSegment[],
): number {
  const windowDays = periodInDays(period);
  if (windowDays <= 0) {
    return price.amountMicros;
  }

  let remaining = windowDays;
  let cost = 0;
  for (const segment of segments) {
    const cycles = segment.cycles ?? 1;
    const segmentDays = periodInDays(segment.period) * cycles;
    if (remaining > 0 && segmentDays > 0) {
      const covered = Math.min(segmentDays, remaining);
      cost += (segment.priceMicros * cycles * covered) / segmentDays;
      remaining -= covered;
    }
  }

  return cost + (price.amountMicros * remaining) / windowDays;
}

function stripFloatNoise(value: number): number {
  return Math.round(value * 1e9) / 1e9;
}

/** Rounded half up to the currency's minor unit. */
function createSavings(
  baselineMicros: number,
  costMicros: number,
  currency: string,
): DiscountSavings | null {
  const microsPerUnit = 10 ** (6 - getCurrencyFractionDigits(currency));
  const savedMicros = baselineMicros - costMicros;
  const amountMicros =
    Math.round(stripFloatNoise(savedMicros / microsPerUnit)) * microsPerUnit;
  if (!(baselineMicros > 0) || !(amountMicros > 0)) {
    return null;
  }

  return { amountMicros, relative: savedMicros / baselineMicros };
}

/**
 * Without a paid offer segment, the term is one period of the product at its regular price. A free trial
 * counts as no offer, since "100% off" isn't the claim this makes. Null when the offer never ends.
 */
function offerTermSavings(
  price: Price,
  period: Period,
  segments: OfferSegment[],
  mostExpensivePricePerMonthMicros: number,
): DiscountSavings | null {
  const paidSegment = segments.find((segment) => segment.priceMicros > 0);
  let months = periodInMonths(period);
  let cost = price.amountMicros;
  if (paidSegment !== undefined) {
    if (paidSegment.cycles === null) {
      return null;
    }
    months = periodInMonths(paidSegment.period) * paidSegment.cycles;
    cost = paidSegment.priceMicros * paidSegment.cycles;
  }

  return createSavings(
    mostExpensivePricePerMonthMicros * months,
    cost,
    price.currency,
  );
}

/**
 * Sets the discount variables for a subscription, against either the product's own price or the most
 * expensive per-month price in the offering. The iOS and Android SDKs must produce the same numbers.
 */
export function setDiscountVariables(
  option: SubscriptionOption,
  price: Price,
  period: Period | null,
  mostExpensivePricePerMonthMicros: number,
  translator: Translator,
  variables: VariableDictionary,
) {
  if (period === null) {
    return;
  }

  const segments = getOfferSegments(option);
  const mostExpensiveBaseline =
    mostExpensivePricePerMonthMicros * periodInMonths(period);
  const fullPeriodCost = firstPeriodCostMicros(price, period, segments);

  const setPair = (
    savings: DiscountSavings | null,
    relativeName: string,
    absoluteName: string,
  ) => {
    if (savings === null) {
      return;
    }
    variables[relativeName] = translator.translate(
      LocalizationKeys.PaywallVariablesSubRelativeDiscount,
      { discount: Math.round(savings.relative * 100).toString() },
    );
    variables[absoluteName] = translator.formatPrice(
      savings.amountMicros,
      price.currency,
    );
  };

  const standardSavings = createSavings(
    mostExpensiveBaseline,
    price.amountMicros,
    price.currency,
  );
  if (standardSavings !== null) {
    variables["product.absolute_discount"] = translator.formatPrice(
      standardSavings.amountMicros,
      price.currency,
    );
  }

  if (segments.length > 0) {
    setPair(
      createSavings(price.amountMicros, fullPeriodCost, price.currency),
      "product.offer_relative_discount",
      "product.offer_absolute_discount",
    );
  }

  setPair(
    offerTermSavings(price, period, segments, mostExpensivePricePerMonthMicros),
    "product.relative_discount_with_offer",
    "product.absolute_discount_with_offer",
  );

  setPair(
    createSavings(mostExpensiveBaseline, fullPeriodCost, price.currency),
    "product.relative_discount_with_offer_full_period",
    "product.absolute_discount_with_offer_full_period",
  );
}
