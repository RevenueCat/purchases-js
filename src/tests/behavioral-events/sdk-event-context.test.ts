import { buildEventContext } from "../../behavioural-events/sdk-event-context";
import { VERSION } from "../../helpers/constants";
import { beforeAll, describe, expect, it } from "vitest";

describe("buildEventContext", () => {
  beforeAll(() => {
    // Mocking global objects
    Object.defineProperty(window, "location", {
      value: {
        search: "?utm_source=google&utm_medium=cpc&utm_campaign=spring_sale",
        pathname: "/home",
        href: "https://example.com/home?utm_source=google&utm_medium=cpc&utm_campaign=spring_sale",
      },
      writable: true,
    });

    Object.defineProperty(document, "referrer", {
      value: "https://referrer.com",
      writable: true,
    });

    Object.defineProperty(document, "title", {
      value: "Example Page",
      writable: true,
    });

    Object.defineProperty(navigator, "language", {
      value: "en-US",
      writable: true,
    });

    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0",
      writable: true,
    });

    Object.defineProperty(Intl.DateTimeFormat.prototype, "resolvedOptions", {
      value: () => ({ timeZone: "America/New_York" }),
      writable: true,
    });

    Object.defineProperty(screen, "width", {
      value: 1920,
      writable: true,
    });

    Object.defineProperty(screen, "height", {
      value: 1080,
      writable: true,
    });
  });

  it("should build the correct event context", () => {
    const context = buildEventContext();

    expect(context).toEqual({
      libraryName: "purchases-js",
      libraryVersion: VERSION,
      locale: "en-US",
      userAgent: "Mozilla/5.0",
      timeZone: "America/New_York",
      screenWidth: 1920,
      screenHeight: 1080,
      utmSource: "google",
      utmMedium: "cpc",
      utmCampaign: "spring_sale",
      utmContent: null,
      utmTerm: null,
      pageReferrer: "https://referrer.com",
      pageUrl:
        "https://example.com/home?utm_source=google&utm_medium=cpc&utm_campaign=spring_sale",
      pageTitle: "Example Page",
    });
  });
});
