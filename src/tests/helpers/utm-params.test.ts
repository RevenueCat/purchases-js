import { describe, expect, test } from "vitest";
import { spyOn } from "@vitest/spy";
import { autoParseUTMParams } from "../../helpers/utm-params";

describe("autoParseUTMParams", () => {
  test("should return an empty object if no utm param is set", () => {
    spyOn(URLSearchParams.prototype, "get").mockImplementation(() => null);
    const utmParams = autoParseUTMParams();
    expect(utmParams).toEqual({});
  });

  test("should return all utm params if set", () => {
    const mockUTMParams: { [key: string]: string } = {
      utm_source: "source",
      utm_medium: "medium",
      utm_campaign: "campaign",
      utm_term: "term",
      utm_content: "content",
    };

    spyOn(URLSearchParams.prototype, "get").mockImplementation(
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

  test("should return only the utm params that are set set", () => {
    const mockUTMParams: { [key: string]: string | null } = {
      utm_source: "source",
      utm_campaign: null,
      utm_term: "term",
      utm_content: "content",
    };

    spyOn(URLSearchParams.prototype, "get").mockImplementation(
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
