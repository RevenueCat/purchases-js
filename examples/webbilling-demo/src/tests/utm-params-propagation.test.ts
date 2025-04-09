import type { Page } from "@playwright/test";
import test, { expect } from "@playwright/test";
import {
  getPackageCards,
  getUserId,
  setupTest,
  startPurchaseFlow,
} from "./test-helpers";

test.describe("UTM Params Propagation", () => {
  test("Propagates UTM params to metadata when purchasing", async ({
    browser,
    browserName,
  }) => {
    const userId = getUserId(browserName);
    const utm_params = {
      utm_source: "utm-source",
      utm_medium: "utm-medium",
      utm_campaign: "utm-campaign",
      utm_term: "utm-term",
      utm_content: "utm-content",
    };
    const page = await setupTest(browser, userId, { ...utm_params });

    const packageCards = await getPackageCards(page);
    const requestPromise = waitForCheckoutStartRequest(page, utm_params);
    await startPurchaseFlow(packageCards[1]);
    await requestPromise;
  });

  test("Does not propagate UTM params to metadata when purchasing if the developer opts out", async ({
    browser,
    browserName,
  }) => {
    const userId = getUserId(browserName);
    const utm_params = {
      utm_source: "utm-source",
      utm_medium: "utm-medium",
      utm_campaign: "utm-campaign",
      utm_term: "utm-term",
      utm_content: "utm-content",
    };
    const page = await setupTest(browser, userId, {
      ...utm_params,
      optOutOfAutoUTM: true,
    });

    const packageCards = await getPackageCards(page);
    const requestPromise = waitForCheckoutStartRequest(page, {});
    await startPurchaseFlow(packageCards[1]);
    await requestPromise;
  });
});

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
