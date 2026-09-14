import { type Period, PeriodUnit } from "./duration-helper";
import { Logger } from "./logger";

const DAYS_PER_WEEK = 7;
const DAYS_PER_MONTH = 30;
const DAYS_PER_YEAR = 365;
const MONTHS_PER_YEAR = 12;
const WEEKS_PER_YEAR = DAYS_PER_YEAR / DAYS_PER_WEEK;
const WEEKS_PER_MONTH = WEEKS_PER_YEAR / MONTHS_PER_YEAR;

interface PricePerPeriodFactors {
  perDay: number;
  perWeek: number;
  perMonth: number;
  perYear: number;
}

/** Returns multipliers for expressing a period's total price per day, week, month, and year. */
export function getPricePerPeriodFactors(
  period: Period,
): PricePerPeriodFactors {
  const perUnit = period.number > 0 ? 1 / period.number : 0;

  switch (period.unit) {
    case PeriodUnit.Day:
      return {
        perDay: perUnit,
        perWeek: DAYS_PER_WEEK * perUnit,
        perMonth: DAYS_PER_MONTH * perUnit,
        perYear: DAYS_PER_YEAR * perUnit,
      };
    case PeriodUnit.Week:
      return {
        perDay: perUnit / DAYS_PER_WEEK,
        perWeek: perUnit,
        perMonth: WEEKS_PER_MONTH * perUnit,
        perYear: WEEKS_PER_YEAR * perUnit,
      };
    case PeriodUnit.Month:
      return {
        perDay: perUnit / DAYS_PER_MONTH,
        perWeek: perUnit / WEEKS_PER_MONTH,
        perMonth: perUnit,
        perYear: MONTHS_PER_YEAR * perUnit,
      };
    case PeriodUnit.Year:
      return {
        perDay: perUnit / DAYS_PER_YEAR,
        perWeek: perUnit / WEEKS_PER_YEAR,
        perMonth: perUnit / MONTHS_PER_YEAR,
        perYear: perUnit,
      };
    default:
      Logger.errorLog(`Unknown period unit: ${period.unit}`);
      return { perDay: 0, perWeek: 0, perMonth: 0, perYear: 0 };
  }
}
