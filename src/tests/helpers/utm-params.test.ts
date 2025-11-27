import { describe, expect, test, vi } from "vitest";
import { autoParseUTMParams } from "../../helpers/utm-params";

describe("autoParseUTMParams", () => {
  test("Returns an empty object if no utm param is set", () => {
    vi.spyOn(URLSearchParams.prototype, "get").mockImplementation(() => null);
    const utmParams = autoParseUTMParams();
    expect(utmParams).toEqual({});
  });

  test("Returns all utm params if set", () => {
    const mockUTMParams: { [key: string]: string } = {
      utm_source: "source",
      utm_medium: "medium",
      utm_campaign: "campaign",
      utm_term: "term",
      utm_content: "content",
    };

    vi.spyOn(URLSearchParams.prototype, "get").mockImplementation(
      (key: string) => {
        if (mockUTMParams[key] === undefined) {
          return null;
        }
        return mockUTMParams[key];
      },
    );

    const utmParams = autoParseUTMParams();
    expect(utmParams).toEqual(mockUTMParams);
  });

  test("Returns only the utm params that are set set", () => {
    const mockUTMParams: { [key: string]: string | null } = {
      utm_source: "source",
      utm_campaign: null,
      utm_term: "term",
      utm_content: "content",
    };

    vi.spyOn(URLSearchParams.prototype, "get").mockImplementation(
      (key: string) => {
        if (mockUTMParams[key] === undefined) {
          return null;
        }
        return mockUTMParams[key];
      },
    );

    const utmParams = autoParseUTMParams();
    expect(utmParams).toEqual({
      utm_source: "source",
      utm_term: "term",
      utm_content: "content",
    });
  });
});
