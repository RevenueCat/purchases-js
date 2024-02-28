import { describe, expect, test } from "vitest";
import { parseISODuration, PeriodUnit } from "../../helpers/duration-helper";

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
