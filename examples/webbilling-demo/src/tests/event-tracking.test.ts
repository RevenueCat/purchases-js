import type { Response } from "@playwright/test";
import test, { expect } from "@playwright/test";
import { getUserId, navigateToUrl } from "./test-helpers";

test.describe("Event Tracking", () => {
  test("Tracks events", async ({ browser, browserName }) => {
    const userId = getUserId(browserName);
    const page = await browser.newPage();

    const waitForTrackEventPromise = page.waitForResponse(
      successfulEventTrackingResponseMatcher((event) => {
        try {
          expect(event?.id).toBeDefined();
          expect(event?.timestamp_ms).toBeDefined();
          expect(event?.type).toBe("web_billing");
          expect(event?.event_name).toBe("sdk_initialized");
          expect(event?.app_user_id).toBe(userId);

          const context = event?.context;
          expect(context).toBeInstanceOf(Object);

          expect(context.library_name).toEqual("purchases-js");
          expect(typeof context.library_version).toBe("string");
          expect(typeof context.locale).toBe("string");
          expect(typeof context.user_agent).toBe("string");
          expect(typeof context.time_zone).toBe("string");
          expect(typeof context.screen_width).toBe("number");
          expect(typeof context.screen_height).toBe("number");
          expect(context.utm_source).toBeNull();
          expect(context.utm_medium).toBeNull();
          expect(context.utm_campaign).toBeNull();
          expect(context.utm_content).toBeNull();
          expect(context.utm_term).toBeNull();
          expect(context.page_referrer).toBe("");
          expect(typeof context.page_url).toBe("string");
          expect(context.page_title).toBe("Health Check – Web Billing Demo");
          expect(context.source).toBe("sdk");

          const properties = event?.properties;
          expect(typeof properties.trace_id).toBe("string");

          return true;
        } catch (error) {
          console.error("Event validation failed:", error);
          return false;
        }
      }),
      { timeout: 3_000 },
    );
    await navigateToUrl(page, userId);
    await waitForTrackEventPromise;
  });
});

function successfulEventTrackingResponseMatcher(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eventMatcher: (event: any) => boolean,
) {
  return async (response: Response) => {
    if (
      response.url() !== "https://e.revenue.cat/v1/events" ||
      response.status() !== 200
    ) {
      return false;
    }

    const json = response.request().postDataJSON();
    const sdk_initialized_events = (json?.events || []).filter(eventMatcher);
    return sdk_initialized_events.length === 1;
  };
}
