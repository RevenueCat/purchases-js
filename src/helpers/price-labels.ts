import { parseISODuration, type Period } from "./duration-helper";
import { Translator } from "../ui/localization/translator";

export const priceLabels: Record<string, string> = {
  P3M: "quarterly",
  P1M: "monthly",
  P1Y: "yearly",
  P2W: "2 weeks",
  P1D: "daily",
  PT1H: "hourly",
  P1W: "weekly",
};

export const formatPrice = (
  priceInMicros: number,
  currency: string,
  locale?: string,
): string => {
  const price = priceInMicros / 1000000;
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  });

  return formatter.format(price);
};

const getPeriodLengthLabel = (
  period: Period,
  selectedLocale: string = "en",
): string => {
  return (
    Translator.translatePeriod(selectedLocale, period.number, period.unit) ||
    `${period.number} ${period.unit}s`
  );
};

const getPeriodFrequencyLabel = (
  period: Period,
  selectedLocale: string = "en",
): string => {
  return (
    Translator.translateFrequency(selectedLocale, period.number, period.unit) ||
    `${period.number} ${period.unit}s`
  );
};

export const getTranslatedPeriodFrequency = (
  duration: string,
  selectedLocale?: string,
): string => {
  const period = parseISODuration(duration);
  if (!period) {
    return "unknown";
  }

  return getPeriodFrequencyLabel(period, selectedLocale);
};

export const getTranslatedPeriodLength = (
  isoPeriodString: string,
  selectedLocale?: string,
): string => {
  const period = parseISODuration(isoPeriodString);
  if (!period) {
    return isoPeriodString;
  }
  return getPeriodLengthLabel(period, selectedLocale);
};
