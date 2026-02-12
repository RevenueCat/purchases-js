import type { VariableDictionary } from "@revenuecat/purchases-ui-js";
import type { NonSubscriptionOption } from "../entities/offerings";
import { type SubscriptionOption } from "../entities/offerings";
import { type Translator } from "../ui/localization/translator";
import { PeriodUnit, type Period } from "./duration-helper";
import { getPeriodVariables } from "./paywall-period-helpers";
import { getPriceVariables } from "./paywall-price-helpers";

function getOfferEndDate(period: Period, translator: Translator): string {
  const date = new Date();
  switch (period.unit) {
    case PeriodUnit.Year:
      date.setFullYear(date.getFullYear() + period.number);
      break;
    case PeriodUnit.Month:
      date.setMonth(date.getMonth() + period.number);
      break;
    case PeriodUnit.Week:
      date.setDate(date.getDate() + period.number * 7);
      break;
    case PeriodUnit.Day:
      date.setDate(date.getDate() + period.number);
      break;
  }

  return translator.translateDate(date, { dateStyle: "long" }) ?? "";
}

export function setOfferVariables(
  product: SubscriptionOption,
  translator: Translator,
  variables: VariableDictionary,
) {
  const primaryOffer =
    product.discountPrice ?? product.trial ?? product.introPrice;
  const secondaryOffer =
    product.trial && !product.discountPrice ? product.introPrice : null;

  if (primaryOffer === null) {
    return;
  }

  const { period, price } = primaryOffer;

  if (price !== null) {
    const priceVariables = getPriceVariables(price, period, translator);
    variables["product.offer_price"] = translator.formatPrice(
      price.amountMicros,
      price.currency,
    );
    variables["product.offer_price_per_day"] = priceVariables.pricePerDay;
    variables["product.offer_price_per_week"] = priceVariables.pricePerWeek;
    variables["product.offer_price_per_month"] = priceVariables.pricePerMonth;
    variables["product.offer_price_per_year"] = priceVariables.pricePerYear;
  }

  if (period !== null) {
    const periodVars = getPeriodVariables(period, translator);
    variables["product.offer_period"] = periodVars.period;
    variables["product.offer_period_abbreviated"] =
      periodVars.periodAbbreviated;
    variables["product.offer_period_with_unit"] = periodVars.periodWithUnit;
    variables["product.offer_period_in_days"] = periodVars.periodInDays;
    variables["product.offer_period_in_weeks"] = periodVars.periodInWeeks;
    variables["product.offer_period_in_months"] = periodVars.periodInMonths;
    variables["product.offer_period_in_years"] = periodVars.periodInYears;
    variables["product.offer_end_date"] = getOfferEndDate(period, translator);
  }

  if (secondaryOffer === null) {
    return;
  }

  if (secondaryOffer.price !== null) {
    variables["product.secondary_offer_price"] = translator.formatPrice(
      secondaryOffer.price.amountMicros,
      secondaryOffer.price.currency,
    );
  }

  if (secondaryOffer.period !== null) {
    const periodVars = getPeriodVariables(secondaryOffer.period, translator);
    variables["product.secondary_offer_period"] = periodVars.period;
    variables["product.secondary_offer_period_abbreviated"] =
      periodVars.periodAbbreviated;
  }
}

export function setNonSubscriptionOfferVariables(
  product: NonSubscriptionOption,
  translator: Translator,
  variables: VariableDictionary,
) {
  const primaryOfferPrice = product.discountPrice?.price ?? null;

  if (primaryOfferPrice === null) {
    return;
  }

  variables["product.offer_price"] = translator.formatPrice(
    primaryOfferPrice.amountMicros,
    primaryOfferPrice.currency,
  );
}
