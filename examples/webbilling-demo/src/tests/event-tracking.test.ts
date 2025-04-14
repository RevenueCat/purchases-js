import type { Response } from "@playwright/test";
import { expect } from "@playwright/test";
import { navigateToLandingUrl } from "./helpers/test-helpers";
import { integrationTest } from "./helpers/integration-test";
import { VITE_RC_ANALYTICS_ENDPOINT } from "./helpers/fixtures";

integrationTest("Tracks events", async ({ page, userId }) => {
  integrationTest.skip(
    !process.env.CI && VITE_RC_ANALYTICS_ENDPOINT === undefined,
    "VITE_RC_ANALYTICS_ENDPOINT is not set",
  );

  page = await navigateToLandingUrl(page, userId);

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
  await navigateToLandingUrl(page, userId);
  await waitForTrackEventPromise;
});

function successfulEventTrackingResponseMatcher(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eventMatcher: (event: any) => boolean,
) {
  return async (response: Response) => {
    const endpoint =
      VITE_RC_ANALYTICS_ENDPOINT ?? "https://e.revenue.cat/v1/events";
    if (response.url() !== endpoint || response.status() !== 200) {
      return false;
    }

    const json = response.request().postDataJSON();
    const sdk_initialized_events = (json?.events || []).filter(eventMatcher);
    return sdk_initialized_events.length === 1;
  };
}
