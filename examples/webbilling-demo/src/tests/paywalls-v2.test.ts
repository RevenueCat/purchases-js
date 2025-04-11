import test, { expect } from "@playwright/test";
import {
  getAllElementsByLocator,
  getUserId,
  navigateToUrl,
  performPurchase,
  setupTest,
  successfulEventTrackingResponseMatcher,
} from "./utils.ts";
import {
  PACKAGE_SELECTOR,
  RC_PAYWALL_TEST_OFFERING_ID,
  RC_PAYWALL_TEST_OFFERING_ID_WITH_VARIABLES,
} from "./constants.ts";

const ALLOW_PAYWALLS_TESTS = process.env.VITE_ALLOW_PAYWALLS_TESTS === "true";

test.describe("Paywalls V2", () => {
  test.skip(
    !ALLOW_PAYWALLS_TESTS,
    "Paywalls tests are disabled. To enable, set VITE_ALLOW_PAYWALLS_TESTS=true in the environment variables.",
  );

  test("Can render an RC Paywall", async ({ browser, browserName }) => {
    const userId = `${getUserId(browserName)}_subscription`;
    const page = await setupTest(browser, userId, {
      offeringId: RC_PAYWALL_TEST_OFFERING_ID,
      useRcPaywall: true,
    });
    const title = page.getByText("E2E Tests for Purchases JS");
    await expect(title).toBeVisible();
  });

  test("Can render an RC Paywall using variables", async ({
    browser,
    browserName,
  }) => {
    const userId = `${getUserId(browserName)}_subscription`;
    const page = await setupTest(browser, userId, {
      offeringId: RC_PAYWALL_TEST_OFFERING_ID_WITH_VARIABLES,
      useRcPaywall: true,
    });
    // Gets all packages
    const packageCards = await getAllElementsByLocator(page, PACKAGE_SELECTOR);

    // Get the purchase button as a Locator
    const purchaseButton = (
      await getAllElementsByLocator(page, "button.rc-pw-purchase-button")
    )[0];

    await expect(purchaseButton).toContainText(
      "PURCHASE FOR $1.25/1wk($5.00/mo)",
    );

    await packageCards[1].click();
    await expect(purchaseButton).toContainText("PURCHASE FOR $30.00");

    await packageCards[2].click();
    await expect(purchaseButton).toContainText(
      "PURCHASE FOR $19.99/1yr($1.67/mo)",
    );
  });

  test("Can purchase a subscription product for RC Paywall", async ({
    browser,
    browserName,
  }) => {
    const userId = `${getUserId(browserName)}_subscription`;
    const page = await setupTest(browser, userId, {
      offeringId: RC_PAYWALL_TEST_OFFERING_ID_WITH_VARIABLES,
      useRcPaywall: true,
    });
    const title = page.getByText("E2E Tests for Purchases JS");
    await expect(title).toBeVisible();

    // Gets all packages
    const packageCards = await getAllElementsByLocator(page, PACKAGE_SELECTOR);
    const singleCard = packageCards[0];
    // Pick the first package
    await singleCard.click();

    // Get the purchase button as a Locator
    const purchaseButton = (
      await getAllElementsByLocator(page, "button.rc-pw-purchase-button")
    )[0];

    await expect(purchaseButton).toBeVisible();

    // Target the parent element of the purchase button since the function targets the button itself
    await performPurchase(page, purchaseButton.locator(".."), userId);
  });

  [
    ["es", "¿Cuál es tu correo electrónico?"],
    ["it", "Qual è la tua email?"],
    ["en", "What's your email?"],
    ["fr", "Quelle est votre adresse e-mail?"],
    ["de", "Wie lautet Ihre E-Mail-Adresse?"],
  ].forEach(([lang, title]) => {
    test(`Shows the purchase flow in ${lang} when purchasing from paywalls`, async ({
      browser,
      browserName,
    }) => {
      const userId = `${getUserId(browserName)}_${lang}_language`;
      const page = await setupTest(browser, userId, {
        lang,
        offeringId: RC_PAYWALL_TEST_OFFERING_ID,
        useRcPaywall: true,
      });

      // Gets all packages
      const packageCards = await getAllElementsByLocator(
        page,
        PACKAGE_SELECTOR,
      );
      const singleCard = packageCards[0];
      // Pick the first package
      await singleCard.click();

      // Get the purchase button as a Locator
      const purchaseButton = (
        await getAllElementsByLocator(page, "button.rc-pw-purchase-button")
      )[0];

      await expect(purchaseButton).toBeVisible();
      await purchaseButton.click();

      await expect(page.getByText(title)).toBeVisible();
    });
  });

  test("Tracks events", async ({ browser, browserName }) => {
    const userId = `${getUserId(browserName)}_subscription`;
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
