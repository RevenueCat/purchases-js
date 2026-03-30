import { parseISODuration } from "./duration-helper";
import { type Translator } from "../ui/localization/translator";

import { LocalizationKeys } from "../ui/localization/supportedLanguages";
import { toBcp47Locale } from "./locale-helper";

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
