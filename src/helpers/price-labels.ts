import { parseISODuration, type Period, PeriodUnit } from "./duration-helper";

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
  priceInCents: number,
  currency: string,
  locale?: string,
): string => {
  const price = priceInCents / 100;
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

const getLengthLabel = (period: Period): string => {
  const numberPeriods = period.number;
  if (numberPeriods === 1) {
    switch (period.unit) {
      case PeriodUnit.Year:
        return "1 year";
      case PeriodUnit.Month:
        return "1 month";
      case PeriodUnit.Week:
        return "1 week";
      case PeriodUnit.Day:
        return "1 day";
    }
  } else {
    return `${numberPeriods} ${period.unit}s`;
  }
};

export const getRenewsLabel = (duration: string): string => {
  const period = parseISODuration(duration);
  if (!period) {
    return "unknown";
  }

  return getFrequencyLabel(period);
};

export const getTrialsLabel = (duration: string): string => {
  const period = parseISODuration(duration);
  if (!period) {
    return "unknown";
  }

  return getLengthLabel(period);
};
