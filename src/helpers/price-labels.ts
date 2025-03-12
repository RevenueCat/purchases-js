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

  const formatter = new Intl.NumberFormat(locale, formatterOptions);

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
