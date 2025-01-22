import type { Browser, Page, Response } from "@playwright/test";
import test, { expect } from "@playwright/test";
import type { Locator } from "playwright";

const _LOCAL_URL = "http://localhost:3001/";
const CARD_SELECTOR = "div.card";
const PACKAGE_SELECTOR = "button.rc-pw-package";
const RC_PAYWALL_TEST_OFFERING_ID = "rc_paywalls_e2e_test_2";
const RC_PAYWALL_TEST_OFFERING_ID_WITH_VARIABLES =
  "rc_paywalls_e2e_test_variables_2";

test.describe("Main", () => {
  test.afterEach(({ browser }) => {
    browser.close();
  });

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

  test("Can purchase a subscription Product", async ({
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

  test("Can purchase a subscription Product for RC Paywall", async ({
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

  test("Can purchase a consumable Product", async ({
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

  test("Can purchase a non consumable Product", async ({
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

    await page.route("*/**/purchase", async (route) => {
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
    ["es", "Email de facturación"],
    ["it", "Indirizzo email per la fatturazione"],
    ["en", "Billing email address"],
    ["fr", "Adresse e-mail de facturation"],
    ["de", "E-Mail-Adresse für Rechnungsstellung"],
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
    ["es", "Email de facturación"],
    ["it", "Indirizzo email per la fatturazione"],
    ["en", "Billing email address"],
    ["fr", "Adresse e-mail de facturation"],
    ["de", "E-Mail-Adresse für Rechnungsstellung"],
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

  test("Tracks event SDK Initialized", async ({ browser, browserName }) => {
    const userId = `${getUserId(browserName)}_subscription`;
    const page = await browser.newPage();

    const waitForTrackEventPromise = page.waitForResponse(
      successfulEventTrackingResponseMatcher((event) => {
        return (
          event.event_name === "SDK_INITIALIZED" &&
          event.type === "rc_billing_event" &&
          event.sdk_version !== undefined
        );
      }),
      { timeout: 3_000 },
    );
    await navigateToUrl(page, userId);
    await waitForTrackEventPromise;
  });
});

function successfulEventTrackingResponseMatcher(
  eventMatcher: (event: Record<string, unknown>) => boolean,
) {
  return async (response: Response) => {
    if (
      response.url() !== "https://api.revenuecat.com/v1/events" ||
      response.status() !== 200
    ) {
      return false;
    }

    const json = response.request().postDataJSON();
    const sdk_initialized_events = (json?.events || []).filter(eventMatcher);
    return sdk_initialized_events.length === 1;
  };
}

async function startPurchaseFlow(card: Locator) {
  // Perform purchase
  const cardButton = card.getByRole("button");
  await cardButton.click();
}

async function performPurchase(page: Page, card: Locator, userId: string) {
  await startPurchaseFlow(card);

  await enterEmailAndContinue(page, userId);
  await enterCreditCardDetailsAndContinue(page);

  // Confirm success page has shown.
  const successText = page.getByText("Purchase successful");
  await expect(successText).toBeVisible({ timeout: 10000 });
}

const getUserId = (browserName: string) =>
  `rc_billing_demo_test_${Date.now()}_${browserName}`;

async function setupTest(
  browser: Browser,
  userId: string,
  queryString?: {
    offeringId?: string;
    useRcPaywall?: boolean;
    lang?: string;
  },
) {
  const page = await browser.newPage();
  await navigateToUrl(page, userId, queryString);

  return page;
}

async function getAllElementsByLocator(
  page: Page,
  locator: string,
  containsText?: string,
) {
  await page.waitForSelector(locator);
  let locatorResult = page.locator(locator);
  if (containsText !== undefined) {
    locatorResult = locatorResult.filter({ hasText: containsText });
  }
  return await locatorResult.all();
}

async function enterEmailAndContinue(
  page: Page,
  userId: string,
): Promise<void> {
  const email = `${userId}@revenuecat.com`;

  await typeTextInPageSelector(page, email);
  await page.getByRole("button", { name: "Continue" }).click();
}

async function enterCreditCardDetailsAndContinue(page: Page): Promise<void> {
  // Checmout modal
  const checkoutTitle = page.getByText("Secure Checkout");
  await expect(checkoutTitle).toBeVisible();
  const stripeFrame = page.frameLocator(
    "iframe[title='Secure payment input frame']",
  );

  const numberInput = stripeFrame.getByPlaceholder("1234 1234 1234");
  await numberInput.fill("4242 4242 4242 4242");

  const expirationYear = (new Date().getFullYear() % 100) + 3;
  await stripeFrame.getByPlaceholder("MM / YY").fill(`01 / ${expirationYear}`);
  await stripeFrame.getByLabel("Security Code").fill("123");
  await stripeFrame.getByLabel("Country").selectOption("US");
  await stripeFrame.getByPlaceholder("12345").fill("12345");
  await page.getByTestId("PayButton").click();
}

async function navigateToUrl(
  page: Page,
  userId: string,
  queryString?: {
    offeringId?: string;
    useRcPaywall?: boolean;
    lang?: string;
  },
): Promise<void> {
  const baseUrl =
    (import.meta.env?.VITE_RC_BILLING_DEMO_URL as string | undefined) ??
    _LOCAL_URL;

  const { offeringId, useRcPaywall, lang } = queryString ?? {};

  const params = new URLSearchParams();
  if (offeringId) {
    params.append("offeringId", offeringId);
  }
  if (lang) {
    params.append("lang", lang);
  }

  const url = `${baseUrl}${useRcPaywall ? "rc_paywall" : "paywall"}/${encodeURIComponent(userId)}?${params.toString()}`;
  await page.goto(url);
}

async function typeTextInPageSelector(page: Page, text: string): Promise<void> {
  // Fill email
  const emailTitle = page.getByText("Billing email address");
  await expect(emailTitle).toBeVisible();
  await page.getByPlaceholder("john@appleseed.com").click();
  await page.getByPlaceholder("john@appleseed.com").fill(text);
}
