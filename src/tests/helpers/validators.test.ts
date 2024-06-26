import { describe, expect, test } from "vitest";
import { validateEmail } from "../../helpers/validators";

describe("validateEmail", () => {
  test("validates empty email correctly", () => {
    expect(validateEmail("")).toEqual(
      "You need to provide your email address to continue.",
    );
  });

  test("validates invalid email correctly", () => {
    expect(validateEmail("ajajdfljf@lkajd")).toEqual(
      "Email is not valid. Please provide a valid email address.",
    );
  });

  test("validates valid email correctly", () => {
    expect(validateEmail("test123@revenuecat.com")).toEqual(null);
  });
});
