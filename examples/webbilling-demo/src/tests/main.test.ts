import test, { expect } from "@playwright/test";
import {
  enterCreditCardDetailsAndContinue,
  enterEmailAndContinue,
  getAllElementsByLocator,
  getUserId,
  navigateToUrl,
  performPurchase,
  setupTest,
  startPurchaseFlow,
  successfulEventTrackingResponseMatcher,
  waitForCheckoutStartRequest,
} from "./utils.ts";

const CARD_SELECTOR = "div.card";
const PACKAGE_SELECTOR = "button.rc-pw-package";
const RC_PAYWALL_TEST_OFFERING_ID = "rc_paywalls_e2e_test_2";
const RC_PAYWALL_TEST_OFFERING_ID_WITH_VARIABLES =
  "rc_paywalls_e2e_test_variables_2";

test.describe("Main", () => {
  test("Get offerings displays packages", async ({ browser, browserName }) => {
    const userId = getUserId(browserName);
    const page = await setupTest(browser, userId);
    // Gets all elements that match the selector
    const packageCards = await getAllElementsByLocator(page, CARD_SELECTOR);

    const EXPECTED_VALUES = [
      /30[,.]00/,
      /19[,.]99/,
      /15[,.]00/,
      /99[,.]99/,
      /2[,.]99/,
    ];

    await Promise.all(
      packageCards.map(
        async (card, index) =>
          await expect(card).toHaveText(EXPECTED_VALUES[index]),
      ),
    );
  });

  test("Get offerings can filter by offering ID", async ({
    browser,
    browserName,
  }) => {
    const userId = getUserId(browserName);
    const offeringId = "default_download";
    const page = await setupTest(browser, userId, { offeringId });

    const packageCards = await getAllElementsByLocator(page, CARD_SELECTOR);

    const EXPECTED_VALUES = [/30[,.]00/, /15[,.]00/, /19[,.]99/];

    expect(packageCards.length).toBe(3);
    await Promise.all(
      packageCards.map(
        async (card, index) =>
          await expect(card).toHaveText(EXPECTED_VALUES[index]),
      ),
    );
  });

  test("Can purchase a subscription product", async ({
    browser,
    browserName,
  }) => {
    const userId = `${getUserId(browserName)}_subscription`;
    const page = await setupTest(browser, userId);

    // Gets all elements that match the selector
    const packageCards = await getAllElementsByLocator(page, CARD_SELECTOR);
    const singleCard = packageCards[1];

    await performPurchase(page, singleCard, userId);
  });

  test("Displays handled form submission errors", async ({
    browser,
    browserName,
  }) => {
    const userId = `${getUserId(browserName)}_subscription`;
    const page = await setupTest(browser, userId);

    // Gets all elements that match the selector
    const packageCards = await getAllElementsByLocator(page, CARD_SELECTOR);
    const singleCard = packageCards[1];

    await startPurchaseFlow(singleCard);
    await enterEmailAndContinue(page, userId);

    // Try with an invalid card declined server side
    await enterCreditCardDetailsAndContinue(page, "4000 0000 0000 0002");
    const stripeFrame = page.frameLocator(
      "iframe[title='Secure payment input frame']",
    );
    const errorText = stripeFrame.getByText("Your card was declined.");
    await expect(errorText).toBeVisible({ timeout: 10000 });
  });

  test("Displays unhandled form submission errors", async ({
    browser,
    browserName,
  }) => {
    const userId = `${getUserId(browserName)}_subscription`;
    const page = await setupTest(browser, userId);

    // Gets all elements that match the selector
    const packageCards = await getAllElementsByLocator(page, CARD_SELECTOR);
    const singleCard = packageCards[1];

    await startPurchaseFlow(singleCard);
    await enterEmailAndContinue(page, userId);

    // Try with an invalid card declined server side
    await enterCreditCardDetailsAndContinue(page, "4000003800000446");

    const stripe3DSFrame = page.frameLocator(
      "iframe[src*='https://js.stripe.com/v3/three-ds-2-challenge']",
    );

    const cancelButton = stripe3DSFrame.getByText("Cancel");
    await expect(cancelButton).toBeVisible({
      timeout: 10000,
    });

    await cancelButton.click();

    const errorText = page.getByText(
      "We are unable to authenticate your payment method. Please choose a different payment method and try again.",
    );
    await expect(errorText).toBeVisible({ timeout: 10000 });
  });

  test("Propagates UTM params to metadata when purchasing", async ({
    browser,
    browserName,
  }) => {
    const userId = `${getUserId(browserName)}_subscription`;
    const utm_params = {
      utm_source: "utm-source",
      utm_medium: "utm-medium",
      utm_campaign: "utm-campaign",
      utm_term: "utm-term",
      utm_content: "utm-content",
    };
    const page = await setupTest(browser, userId, { ...utm_params });

    // Gets all elements that match the selector
    const packageCards = await getAllElementsByLocator(page, CARD_SELECTOR);
    const singleCard = packageCards[1];

    const requestPromise = waitForCheckoutStartRequest(page);

    await performPurchase(page, singleCard, userId);

    const request = await requestPromise;
    expect(request.postDataJSON()).toHaveProperty("metadata");
    const metadata = request.postDataJSON().metadata;
    expect(metadata).toStrictEqual(utm_params);
  });

  test("Does not propagate UTM params to metadata when purchasing if the developer opts out", async ({
    browser,
    browserName,
  }) => {
    const userId = `${getUserId(browserName)}_subscription`;
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

    // Gets all elements that match the selector
    const packageCards = await getAllElementsByLocator(page, CARD_SELECTOR);
    const singleCard = packageCards[1];

    const requestPromise = waitForCheckoutStartRequest(page);

    await performPurchase(page, singleCard, userId);

    const request = await requestPromise;
    expect(request.postDataJSON()).toHaveProperty("metadata");
    const metadata = request.postDataJSON().metadata;
    expect(metadata).toStrictEqual({});
  });

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

  test("Can purchase a consumable product", async ({
    browser,
    browserName,
  }) => {
    const userId = `${getUserId(browserName)}_consumable`;
    const page = await setupTest(browser, userId);

    // Gets all elements that match the selector
    const packageCards = await getAllElementsByLocator(
      page,
      CARD_SELECTOR,
      "E2E Consumable",
    );
    expect(packageCards.length).toEqual(1);
    const singleCard = packageCards[0];

    await performPurchase(page, singleCard, userId);
  });

  test("Can purchase a non consumable product", async ({
    browser,
    browserName,
  }) => {
    const userId = `${getUserId(browserName)}_non_consumable`;
    const page = await setupTest(browser, userId);

    // Gets all elements that match the selector
    const packageCards = await getAllElementsByLocator(
      page,
      CARD_SELECTOR,
      "E2E NonConsumable",
    );
    expect(packageCards.length).toEqual(1);
    const singleCard = packageCards[0];

    await performPurchase(page, singleCard, userId);
  });

  test("Displays error when unknown backend error", async ({
    browser,
    browserName,
  }) => {
    const userId = `${getUserId(browserName)}_already_purchased`;
    const page = await setupTest(browser, userId);

    // Gets all elements that match the selector
    const packageCards = await getAllElementsByLocator(page, CARD_SELECTOR);
    const singleCard = packageCards[1];

    // Perform purchase
    const cardButton = singleCard.getByRole("button");
    await cardButton.click();

    await page.route("*/**/checkout/start", async (route) => {
      await route.fulfill({
        body: '{ "code": 7110, "message": "Test error message"}',
        status: 400,
      });
    });

    await enterEmailAndContinue(page, userId);

    // Confirm error page has shown.
    const errorTitleText = page.getByText("Something went wrong");
    await expect(errorTitleText).toBeVisible();

    const errorMessageText = page.getByText(
      "Purchase not started due to an error. Error code: 7110",
    );
    await expect(errorMessageText).toBeVisible();
  });

  [
    ["es", "¿Cuál es tu correo electrónico?"],
    ["it", "Qual è la tua email?"],
    ["en", "What's your email?"],
    ["fr", "Quelle est votre adresse e-mail?"],
    ["de", "Wie lautet Ihre E-Mail-Adresse?"],
  ].forEach(([lang, title]) => {
    test(`Shows the purchase flow in ${lang}`, async ({
      browser,
      browserName,
    }) => {
      const userId = `${getUserId(browserName)}_${lang}_language`;
      const page = await setupTest(browser, userId, { lang });

      // Gets all elements that match the selector
      const packageCards = await getAllElementsByLocator(page, CARD_SELECTOR);
      const singleCard = packageCards[1];

      await startPurchaseFlow(singleCard);

      await expect(page.getByText(title)).toBeVisible();
    });
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
