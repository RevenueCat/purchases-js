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
  getBackButtons,
  getEmailFromUserId,
  getPackageCards,
  navigateToLandingUrl,
  performPurchase,
  skipPaywallsTestIfDisabled,
  startPurchaseFlow,
} from "./helpers/test-helpers";
import { integrationTest } from "./helpers/integration-test";
import {
  RC_PAYWALL_TEST_OFFERING_ID_WITH_VARIABLES,
  RC_PAYWALL_WITH_LATAM_TRANSLATION_OFFERING_ID,
} from "./helpers/fixtures";

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
    "Purchase a subscription product for RC Paywall in a locale that the RC Paywall does not support",
    async ({ page, userId }) => {
      skipPaywallsTestIfDisabled(integrationTest);

      page = await navigateToLandingUrl(page, userId, {
        offeringId: RC_PAYWALL_TEST_OFFERING_ID_WITH_VARIABLES,
        useRcPaywall: true,
        lang: "sk", // sk is supported by the SDK but not by this specific RC Paywall
      });

      const title = page.getByText("E2E Tests for Purchases JS");
      await expect(title).toBeVisible();

      const weekly = page.getByText("weekly", { exact: true });
      await weekly.click();

      const purchaseButton = page.getByText("PURCHASE weekly", { exact: true });
      await expect(purchaseButton).toBeVisible();
      await purchaseButton.click();

      const subscribeTo = page.getByText("Subscribe to", { exact: true });
      await expect(subscribeTo).toBeVisible();

      const subscribeToInSK = page.getByText("Prihlásiť sa na odber");
      await expect(subscribeToInSK).not.toBeVisible();
    },
  );

  integrationTest(
    "Purchase a subscription product for RC Paywall falls back to a supported locale in case of similar ones",
    async ({ page, userId }) => {
      skipPaywallsTestIfDisabled(integrationTest);

      page = await navigateToLandingUrl(page, userId, {
        offeringId: RC_PAYWALL_WITH_LATAM_TRANSLATION_OFFERING_ID,
        useRcPaywall: true,
        lang: "es_419", // es_419 is supported by paywalls but not by the SDK.
        // We expect the SDk to fall back to es_ES since it is a similar locale to es_419.
      });

      const title = page.getByText("Pruebas E2E para compras JS");
      await expect(title).toBeVisible();

      const weekly = page.getByText("semanal", { exact: true });
      await weekly.click();

      const purchaseButton = page.getByText("COMPRAR semanal", { exact: true });
      await expect(purchaseButton).toBeVisible();
      await purchaseButton.click();

      const subscribeTo = page.getByText("Suscribirse a", { exact: true });
      await expect(subscribeTo).toBeVisible();
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

  integrationTest(
    "Back buttons are shown by default on RC Paywall",
    async ({ page, userId }) => {
      skipPaywallsTestIfDisabled(integrationTest);

      page = await navigateToLandingUrl(page, userId, {
        offeringId: RC_PAYWALL_TEST_OFFERING_ID_WITH_VARIABLES,
        useRcPaywall: true,
        // hideBackButtons defaults to false/undefined - buttons should be shown
      });

      const title = page.getByText("E2E Tests for Purchases JS");
      await expect(title).toBeVisible();

      const backButtons = getBackButtons(page);
      const buttonCount = await backButtons.count();
      expect(buttonCount).toBeGreaterThan(0);
    },
  );

  integrationTest(
    "Back buttons are hidden when hideBackButtons=true",
    async ({ page, userId }) => {
      skipPaywallsTestIfDisabled(integrationTest);

      page = await navigateToLandingUrl(page, userId, {
        offeringId: RC_PAYWALL_TEST_OFFERING_ID_WITH_VARIABLES,
        useRcPaywall: true,
        hideBackButtons: true,
      });

      const title = page.getByText("E2E Tests for Purchases JS");
      await expect(title).toBeVisible();

      const backButtons = getBackButtons(page);
      const buttonCount = await backButtons.count();
      expect(buttonCount).toBe(0);
    },
  );
});
