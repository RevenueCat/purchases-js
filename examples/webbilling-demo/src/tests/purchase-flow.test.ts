import test, { expect } from "@playwright/test";
import {
  clickContinueButton,
  clickPayButton,
  confirmPaymentComplete,
  enterCreditCardDetails,
  enterEmail,
  getEmailFromUserId,
  getPackageCards,
  getPaywallPackageCards,
  getPaywallPurchaseButtons,
  getStripe3DSFrame,
  getStripeEmailFrame,
  getStripePaymentFrame,
  performPurchase,
  startPurchaseFlow,
  navigateToLandingUrl,
} from "./helpers/test-helpers";
import {
  integrationTest,
  skipPaywallsTestIfDisabled,
} from "./helpers/integration-test";
import { RC_PAYWALL_TEST_OFFERING_ID_WITH_VARIABLES } from "./helpers/fixtures";

test.describe("Purchase flow", () => {
  integrationTest(
    "Purchase a subscription product",
    async ({ page, userId }) => {
      page = await navigateToLandingUrl(page, userId);
      const packageCards = await getPackageCards(page);
      await performPurchase(page, packageCards[1], userId);
    },
  );

  integrationTest(
    "Purchase a subscription product for RC Paywall",
    async ({ page, userId }) => {
      skipPaywallsTestIfDisabled(integrationTest);

      page = await navigateToLandingUrl(page, userId, {
        offeringId: RC_PAYWALL_TEST_OFFERING_ID_WITH_VARIABLES,
        useRcPaywall: true,
      });
      const title = page.getByText("E2E Tests for Purchases JS");
      await expect(title).toBeVisible();

      const packageCards = await getPaywallPackageCards(page);
      await packageCards[0].click();

      const purchaseButtons = await getPaywallPurchaseButtons(page);
      const purchaseButton = purchaseButtons[0];

      await expect(purchaseButton).toBeVisible();

      // Target the parent element of the purchase button since the function targets the button itself
      await performPurchase(page, purchaseButton.locator(".."), userId);
    },
  );

  integrationTest("Purchase a consumable product", async ({ page, userId }) => {
    page = await navigateToLandingUrl(page, userId);
    const packageCards = await getPackageCards(page, "E2E Consumable");
    expect(packageCards.length).toEqual(1);
    await performPurchase(page, packageCards[0], userId);
  });

  integrationTest(
    "Purchase a non consumable product",
    async ({ page, userId }) => {
      page = await navigateToLandingUrl(page, userId);
      const packageCards = await getPackageCards(page, "E2E NonConsumable");
      expect(packageCards.length).toEqual(1);
      await performPurchase(page, packageCards[0], userId);
    },
  );

  integrationTest("Purchase skipping the email", async ({ page, userId }) => {
    page = await navigateToLandingUrl(page, userId, {
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
  integrationTest("Email format errors", async ({ page, userId }) => {
    page = await navigateToLandingUrl(page, userId);

    const packageCards = await getPackageCards(page);
    await startPurchaseFlow(packageCards[1]);
    await enterEmail(page, "invalid-email");
    await clickContinueButton(page);

    const errorText = page.getByText("Email is not valid.");
    await expect(errorText).toBeVisible({ timeout: 10000 });
  });

  integrationTest("Email deliverability errors", async ({ page, userId }) => {
    page = await navigateToLandingUrl(page, userId);
    const email = `${userId}@revenueci.comm`;

    const packageCards = await getPackageCards(page);
    await startPurchaseFlow(packageCards[1]);
    await enterEmail(page, email);
    await clickContinueButton(page);

    const errorText = page.getByText(`Please provide a valid email address.`);
    await expect(errorText).toBeVisible({ timeout: 10000 });
  });

  integrationTest("Handled card declined errors", async ({ page, userId }) => {
    page = await navigateToLandingUrl(page, userId);
    const email = getEmailFromUserId(userId);

    const packageCards = await getPackageCards(page);
    await startPurchaseFlow(packageCards[1]);
    await enterEmail(page, email);
    await clickContinueButton(page);
    await enterCreditCardDetails(page, "4000 0000 0000 0002");
    await clickPayButton(page);

    const stripeFrame = getStripePaymentFrame(page);
    const errorText = stripeFrame.getByText("Your card was declined.");
    await expect(errorText).toBeVisible({ timeout: 10000 });
  });

  integrationTest("Unhandled card errors", async ({ page, userId }) => {
    page = await navigateToLandingUrl(page, userId);
    const email = getEmailFromUserId(userId);

    const packageCards = await getPackageCards(page);
    await startPurchaseFlow(packageCards[1]);
    await enterEmail(page, email);
    await clickContinueButton(page);
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

  integrationTest(
    "Unknown error on checkout start",
    async ({ page, userId }) => {
      page = await navigateToLandingUrl(page, userId);
      const email = getEmailFromUserId(userId);

      page.route("*/**/checkout/start", async (route) => {
        await route.fulfill({
          body: '{ "code": 7110, "message": "Test error message"}',
          status: 400,
        });
      });

      const packageCards = await getPackageCards(page);

      await startPurchaseFlow(packageCards[1]);
      await enterEmail(page, email);
      await clickContinueButton(page);

      const errorTitleText = page.getByText("Something went wrong");
      await expect(errorTitleText).toBeVisible();

      const errorMessageText = page.getByText(
        "Purchase not started due to an error. Error code: 7110",
      );
      await expect(errorMessageText).toBeVisible();
    },
  );

  integrationTest(
    "Unknown backend error on checkout complete",
    async ({ page, userId }) => {
      page = await navigateToLandingUrl(page, userId);
      const email = getEmailFromUserId(userId);

      page.route("*/**/checkout/*/complete", async (route) => {
        await route.fulfill({
          body: '{ "code": 7110, "message": "Test error message"}',
          status: 400,
        });
      });

      const packageCards = await getPackageCards(page);

      await startPurchaseFlow(packageCards[1]);
      await enterEmail(page, email);
      await clickContinueButton(page);
      await enterCreditCardDetails(page, "4242 4242 4242 4242");
      await clickPayButton(page);

      const errorTitleText = page.getByText("Something went wrong");
      await expect(errorTitleText).toBeVisible();

      const errorMessageText = page.getByText(
        "Purchase not started due to an error.",
      );
      await expect(errorMessageText).toBeVisible();
    },
  );
});
