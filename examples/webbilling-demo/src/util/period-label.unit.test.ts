import { describe, it, expect } from "vitest";
import { PeriodUnit, type Period } from "@revenuecat/purchases-js";
import { getLongPeriodLabel, pluralizePeriod } from "./period-label";

const period = (number: number, unit: PeriodUnit): Period => ({ number, unit });

describe("pluralizePeriod", () => {
  it("keeps the unit singular for a count of one", () => {
    expect(pluralizePeriod(1, "day")).toBe("1 day");
  });

  it("appends an s for counts above one", () => {
    expect(pluralizePeriod(3, "day")).toBe("3 days");
    expect(pluralizePeriod(2, "week")).toBe("2 weeks");
  });
});

// The badge used to map a hardcoded set of ISO durations to labels, so any
// duration missing from it (e.g. a 1-day trial, "P1D") leaked its raw ISO
// string. These cases lock in that every unit formats from the structured period.
describe("getLongPeriodLabel", () => {
  it.each([
    { name: "1 day", input: period(1, PeriodUnit.Day), expected: "1 day" },
    { name: "3 days", input: period(3, PeriodUnit.Day), expected: "3 days" },
    { name: "1 week", input: period(1, PeriodUnit.Week), expected: "1 week" },
    { name: "2 weeks", input: period(2, PeriodUnit.Week), expected: "2 weeks" },
    {
      name: "1 month",
      input: period(1, PeriodUnit.Month),
      expected: "1 month",
    },
    { name: "1 year", input: period(1, PeriodUnit.Year), expected: "1 year" },
  ])("formats a $name period", ({ input, expected }) => {
    expect(getLongPeriodLabel(input)).toBe(expected);
  });

  it("returns an empty string when there is no period", () => {
    expect(getLongPeriodLabel(null)).toBe("");
  });
});
