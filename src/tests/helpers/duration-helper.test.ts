import { describe, expect, test } from "vitest";
import {
  getNextRenewalDate,
  parseISODuration,
  type Period,
  PeriodUnit,
} from "../../helpers/duration-helper";

describe("parseISODuration", () => {
  test("should parse a valid ISO 8601 yearly duration", () => {
    const duration = "P1Y";
    const period = parseISODuration(duration);

    expect(period).toEqual({ number: 1, unit: PeriodUnit.Year });
  });

  test("should parse a valid ISO 8601 monthly duration", () => {
    const duration = "P3M";
    const period = parseISODuration(duration);

    expect(period).toEqual({ number: 3, unit: PeriodUnit.Month });
  });

  test("should parse a valid ISO 8601 weekly duration", () => {
    const duration = "P1W";
    const period = parseISODuration(duration);

    expect(period).toEqual({ number: 1, unit: PeriodUnit.Week });
  });

  test("should parse a valid ISO 8601 daily duration", () => {
    const duration = "P14D";
    const period = parseISODuration(duration);

    expect(period).toEqual({ number: 14, unit: PeriodUnit.Day });
  });

  test("should fail with multiple durations but valid ISO 8601 duration", () => {
    const duration = "P1Y3M";
    const period = parseISODuration(duration);

    expect(period).toBeNull();
  });

  test("should fail with invalid ISO 8601 duration", () => {
    const duration = "P3MM";
    const period = parseISODuration(duration);

    expect(period).toBeNull();
  });
});

describe("getNextRenewalDate", () => {
  test("should return null if willRenew is false", () => {
    const startDate = new Date("2025-02-24");
    const period: Period = { unit: PeriodUnit.Month, number: 1 };
    expect(getNextRenewalDate(startDate, period, false)).toBeNull();
  });

  test("should correctly add years to the date", () => {
    const startDate = new Date("2025-02-24");
    const period: Period = { unit: PeriodUnit.Year, number: 2 };
    expect(getNextRenewalDate(startDate, period, true)).toEqual(
      new Date("2027-02-24"),
    );
  });

  test("should correctly add months to the date", () => {
    const startDate = new Date("2025-01-31");
    const period: Period = { unit: PeriodUnit.Month, number: 1 };
    expect(getNextRenewalDate(startDate, period, true)).toEqual(
      new Date("2025-02-28"),
    ); // Handle month-end cases
  });

  test("should correctly add weeks to the date", () => {
    const startDate = new Date("2025-02-24");
    const period: Period = { unit: PeriodUnit.Week, number: 2 };
    expect(getNextRenewalDate(startDate, period, true)).toEqual(
      new Date("2025-03-10"),
    );
  });

  test("should correctly add days to the date", () => {
    const startDate = new Date("2025-02-24");
    const period: Period = { unit: PeriodUnit.Day, number: 10 };
    expect(getNextRenewalDate(startDate, period, true)).toEqual(
      new Date("2025-03-06"),
    );
  });

  test("should handle leap years correctly", () => {
    const startDate = new Date("2024-02-29"); // Leap year date
    const period: Period = { unit: PeriodUnit.Year, number: 1 };
    expect(getNextRenewalDate(startDate, period, true)).toEqual(
      new Date("2025-02-28"),
    );
  });

  test("should handle edge cases for month increments", () => {
    const startDate = new Date("2025-01-31");
    const period: Period = { unit: PeriodUnit.Month, number: 1 };
    expect(getNextRenewalDate(startDate, period, true)).toEqual(
      new Date("2025-02-28"),
    );
  });
});
