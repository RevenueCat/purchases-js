import test, { expect } from "@playwright/test";
import {
  clickPayButton,
  confirmPaymentComplete,
  enterCreditCardDetails,
  enterEmail,
  getAllElementsByLocator,
  getEmailFromUserId,
  getPackageCards,
  getPaywallPackageCards,
  getStripe3DSFrame,
  getStripeEmailFrame,
  getStripePaymentFrame,
  getUserId,
  performPurchase,
  RC_PAYWALL_TEST_OFFERING_ID_WITH_VARIABLES,
  setupTest,
  startPurchaseFlow,
} from "./test-helpers";

test.describe("Purchase flows", () => {
  test("Can purchase a subscription product", async ({
    browser,
    browserName,
  }) => {
    const userId = getUserId(browserName);
    const page = await setupTest(browser, userId);

    const packageCards = await getPackageCards(page);
    await performPurchase(page, packageCards[1], userId);
  });

  test("Can purchase a subscription product for RC Paywall", async ({
    browser,
    browserName,
  }) => {
    const userId = getUserId(browserName);
    const page = await setupTest(browser, userId, {
      offeringId: RC_PAYWALL_TEST_OFFERING_ID_WITH_VARIABLES,
      useRcPaywall: true,
    });
    const title = page.getByText("E2E Tests for Purchases JS");
    await expect(title).toBeVisible();

    const packageCards = await getPaywallPackageCards(page);
    await packageCards[0].click();

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
    const userId = getUserId(browserName);
    const page = await setupTest(browser, userId);

    const packageCards = await getPackageCards(page, "E2E Consumable");
    expect(packageCards.length).toEqual(1);
    await performPurchase(page, packageCards[0], userId);
  });

  test("Can purchase a non consumable product", async ({
    browser,
    browserName,
  }) => {
    const userId = getUserId(browserName);
    const page = await setupTest(browser, userId);

    const packageCards = await getPackageCards(page, "E2E NonConsumable");
    expect(packageCards.length).toEqual(1);
    await performPurchase(page, packageCards[0], userId);
  });

  test("Can purchase skipping the email", async ({ browser, browserName }) => {
    const userId = getUserId(browserName);
    const page = await setupTest(browser, userId, {
      email: `${userId}@revenuecat.com`,
    });

    const packageCards = await getPackageCards(page, "E2E NonConsumable");
    expect(packageCards.length).toEqual(1);
    await startPurchaseFlow(packageCards[0]);

    const stripeFrame = getStripeEmailFrame(page);
    const emailField = stripeFrame.getByPlaceholder("you@example.com");
    await expect(emailField).not.toBeVisible();

    await enterCreditCardDetails(page, "4242 4242 4242 4242");
    await clickPayButton(page);
    await confirmPaymentComplete(page);
  });
});

test.describe("Purchase error paths", () => {
  test("Displays email format errors", async ({ browser, browserName }) => {
    const userId = getUserId(browserName);
    const page = await setupTest(browser, userId);

    const packageCards = await getPackageCards(page);
    await startPurchaseFlow(packageCards[1]);
    await enterEmail(page, "invalid-email");

    const stripeFrame = getStripeEmailFrame(page);
    const errorText = stripeFrame.getByText("Your email address is invalid.");
    await expect(errorText).toBeVisible({ timeout: 10000 });
  });

  test("Displays email suggestion from stripe", async ({
    browser,
    browserName,
  }) => {
    const userId = getUserId(browserName);
    const page = await setupTest(browser, userId);

    const packageCards = await getPackageCards(page);
    await startPurchaseFlow(packageCards[1]);
    await enterEmail(page, `${userId}@revenueci.comm`);
    await enterCreditCardDetails(page, "4242 4242 4242 4242");

    const stripeFrame = getStripeEmailFrame(page);
    const errorText = stripeFrame.getByText("Did you mean @revenueci.com?");
    await expect(errorText).toBeVisible({ timeout: 10000 });
  });

  test("Displays email deliverability errors", async ({
    browser,
    browserName,
  }) => {
    const userId = getUserId(browserName);
    const page = await setupTest(browser, userId);
    const email = `${userId}@revenueci.comm`;

    const packageCards = await getPackageCards(page);
    await startPurchaseFlow(packageCards[1]);
    await enterEmail(page, email);
    await enterCreditCardDetails(page, "4242 4242 4242 4242");
    await clickPayButton(page);

    const errorText = page.getByText(`Please provide a valid email address.`);
    await expect(errorText).toBeVisible({ timeout: 10000 });
  });

  test("Displays handled card form submission errors", async ({
    browser,
    browserName,
  }) => {
    const userId = getUserId(browserName);
    const email = getEmailFromUserId(userId);
    const page = await setupTest(browser, userId);

    const packageCards = await getPackageCards(page);
    await startPurchaseFlow(packageCards[1]);
    await enterEmail(page, email);
    await enterCreditCardDetails(page, "4000 0000 0000 0002");
    await clickPayButton(page);

    const stripeFrame = getStripePaymentFrame(page);
    const errorText = stripeFrame.getByText("Your card was declined.");
    await expect(errorText).toBeVisible({ timeout: 10000 });
  });

  test("Displays unhandled card form submission errors", async ({
    browser,
    browserName,
  }) => {
    const userId = getUserId(browserName);
    const email = getEmailFromUserId(userId);
    const page = await setupTest(browser, userId);

    const packageCards = await getPackageCards(page);
    await startPurchaseFlow(packageCards[1]);
    await enterEmail(page, email);
    await enterCreditCardDetails(page, "4000 0038 0000 0446");
    await clickPayButton(page);

    const stripe3DSFrame = getStripe3DSFrame(page);

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

  test("Displays error when unknown backend error during checkout start", async ({
    browser,
    browserName,
  }) => {
    const userId = getUserId(browserName);
    const page = await setupTest(browser, userId);

    page.route("*/**/checkout/start", async (route) => {
      await route.fulfill({
        body: '{ "code": 7110, "message": "Test error message"}',
        status: 400,
      });
    });

    const packageCards = await getPackageCards(page);

    await startPurchaseFlow(packageCards[1]);

    const errorTitleText = page.getByText("Something went wrong");
    await expect(errorTitleText).toBeVisible();

    const errorMessageText = page.getByText(
      "Purchase not started due to an error. Error code: 7110",
    );
    await expect(errorMessageText).toBeVisible();
  });

  test("Displays error when unknown backend error during checkout complete", async ({
    browser,
    browserName,
  }) => {
    const userId = getUserId(browserName);
    const email = getEmailFromUserId(userId);
    const page = await setupTest(browser, userId);

    page.route("*/**/checkout/*/complete", async (route) => {
      await route.fulfill({
        body: '{ "code": 7110, "message": "Test error message"}',
        status: 400,
      });
    });

    const packageCards = await getPackageCards(page);

    await startPurchaseFlow(packageCards[1]);
    await enterEmail(page, email);
    await enterCreditCardDetails(page, "4242 4242 4242 4242");
    await clickPayButton(page);

    const errorTitleText = page.getByText("Something went wrong");
    await expect(errorTitleText).toBeVisible();

    const errorMessageText = page.getByText(
      "Purchase not started due to an error. Error code: 7110",
    );
    await expect(errorMessageText).toBeVisible();
  });
});
