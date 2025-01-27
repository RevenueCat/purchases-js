import { parseISODuration } from "./duration-helper";
import { type Translator } from "../ui/localization/translator";

import { LocalizationKeys } from "../ui/localization/supportedLanguages";

const microsToDollars = (micros: number): number => {
  return micros / 1000000;
};

export const formatPrice = (
  priceInMicros: number,
  currency: string,
  locale?: string,
): string => {
  const price = microsToDollars(priceInMicros);
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  });

  return formatter.format(price);
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
