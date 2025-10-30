import type { VariableDictionary } from "@revenuecat/purchases-ui-js";
import { type Period, PeriodUnit } from "./duration-helper";

// Conversion constants for consistent pricing calculations
export const DAYS_PER_WEEK = 7;
export const DAYS_PER_MONTH = 30;
export const DAYS_PER_YEAR = 365;
export const WEEKS_PER_MONTH = 4.33; // More accurate: 52 weeks / 12 months
export const WEEKS_PER_YEAR = 52;
export const MONTHS_PER_YEAR = 12;

function getDurationInDays(period: Period): number {
  switch (period.unit) {
    case PeriodUnit.Year:
      return period.number * DAYS_PER_YEAR;
    case PeriodUnit.Month:
      return period.number * DAYS_PER_MONTH;
    case PeriodUnit.Week:
      return period.number * DAYS_PER_WEEK;
    case PeriodUnit.Day:
      return period.number;
  }
}

function getDurationInWeeks(period: Period): number {
  switch (period.unit) {
    case PeriodUnit.Year:
      return period.number * WEEKS_PER_YEAR;
    case PeriodUnit.Month:
      return period.number * WEEKS_PER_MONTH;
    case PeriodUnit.Week:
      return period.number;
    case PeriodUnit.Day:
      return 0;
  }
}

function getDurationInMonths(period: Period): number {
  switch (period.unit) {
    case PeriodUnit.Year:
      return period.number * MONTHS_PER_YEAR;
    case PeriodUnit.Month:
      return period.number;
    case PeriodUnit.Week:
    case PeriodUnit.Day:
      return 0;
  }
}

function getDurationInYears(period: Period): number {
  switch (period.unit) {
    case PeriodUnit.Year:
      return period.number;
    case PeriodUnit.Month:
    case PeriodUnit.Week:
    case PeriodUnit.Day:
      return 0;
  }
}

export function setPeriodVariables(
  period: Period,
  variables: VariableDictionary,
) {
  variables["product.period_in_days"] = getDurationInDays(period).toString();
  variables["product.period_in_weeks"] = getDurationInWeeks(period).toString();
  variables["product.period_in_months"] =
    getDurationInMonths(period).toString();
  variables["product.period_in_years"] = getDurationInYears(period).toString();
}
