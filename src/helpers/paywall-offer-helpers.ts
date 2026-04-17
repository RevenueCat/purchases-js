import type { VariableDictionary } from "@revenuecat/purchases-ui-js";
import type {
  DiscountPhase,
  NonSubscriptionOption,
  PricingPhase,
  SubscriptionOption,
} from "../entities/offerings";
import { type Translator } from "../ui/localization/translator";
import { getNextRenewalDate, type Period } from "./duration-helper";
import { getPeriodVariables } from "./paywall-period-helpers";
import { getPriceVariables } from "./paywall-price-helpers";

type OfferPhase = PricingPhase | DiscountPhase;

function getOfferCycleCount(offer: OfferPhase): number {
  return offer.cycleCount > 0 ? offer.cycleCount : 1;
}

function isForeverOffer(offer: OfferPhase): boolean {
  return "durationMode" in offer && offer.durationMode === "forever";
}

function isTimeWindowOffer(offer: OfferPhase): offer is DiscountPhase {
  return "durationMode" in offer && offer.durationMode === "time_window";
}

function getOfferPricingPeriod(
  product: SubscriptionOption,
  offer: OfferPhase,
): Period | null {
  if (isTimeWindowOffer(offer)) {
    return product.base.period;
  }

  return offer.period;
}

function getOfferDuration(offer: OfferPhase): Period | null {
  if (offer.period === null) {
    return null;
  }

  if (isForeverOffer(offer)) {
    return null;
  }

  return {
    number: offer.period.number * getOfferCycleCount(offer),
    unit: offer.period.unit,
  };
}

function getOfferEndDate(period: Period, translator: Translator): string {
  const date = getNextRenewalDate(new Date(), period, true);
  return date
    ? (translator.translateDate(date, { dateStyle: "long" }) ?? "")
    : "";
}

export function setOfferVariables(
  product: SubscriptionOption,
  translator: Translator,
  variables: VariableDictionary,
) {
  const primaryOffer = product.discount ?? product.trial ?? product.introPrice;
  const secondaryOffer =
    product.trial && !product.discount ? product.introPrice : null;

  if (primaryOffer === null) {
    return;
  }

  const offerDuration = getOfferDuration(primaryOffer);
  const offerPricingPeriod = getOfferPricingPeriod(product, primaryOffer);
  const { price } = primaryOffer;
  if (price !== null) {
    const priceVariables = getPriceVariables(
      price,
      offerPricingPeriod,
      translator,
    );
    variables["product.offer_price"] = translator.formatPrice(
      price.amountMicros,
      price.currency,
    );
    variables["product.offer_price_per_day"] = priceVariables.pricePerDay;
    variables["product.offer_price_per_week"] = priceVariables.pricePerWeek;
    variables["product.offer_price_per_month"] = priceVariables.pricePerMonth;
    variables["product.offer_price_per_year"] = priceVariables.pricePerYear;
  }

  if (offerDuration !== null) {
    const periodVars = getPeriodVariables(offerDuration, translator);
    variables["product.offer_period"] = periodVars.period;
    variables["product.offer_period_abbreviated"] =
      periodVars.periodAbbreviated;
    variables["product.offer_period_with_unit"] = periodVars.periodWithUnit;
    variables["product.offer_period_in_days"] = periodVars.periodInDays;
    variables["product.offer_period_in_weeks"] = periodVars.periodInWeeks;
    variables["product.offer_period_in_months"] = periodVars.periodInMonths;
    variables["product.offer_period_in_years"] = periodVars.periodInYears;
    variables["product.offer_end_date"] = getOfferEndDate(
      offerDuration,
      translator,
    );
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
  const primaryOfferPrice = product.discount?.price ?? null;

  if (primaryOfferPrice === null) {
    return;
  }

  variables["product.offer_price"] = translator.formatPrice(
    primaryOfferPrice.amountMicros,
    primaryOfferPrice.currency,
  );
}
