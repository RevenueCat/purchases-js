import { parseISODuration, type Period } from "./duration-helper";
import { type Translator } from "../ui/localization/translator";

import { LocalizationKeys } from "../ui/localization/supportedLanguages";
import { englishLocale } from "../ui/localization/constants";
import { toBcp47Locale, toLanguageCode } from "./locale-helper";

const microsToDollars = (micros: number): number => {
  return micros / 1000000;
};

const fractionDigitsCache = new Map<string, number>();

function getCurrencyFractionDigits(currency: string): number {
  const cached = fractionDigitsCache.get(currency);
  if (cached !== undefined) return cached;
  let digits: number;
  try {
    digits =
      new Intl.NumberFormat("en", {
        style: "currency",
        currency,
      }).resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    digits = 2;
  }
  fractionDigitsCache.set(currency, digits);
  return digits;
}

// Floor micros to the currency's smallest display unit so per-period prices
// never round up past the actual product price (matches iOS SDK behavior).
export function floorMicrosToCurrencyUnit(
  micros: number,
  currency: string,
): number {
  const fractionDigits = getCurrencyFractionDigits(currency);
  const microsPerUnit = 10 ** (6 - fractionDigits);
  // Round to 9 decimal places to strip floating-point noise, then floor.
  const rounded = Math.round((micros / microsPerUnit) * 1e9) / 1e9;
  return Math.floor(rounded) * microsPerUnit;
}

export const formatPrice = (
  priceInMicros: number,
  currency: string,
  locale?: string,
  additionalFormattingOptions: {
    maximumFractionDigits?: number;
  } = {},
): string => {
  const price = microsToDollars(priceInMicros);

  const formatterOptions: Intl.NumberFormatOptions = {
    style: "currency",
    currency,
    currencyDisplay: "symbol",
    ...additionalFormattingOptions,
    // Some browsers require minimumFractionDigits to be set if maximumFractionDigits is set.
    minimumFractionDigits: additionalFormattingOptions.maximumFractionDigits,
  };

  const formatter = new Intl.NumberFormat(
    toBcp47Locale(locale),
    formatterOptions,
  );

  const formattedPrice = formatter.format(price);

  return formattedPrice.replace("US$", "$");
};

export const getTranslatedPeriodFrequency = (
  duration: string,
  translator: Translator,
): string => {
  const period = parseISODuration(duration);
  if (!period) {
    return translator.translate(LocalizationKeys.PeriodsUnknownFrequency);
  }

  return (
    translator.translatePeriodFrequency(period.number, period.unit) ||
    `${period.number} ${period.unit}s`
  );
};

export const getTranslatedPeriodLength = (
  isoPeriodString: string,
  translator: Translator,
): string => {
  const period = parseISODuration(isoPeriodString);
  if (!period) {
    return isoPeriodString;
  }

  return (
    translator.translatePeriod(period.number, period.unit) ||
    `${period.number} ${period.unit}s`
  );
};

/**
 * A duration as a customer-facing label ("1 week", "2 weeks", "7 days").
 *
 * Takes an already-resolved {@link Period} rather than a pricing phase so the
 * period-times-cycle-count arithmetic stays in `getOfferDuration`, which is the
 * one place that also clamps a zero cycle count.
 *
 * `collapseSingularInEnglish` drops the leading "1" so a one-unit duration
 * reads as "week" rather than "1 week". Only pass it where the surrounding copy
 * reads better that way ("First week for $1.49"); "After week, on Aug 14" does
 * not, so it defaults off.
 */
export const getPeriodDurationLabel = (
  period: Period | null,
  translator: Translator,
  { collapseSingularInEnglish = false } = {},
): string => {
  if (!period) return "";

  // This is a customer paper cut that we want to fix, but we run into limitations of the templating translation system.
  // In order to avoid impact to other locales, we only apply this to the English locale.
  // Matched on the language subtag, not the whole locale: selectedLocale is
  // often navigator.language ("en-US") or a paywall locale key ("en_US"), both
  // of which resolve to the English strings this collapse is written for.
  if (
    collapseSingularInEnglish &&
    period.number === 1 &&
    toLanguageCode(translator.selectedLocale) === englishLocale
  ) {
    return (
      translator.translatePeriodUnit(period.unit, { noWhitespace: true }) || ""
    );
  }

  return translator.translatePeriod(period.number, period.unit) || "";
};
