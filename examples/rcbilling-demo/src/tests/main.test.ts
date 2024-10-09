import test, { Browser, expect, Page } from "@playwright/test";
import { Locator } from "playwright";

const _LOCAL_URL = "http://localhost:3001/";
const CARD_SELECTOR = "div.card";

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
    const page = await setupTest(browser, userId, offeringId);

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
});

async function performPurchase(page: Page, card: Locator, userId: string) {
  // Perform purchase
  const cardButton = card.getByRole("button");
  await cardButton.click();

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
  offeringId?: string,
) {
  const page = await browser.newPage();
  await navigateToUrl(page, userId, offeringId);

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
  await stripeFrame.getByPlaceholder("CVC").fill("123");
  await stripeFrame.getByLabel("Country").selectOption("US");
  await stripeFrame.getByPlaceholder("12345").fill("12345");
  await page.getByTestId("PayButton").click();
}

async function navigateToUrl(
  page: Page,
  userId: string,
  offeringId?: string,
): Promise<void> {
  const baseUrl =
    (import.meta.env?.VITE_RC_BILLING_DEMO_URL as string | undefined) ??
    _LOCAL_URL;

  const url = `${baseUrl}paywall/${encodeURIComponent(userId)}${
    offeringId ? `?offeringId=${offeringId}` : ""
  }`;
  await page.goto(url);
}

async function typeTextInPageSelector(page: Page, text: string): Promise<void> {
  // Fill email
  const emailTitle = page.getByText("Billing email address");
  await expect(emailTitle).toBeVisible();
  await page.getByPlaceholder("john@appleseed.com").click();
  await page.getByPlaceholder("john@appleseed.com").fill(text);
}
