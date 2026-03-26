import { expect } from "@playwright/test";
import { PADDLE_TEST_API_KEY } from "../helpers/fixtures";
import { integrationTest } from "../helpers/integration-test";
import {
  confirmPaymentError,
  getPackageCards,
  getPaywallPackageCards,
  getPaywallPurchaseButtons,
  skipPaddleTestsIfDisabled,
  skipPaywallsTestIfDisabled,
  startPurchaseFlow,
} from "../helpers/test-helpers";
import {
  completePaddleCheckoutForm,
  confirmPaddleProcessingPayment,
  navigateToPaddleLandingUrl,
  PADDLE_TEST_TIMEOUT_MS,
  PADDLE_UI_STEP_TIMEOUT_MS,
} from "./test-helpers";

integrationTest.describe("Paddle flow", () => {
  const paddleCardholderName = "RevenueCat E2E";

  integrationTest.describe.configure({
    timeout: PADDLE_TEST_TIMEOUT_MS,
  });

  integrationTest.skip(
    ({ browserName }) => !!process.env.CI && browserName !== "chromium",
    "Paddle tests run only in Chromium on CI",
  );

  skipPaddleTestsIfDisabled(integrationTest);

  integrationTest.skip(
    !PADDLE_TEST_API_KEY,
    "Paddle E2E tests require VITE_RC_PADDLE_E2E_API_KEY.",
  );

  integrationTest(
    "Purchases a product with Paddle",
    async ({ page, userId, email }) => {
      page = await navigateToPaddleLandingUrl(page, userId);

      await expect(page.getByText("Paddle demo")).toBeVisible({
        timeout: PADDLE_UI_STEP_TIMEOUT_MS,
      });

      const packageCards = await getPackageCards(page);
      expect(packageCards.length).toBeGreaterThan(0);

      await startPurchaseFlow(packageCards[0]);
      await completePaddleCheckoutForm(page, email, paddleCardholderName);
      await confirmPaddleProcessingPayment(page);
    },
  );

  integrationTest(
    "Purchases a product with Paddle passing the email as query parameter",
    async ({ page, userId, email }) => {
      page = await navigateToPaddleLandingUrl(page, userId, {
        email,
      });

      await expect(page.getByText("Paddle demo")).toBeVisible({
        timeout: PADDLE_UI_STEP_TIMEOUT_MS,
      });

      const packageCards = await getPackageCards(page);
      expect(packageCards.length).toBeGreaterThan(0);

      await startPurchaseFlow(packageCards[0]);
      await completePaddleCheckoutForm(
        page,
        email,
        paddleCardholderName,
        false,
      );
      await confirmPaddleProcessingPayment(page);
    },
  );

  integrationTest(
    "Shows an error screen when checkout/start returns missing paddle checkout params",
    async ({ page, userId, email }) => {
      page = await navigateToPaddleLandingUrl(page, userId, {
        email,
      });

      await expect(page.getByText("Paddle demo")).toBeVisible({
        timeout: PADDLE_UI_STEP_TIMEOUT_MS,
      });

      await page.route("*/**/checkout/start", async (route) => {
        const response = await route.fetch();
        const json = (await response.json()) as Record<string, unknown>;

        await route.fulfill({
          response,
          json: {
            ...json,
            paddle_billing_params: null,
          },
        });
      });

      const packageCards = await getPackageCards(page);
      expect(packageCards.length).toBeGreaterThan(0);

      await startPurchaseFlow(packageCards[0]);
      await confirmPaymentError(
        page,
        "Something went wrong",
        PADDLE_UI_STEP_TIMEOUT_MS,
      );
      await confirmPaymentError(
        page,
        /An unknown error occurred/i,
        PADDLE_UI_STEP_TIMEOUT_MS,
      );
    },
  );

  integrationTest(
    "Purchases monthly product from RC Paywall with Paddle",
    async ({ page, userId, email }) => {
      skipPaywallsTestIfDisabled(integrationTest);

      page = await navigateToPaddleLandingUrl(page, userId, {
        useRcPaywall: true,
        lang: "en",
        email,
      });

      const paywallPackages = await getPaywallPackageCards(page);
      expect(paywallPackages.length).toBeGreaterThan(0);
      await paywallPackages[0].click();

      const purchaseButtons = await getPaywallPurchaseButtons(page);
      expect(purchaseButtons.length).toBeGreaterThan(0);
      await purchaseButtons[0].click();

      await completePaddleCheckoutForm(
        page,
        email,
        paddleCardholderName,
        false,
      );
      await confirmPaddleProcessingPayment(page);
    },
  );
});
