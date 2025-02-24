import { Logger } from "./logger";

/**
 * Represents a unit of time.
 * @public
 */
export enum PeriodUnit {
  Year = "year",
  Month = "month",
  Week = "week",
  Day = "day",
}

/**
 * Represents a period of time.
 * @public
 */
export interface Period {
  /**
   * The number of units in the period.
   */
  number: number;
  /**
   * The unit of time.
   */
  unit: PeriodUnit;
}

export function parseISODuration(duration: string): Period | null {
  const match = duration.match(/^PT?([0-9]+)([MDYW])$/);

  if (!match || match.length < 3) {
    Logger.errorLog(`Invalid ISO 8601 duration format: ${duration}`);
    return null;
  }

  const numberUnits = parseInt(match[1]);

  switch (match[2]) {
    case "Y":
      return { number: numberUnits, unit: PeriodUnit.Year };
    case "M":
      return { number: numberUnits, unit: PeriodUnit.Month };
    case "W":
      return { number: numberUnits, unit: PeriodUnit.Week };
    case "D":
      return { number: numberUnits, unit: PeriodUnit.Day };
    default:
      Logger.errorLog(`Invalid ISO 8601 unit duration format: ${duration}`);
      return null;
  }
}

export function getNextRenewalDate(
  startDate: Date,
  period: Period,
  willRenew: boolean,
): Date | null {
  if (!willRenew) {
    return null;
  }
  let result = new Date(startDate);

  switch (period.unit) {
    case PeriodUnit.Year:
      if (
        result.getDate() === 29 &&
        result.getMonth() === 1 &&
        period.number !== 4
      ) {
        result.setFullYear(
          result.getFullYear() + period.number,
          result.getMonth(),
          28,
        );
      } else {
        result.setFullYear(
          result.getFullYear() + period.number,
          result.getMonth(),
          result.getDate(),
        );
      }

      break;
    case PeriodUnit.Month:
      result.setMonth(result.getMonth() + period.number, result.getDate());
      /** If exceeded the last day of the next month, just move over and take the previous day */
      if (result.getDate() !== startDate.getDate()) {
        result = new Date(startDate);
        result.setMonth(result.getMonth() + period.number + 1, 0);
      }
      break;
    case PeriodUnit.Week:
      result.setDate(result.getDate() + period.number * 7);
      break;
    case PeriodUnit.Day:
      result.setDate(result.getDate() + period.number);
      break;
  }

  return result;
}
