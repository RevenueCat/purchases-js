import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import {
  getPackageCards,
  navigateToLandingUrl,
  startPurchaseFlow,
} from "./helpers/test-helpers";
import { integrationTest } from "./helpers/integration-test";

integrationTest(
  "Propagates UTM params to metadata when purchasing",
  async ({ page, userId }) => {
    const utm_params = {
      utm_source: "utm-source",
      utm_medium: "utm-medium",
      utm_campaign: "utm-campaign",
      utm_term: "utm-term",
      utm_content: "utm-content",
    };
    page = await navigateToLandingUrl(page, userId, { ...utm_params });

    const packageCards = await getPackageCards(page);
    const request = waitForCheckoutStartRequest(page, {});
    await startPurchaseFlow(page, packageCards[1]);
    await request;
  },
);

integrationTest(
  "Does not propagate UTM params to metadata when purchasing if the developer opts out",
  async ({ page, userId }) => {
    const utm_params = {
      utm_source: "utm-source",
      utm_medium: "utm-medium",
      utm_campaign: "utm-campaign",
      utm_term: "utm-term",
      utm_content: "utm-content",
    };
    page = await navigateToLandingUrl(page, userId, {
      ...utm_params,
      optOutOfAutoUTM: true,
    });

    const packageCards = await getPackageCards(page);
    const request = waitForCheckoutStartRequest(page, {});
    await startPurchaseFlow(page, packageCards[1]);
    await request;
  },
);

export const waitForCheckoutStartRequest = (
  page: Page,
  expectedMetadata: Record<string, string>,
) => {
  return page.waitForRequest((request) => {
    if (
      request.url().includes("checkout/start") &&
      request.method() === "POST"
    ) {
      expect(request.postDataJSON().metadata).toStrictEqual(expectedMetadata);
      return true;
    }
    return false;
  });
};
