import test, { expect } from "@playwright/test";
import {
  clickCancelStripe3DSButton,
  clickPayButton,
  confirmPaymentComplete,
  confirmPaymentError,
  confirmStripeCardError,
  confirmStripeEmailError,
  confirmStripeEmailFieldNotVisible,
  confirmStripeEmailFieldVisible,
  enterCreditCardDetails,
  enterEmail,
  getEmailFromUserId,
  getPackageCards,
  navigateToLandingUrl,
  performPurchase,
  skipPaywallsTestIfDisabled,
  startPurchaseFlow,
} from "./helpers/test-helpers";
import { integrationTest } from "./helpers/integration-test";
import { RC_PAYWALL_TEST_OFFERING_ID_WITH_VARIABLES } from "./helpers/fixtures";

test.describe("Purchase flow", () => {
  integrationTest(
    "Purchase a subscription product",
    async ({ page, userId, email }) => {
      page = await navigateToLandingUrl(page, userId);
      const packageCards = await getPackageCards(page);
      await performPurchase(page, packageCards[1], email);
    },
  );

  integrationTest(
    "Purchase a subscription product for RC Paywall",
    async ({ page, userId, email }) => {
      skipPaywallsTestIfDisabled(integrationTest);

      page = await navigateToLandingUrl(page, userId, {
        offeringId: RC_PAYWALL_TEST_OFFERING_ID_WITH_VARIABLES,
        useRcPaywall: true,
      });
      const title = page.getByText("E2E Tests for Purchases JS");
      await expect(title).toBeVisible();

      const weekly = page.getByText("weekly", { exact: true });
      await weekly.click();

      const purchaseButton = page.getByText("PURCHASE weekly", { exact: true });
      await expect(purchaseButton).toBeVisible();

      // Target the parent element of the purchase button since the function targets the button itself
      await performPurchase(page, purchaseButton.locator("../../.."), email);
    },
  );

  integrationTest(
    "Purchase a consumable product",
    async ({ page, userId, email }) => {
      page = await navigateToLandingUrl(page, userId);
      const packageCards = await getPackageCards(page, "E2E Consumable");
      expect(packageCards.length).toEqual(1);
      await performPurchase(page, packageCards[0], email);
    },
  );

  integrationTest(
    "Purchase a non consumable product",
    async ({ page, userId, email }) => {
      page = await navigateToLandingUrl(page, userId);
      const packageCards = await getPackageCards(page, "E2E NonConsumable");
      expect(packageCards.length).toEqual(1);
      await performPurchase(page, packageCards[0], email);
    },
  );

  integrationTest(
    "Purchase skipping the email",
    async ({ page, userId, email }) => {
      page = await navigateToLandingUrl(page, userId, {
        email,
      });

      const packageCards = await getPackageCards(page, "E2E NonConsumable");
      expect(packageCards.length).toEqual(1);
      await startPurchaseFlow(packageCards[0]);
      await confirmStripeEmailFieldNotVisible(page);
      await enterCreditCardDetails(page, "4242 4242 4242 4242");
      await clickPayButton(page);
      await confirmPaymentComplete(page);
    },
  );
});

test.describe("Purchase error paths", () => {
  integrationTest(
    "Ignores invalid email query parameter",
    async ({ page, userId }) => {
      page = await navigateToLandingUrl(page, userId, {
        email: "invalid-email",
      });

      const packageCards = await getPackageCards(page, "E2E NonConsumable");
      expect(packageCards.length).toEqual(1);
      await startPurchaseFlow(packageCards[0]);
      await confirmStripeEmailFieldVisible(page);
    },
  );

  integrationTest(
    "Ignores unreachable email query parameter",
    async ({ page, userId }) => {
      page = await navigateToLandingUrl(page, userId, {
        email: "unreachable@revenuecatcio.commomio",
      });

      const packageCards = await getPackageCards(page, "E2E NonConsumable");
      expect(packageCards.length).toEqual(1);
      await startPurchaseFlow(packageCards[0]);
      await confirmStripeEmailFieldVisible(page);
    },
  );

  integrationTest("Email format errors", async ({ page, userId }) => {
    page = await navigateToLandingUrl(page, userId);

    const packageCards = await getPackageCards(page);
    await startPurchaseFlow(packageCards[1]);
    await enterEmail(page, "invalid-email");
    await confirmStripeEmailError(page, "Your email address is invalid.");
  });

  integrationTest.fixme(
    "Email deliverability errors",
    async ({ page, userId }) => {
      page = await navigateToLandingUrl(page, userId);
      const email = `${userId}@revenueci.comm`;

      const packageCards = await getPackageCards(page);
      await startPurchaseFlow(packageCards[1]);
      await enterEmail(page, email);
      await enterCreditCardDetails(page, "4242 4242 4242 4242");
      await clickPayButton(page);
      await confirmPaymentError(page, "Please provide a valid email address.");
    },
  );

  integrationTest("Handled card declined errors", async ({ page, userId }) => {
    page = await navigateToLandingUrl(page, userId);
    const email = getEmailFromUserId(userId);

    const packageCards = await getPackageCards(page);
    await startPurchaseFlow(packageCards[1]);
    await enterEmail(page, email);
    await enterCreditCardDetails(page, "4000 0000 0000 0002");
    await clickPayButton(page);
    await confirmStripeCardError(page, "Your card was declined.");
  });

  integrationTest(
    "Email deliverability errors after card declined errors",
    async ({ page, userId, email }) => {
      page = await navigateToLandingUrl(page, userId);

      const packageCards = await getPackageCards(page);
      await startPurchaseFlow(packageCards[1]);
      await enterEmail(page, email);
      await enterCreditCardDetails(page, "4000 0000 0000 0002");
      await clickPayButton(page);
      await confirmStripeCardError(page, "Your card was declined.");
      await enterCreditCardDetails(page, "4242 4242 4242 4242");
      await enterEmail(page, `${userId}@revenueci.comm`);
      await clickPayButton(page);
      await confirmPaymentError(page, "Please provide a valid email address.");
    },
  );

  integrationTest("Unhandled card errors", async ({ page, userId }) => {
    page = await navigateToLandingUrl(page, userId);
    const email = getEmailFromUserId(userId);

    const packageCards = await getPackageCards(page);
    await startPurchaseFlow(packageCards[1]);
    await enterEmail(page, email);
    await enterCreditCardDetails(page, "4000 0038 0000 0446");
    await clickPayButton(page);
    await clickCancelStripe3DSButton(page);
    await confirmPaymentError(page, "We are unable to");
  });

  integrationTest(
    "Unknown error on checkout start",
    async ({ page, userId }) => {
      page = await navigateToLandingUrl(page, userId);

      page.route("*/**/checkout/start", async (route) => {
        await route.fulfill({
          body: '{ "code": 7110, "message": "Test error message"}',
          status: 400,
        });
      });

      const packageCards = await getPackageCards(page);
      await startPurchaseFlow(packageCards[1]);
      await confirmPaymentError(page, "Something went wrong");
      await confirmPaymentError(
        page,
        "Purchase not started due to an error (error code: 7110).",
      );
    },
  );

  integrationTest(
    "Unknown backend error on checkout complete",
    async ({ page, userId, email }) => {
      page = await navigateToLandingUrl(page, userId);

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
      await confirmPaymentError(page, "Something went wrong");
      await confirmPaymentError(page, "Purchase not started due to an error");
    },
  );

  integrationTest(
    "Already subscribed error",
    async ({ page, userId, email }) => {
      page = await navigateToLandingUrl(page, userId);

      page.route("*/**/checkout/*/complete", async (route) => {
        await route.fulfill({
          body: '{ "code": 7772, "message": "Test error message"}',
          status: 409,
        });
      });

      const packageCards = await getPackageCards(page);
      await startPurchaseFlow(packageCards[1]);
      await enterEmail(page, email);
      await enterCreditCardDetails(page, "4242 4242 4242 4242");
      await clickPayButton(page);
      await confirmPaymentError(page, "You already subscribed");
      await confirmPaymentError(
        page,
        "You can't subscribe to this product again",
      );
    },
  );
});
