import { parseISODuration, type Period, PeriodUnit } from "./duration-helper";
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

const getFrequencyLabel = (period: Period): string => {
  const numberPeriods = period.number;
  if (numberPeriods === 1) {
    switch (period.unit) {
      case PeriodUnit.Year:
        return "yearly";
      case PeriodUnit.Month:
        return "monthly";
      case PeriodUnit.Week:
        return "weekly";
      case PeriodUnit.Day:
        return "daily";
    }
  } else {
    return `every ${numberPeriods} ${period.unit}s`;
  }
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

export const getRenewalFrequency = (
  duration: string,
  selectedLocale?: string,
): string => {
  const period = parseISODuration(duration);
  if (!period) {
    return "unknown";
  }

  return getPeriodFrequencyLabel(period, selectedLocale);
};

export const getTrialsLabel = (
  duration: string,
  selectedLocale?: string,
): string => {
  const period = parseISODuration(duration);
  if (!period) {
    return "unknown";
  }

  return getPeriodLengthLabel(period, selectedLocale);
};

export const getPeriodLabel = (
  isoPeriodString: string,
  selectedLocale?: string,
): string => {
  const period = parseISODuration(isoPeriodString);
  if (!period) {
    return isoPeriodString;
  }
  return getPeriodLengthLabel(period, selectedLocale);
};
