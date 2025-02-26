import { describe, expect, test } from "vitest";
import { capitalize } from "../../helpers/string-helpers";

describe("capitalize", () => {
  test("capitalizes the first letter of a lowercase word", () => {
    expect(capitalize("hello")).toBe("Hello");
  });

  test("keeps the first letter capitalized if already uppercase", () => {
    expect(capitalize("Hello")).toBe("Hello");
  });

  test("handles empty strings", () => {
    expect(capitalize("")).toBe("");
  });

  test("handles a string with only one character", () => {
    expect(capitalize("a")).toBe("A");
    expect(capitalize("A")).toBe("A");
  });

  test("handles strings with special characters", () => {
    expect(capitalize("!hello")).toBe("!hello");
  });
});
