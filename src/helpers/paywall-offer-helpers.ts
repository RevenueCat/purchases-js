import type { VariableDictionary } from "@revenuecat/purchases-ui-js";
import type {
  DiscountPhase,
  NonSubscriptionOption,
  PricingPhase,
  SubscriptionOption,
} from "../entities/offerings";
import { type Translator } from "../ui/localization/translator";
import { LocalizationKeys } from "../ui/localization/supportedLanguages";
import { getNextRenewalDate, type Period } from "./duration-helper";
import { getPeriodVariables } from "./paywall-period-helpers";
import { getPriceVariables } from "./paywall-price-helpers";
import { getPricePerPeriodFactors } from "./price-conversion-helper";

export type OfferPhase = PricingPhase | DiscountPhase;

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

export function getOfferDuration(offer: OfferPhase): Period | null {
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

function isDiscountPhase(offer: OfferPhase): offer is DiscountPhase {
  return "durationMode" in offer;
}

/**
 * The period an offer's price is quoted against. A discount replaces the base plan's own
 * renewal price, so its rate is per base period; `toDiscountPhase` normalizes its own
 * `period` to a single unit, which would misprice a discount on a multi-month plan.
 * Trials and intro prices bill on their own period.
 *
 * Note this covers every discount phase, whereas `getOfferPricingPeriod` above only special-cases
 * `time_window` ones. The two therefore disagree for a `forever` discount on a multi-unit base
 * plan, where `offer_price_per_*` still uses the normalized period and so reports a different
 * monthly rate than these variables do. That looks like a latent bug in `offer_price_per_*` rather
 * than something to replicate here — tracked separately, since changing it would move a value
 * already rendering on live paywalls.
 */
function offerRatePeriod(
  product: SubscriptionOption,
  offer: OfferPhase,
): Period | null {
  return isDiscountPhase(offer) ? product.base.period : offer.period;
}

/**
 * The currently applicable offer expressed as a monthly rate plus the span it runs for, for
 * the `*_with_offer` variables. Returns null when there is no usable offer, so callers fall
 * back to the package's own base price and period.
 *
 * `durationInMonths` is null when the offer never reverts (a "forever" discount): there is no
 * term over which a total saving accrues, so the absolute variant renders empty.
 */
export function getOfferRate(product: SubscriptionOption): {
  ratePerMonthMicros: number;
  durationInMonths: number | null;
} | null {
  const offer = product.discount ?? product.trial ?? product.introPrice;

  // A free offer is treated as no offer: "100% off" isn't the claim these variables make.
  if (offer === null || offer.price === null || offer.price.amountMicros <= 0) {
    return null;
  }

  const ratePeriod = offerRatePeriod(product, offer);
  if (ratePeriod === null) {
    return null;
  }

  const rateFactor = getPricePerPeriodFactors(ratePeriod).perMonth;
  if (rateFactor <= 0) {
    return null;
  }

  const duration = getOfferDuration(offer);
  const durationFactor = duration
    ? getPricePerPeriodFactors(duration).perMonth
    : 0;

  return {
    ratePerMonthMicros: offer.price.amountMicros * rateFactor,
    // perMonth is "how many of this period fit in a month", so its reciprocal is the
    // period expressed in months.
    durationInMonths: durationFactor > 0 ? 1 / durationFactor : null,
  };
}

/**
 * The offer's price, but only when it can be compared like-for-like against the
 * standard renewal price: same billing period, and not free. Returns null otherwise
 * so the discount variables render empty rather than a misleading number.
 */
function comparableOfferPriceMicros(
  product: SubscriptionOption,
  offer: OfferPhase,
): number | null {
  if (offer.price === null || offer.price.amountMicros <= 0) {
    return null;
  }

  // A discount always replaces the base plan's own renewal price, so it is comparable by
  // construction. Its `period` can't be compared directly: `toDiscountPhase` normalizes it
  // to a single unit and moves the count into `cycleCount`, so a discount on a 3-month base
  // plan carries `{number: 1, unit: Month}` and a raw comparison would wrongly reject it.
  if (isDiscountPhase(offer)) {
    return offer.price.amountMicros;
  }

  // Trials and intro prices bill on their own period, which only lines up with the standard
  // price when it matches the base period exactly.
  const basePeriod = product.base.period;
  const offerPeriod = offer.period;

  if (
    basePeriod === null ||
    offerPeriod === null ||
    offerPeriod.number !== basePeriod.number ||
    offerPeriod.unit !== basePeriod.unit
  ) {
    return null;
  }

  return offer.price.amountMicros;
}

function setOfferDiscountVariables(
  product: SubscriptionOption,
  offer: OfferPhase,
  translator: Translator,
  variables: VariableDictionary,
) {
  const standardPrice = product.base.price;
  const offerPriceMicros = comparableOfferPriceMicros(product, offer);

  if (
    standardPrice === null ||
    standardPrice.amountMicros <= 0 ||
    offerPriceMicros === null
  ) {
    return;
  }

  const savingMicros = standardPrice.amountMicros - offerPriceMicros;
  if (savingMicros <= 0) {
    return;
  }

  variables["product.offer_absolute_discount"] = translator.formatPrice(
    savingMicros,
    standardPrice.currency,
  );
  variables["product.offer_relative_discount"] = translator.translate(
    LocalizationKeys.PaywallVariablesSubRelativeDiscount,
    {
      discount: ((savingMicros * 100) / standardPrice.amountMicros).toFixed(0),
    },
  );
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

  setOfferDiscountVariables(product, primaryOffer, translator, variables);

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
