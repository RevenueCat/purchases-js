import test, { Browser, expect, Page } from "@playwright/test";

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

    const EXPECTED_VALUES = [/30\.00/, /19\.99/, /15\.00/];

    await Promise.all(
      packageCards.map(
        async (card, index) =>
          await expect(card).toHaveText(EXPECTED_VALUES[index]),
      ),
    );
  });

  test("Can purchase a Product", async ({ browser, browserName }) => {
    const userId = getUserId(browserName);
    const page = await setupTest(browser, userId);

    // Gets all elements that match the selector
    const packageCards = await getAllElementsByLocator(page, CARD_SELECTOR);
    const singleCard = packageCards[1];

    // Perform purchase
    const cardButton = singleCard.getByRole("button");
    await cardButton.click();

    await enterEmailAndContinue(page, userId);
    await enterCreditCardDetailsAndContinue(page);

    // Confirm success page has shown.
    const successText = page.getByText("Purchase successful");
    await expect(successText).toBeVisible();
  });
});

const getUserId = (browserName: string) =>
  `rc_billing_demo_test_${Date.now()}_${browserName}`;

async function setupTest(browser: Browser, userId: string) {
  const page = await browser.newPage();
  await navigateToUrl(page, userId);
  return page;
}

async function getAllElementsByLocator(page: Page, locator: string) {
  await page.waitForSelector(locator);
  const locatorResult = page.locator(locator);
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
  await page.getByRole("button", { name: "Pay" }).click();
}

async function navigateToUrl(page: Page, userId: string): Promise<void> {
  const baseUrl =
    (import.meta.env?.VITE_RC_BILLING_DEMO_URL as string | undefined) ??
    _LOCAL_URL;
  await page.goto(`${baseUrl}paywall/${encodeURIComponent(userId)}`);
}

async function typeTextInPageSelector(page: Page, text: string): Promise<void> {
  // Fill email
  const emailTitle = page.getByText("Billing email address");
  await expect(emailTitle).toBeVisible();
  await page.getByPlaceholder("john@appleseed.com").click();
  await page.getByPlaceholder("john@appleseed.com").fill(text);
}
