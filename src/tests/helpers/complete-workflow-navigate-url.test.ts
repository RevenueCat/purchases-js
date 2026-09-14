import { describe, expect, test } from "vitest";
import { isAllowedCompleteWorkflowNavigateUrl } from "../../helpers/complete-workflow-navigate-url";

describe("isAllowedCompleteWorkflowNavigateUrl", () => {
  test("allows http(s) for external_browser", () => {
    expect(
      isAllowedCompleteWorkflowNavigateUrl(
        "https://example.com/path",
        "external_browser",
      ),
    ).toBe(true);
    expect(
      isAllowedCompleteWorkflowNavigateUrl("http://a.test", "external_browser"),
    ).toBe(true);
  });

  test("allows http(s) for in_app_browser", () => {
    expect(
      isAllowedCompleteWorkflowNavigateUrl(
        "https://example.com/",
        "in_app_browser",
      ),
    ).toBe(true);
  });

  test("rejects non-http(s) schemes for external_browser and in_app_browser", () => {
    expect(
      isAllowedCompleteWorkflowNavigateUrl("myapp://home", "external_browser"),
    ).toBe(false);
    expect(
      isAllowedCompleteWorkflowNavigateUrl("myapp://home", "in_app_browser"),
    ).toBe(false);
  });

  test("allows custom schemes for deep_link when not dangerous", () => {
    expect(
      isAllowedCompleteWorkflowNavigateUrl("myapp://home", "deep_link"),
    ).toBe(true);
    expect(
      isAllowedCompleteWorkflowNavigateUrl("https://x.test", "deep_link"),
    ).toBe(true);
  });

  test("rejects dangerous schemes for all methods", () => {
    for (const method of [
      "deep_link",
      "external_browser",
      "in_app_browser",
    ] as const) {
      expect(
        isAllowedCompleteWorkflowNavigateUrl("javascript:alert(1)", method),
      ).toBe(false);
      expect(
        isAllowedCompleteWorkflowNavigateUrl("data:text/html,hi", method),
      ).toBe(false);
      expect(
        isAllowedCompleteWorkflowNavigateUrl("vbscript:evil", method),
      ).toBe(false);
    }
  });

  test("rejects empty and invalid URLs", () => {
    expect(isAllowedCompleteWorkflowNavigateUrl("", "external_browser")).toBe(
      false,
    );
    expect(
      isAllowedCompleteWorkflowNavigateUrl("   ", "external_browser"),
    ).toBe(false);
    expect(
      isAllowedCompleteWorkflowNavigateUrl("not a url", "external_browser"),
    ).toBe(false);
  });
});
