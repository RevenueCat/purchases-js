import { describe, expect, test } from "vitest";
import { isAllowedNavigateUrl } from "../../helpers/complete-workflow-navigate-url";

describe("isAllowedNavigateUrl", () => {
  test("allows http(s) for external_browser", () => {
    expect(
      isAllowedNavigateUrl("https://example.com/path", "external_browser"),
    ).toBe(true);
    expect(isAllowedNavigateUrl("http://a.test", "external_browser")).toBe(
      true,
    );
  });

  test("allows http(s) for in_app_browser", () => {
    expect(isAllowedNavigateUrl("https://example.com/", "in_app_browser")).toBe(
      true,
    );
  });

  test("rejects non-http(s) schemes for external_browser and in_app_browser", () => {
    expect(isAllowedNavigateUrl("myapp://home", "external_browser")).toBe(
      false,
    );
    expect(isAllowedNavigateUrl("myapp://home", "in_app_browser")).toBe(false);
  });

  test("allows custom schemes for deep_link when not dangerous", () => {
    expect(isAllowedNavigateUrl("myapp://home", "deep_link")).toBe(true);
    expect(isAllowedNavigateUrl("https://x.test", "deep_link")).toBe(true);
  });

  test("rejects dangerous schemes for all methods", () => {
    for (const method of [
      "deep_link",
      "external_browser",
      "in_app_browser",
    ] as const) {
      expect(isAllowedNavigateUrl("javascript:alert(1)", method)).toBe(false);
      expect(isAllowedNavigateUrl("data:text/html,hi", method)).toBe(false);
      expect(isAllowedNavigateUrl("vbscript:evil", method)).toBe(false);
    }
  });

  test("rejects empty and invalid URLs", () => {
    expect(isAllowedNavigateUrl("", "external_browser")).toBe(false);
    expect(isAllowedNavigateUrl("   ", "external_browser")).toBe(false);
    expect(isAllowedNavigateUrl("not a url", "external_browser")).toBe(false);
  });
});
