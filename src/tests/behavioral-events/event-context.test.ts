import { buildEventContext } from "../../behavioural-events/event-context";
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
      library: {
        name: "purchases-js",
        version: VERSION,
      },
      locale: "en-US",
      user_agent: "Mozilla/5.0",
      time_zone: "America/New_York",
      screen_size: {
        width: 1920,
        height: 1080,
      },
      utm: {
        source: "google",
        medium: "cpc",
        campaign: "spring_sale",
        content: null,
        term: null,
      },
      page: {
        referrer: "https://referrer.com",
        url: "https://example.com/home?utm_source=google&utm_medium=cpc&utm_campaign=spring_sale",
        title: "Example Page",
      },
    });
  });
});
