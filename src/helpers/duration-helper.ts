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
