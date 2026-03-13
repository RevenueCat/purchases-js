import { expect } from "@playwright/test";
import { STRIPE_CHECKOUT_TEST_API_KEY } from "../helpers/fixtures";
import { integrationTest } from "../helpers/integration-test";
import {
  confirmPaymentComplete,
  confirmPaymentError,
  getPackageCards,
  skipPaywallsTestIfDisabled,
  skipStripeTestsIfDisabled,
  startPurchaseFlow,
} from "../helpers/test-helpers";
import {
  completeStripeCheckoutEmbeddedForm,
  navigateToStripeCheckoutLandingUrl,
} from "./test-helpers";

integrationTest.describe("Stripe Checkout flow", () => {
  skipStripeTestsIfDisabled(integrationTest);

  integrationTest.skip(
    !STRIPE_CHECKOUT_TEST_API_KEY,
    "Stripe Checkout E2E tests require VITE_RC_STRIPE_CHECKOUT_E2E_API_KEY.",
  );

  integrationTest(
    "Purchases a product with embedded Stripe Checkout",
    async ({ page, userId, email }) => {
      const fullName = `E2E ${userId.replace(/_/g, " ")}`;

      page = await navigateToStripeCheckoutLandingUrl(page, userId);

      await expect(page.getByText("Stripe Checkout demo")).toBeVisible();

      const packageCards = await getPackageCards(page);
      expect(packageCards.length).toBeGreaterThan(0);

      await startPurchaseFlow(packageCards[0]);
      await completeStripeCheckoutEmbeddedForm(page, email, fullName);
      await confirmPaymentComplete(page);

      await Promise.all([
        page.waitForURL(/\/success\//),
        page.getByRole("button", { name: /continue/i }).click(),
      ]);

      await expect(
        page.getByText("Enjoy your premium experience."),
      ).toBeVisible();
    },
  );

  integrationTest(
    "Purchases a product with embedded Stripe Checkout passing the email as query parameter",
    async ({ page, userId, email }) => {
      const fullName = `E2E ${userId.replace(/_/g, " ")}`;

      page = await navigateToStripeCheckoutLandingUrl(page, userId, {
        email,
      });

      await expect(page.getByText("Stripe Checkout demo")).toBeVisible();

      const packageCards = await getPackageCards(page);
      expect(packageCards.length).toBeGreaterThan(0);

      await startPurchaseFlow(packageCards[0]);
      await completeStripeCheckoutEmbeddedForm(page, email, fullName, false);
      await confirmPaymentComplete(page);

      await Promise.all([
        page.waitForURL(/\/success\//),
        page.getByRole("button", { name: /continue/i }).click(),
      ]);

      await expect(
        page.getByText("Enjoy your premium experience."),
      ).toBeVisible();
    },
  );

  integrationTest(
    "Shows an error screen when checkout/start returns missing stripe checkout params",
    async ({ page, userId, email }) => {
      page = await navigateToStripeCheckoutLandingUrl(page, userId, {
        email,
      });

      await expect(page.getByText("Stripe Checkout demo")).toBeVisible();

      await page.route("*/**/checkout/start", async (route) => {
        const response = await route.fetch();
        const json = (await response.json()) as Record<string, unknown>;

        await route.fulfill({
          response,
          json: {
            ...json,
            stripe_billing_params: null,
          },
        });
      });

      const packageCards = await getPackageCards(page);
      expect(packageCards.length).toBeGreaterThan(0);

      await startPurchaseFlow(packageCards[0]);
      await confirmPaymentError(page, "Something went wrong");
      await confirmPaymentError(page, /Purchase not started due to an error/i);
    },
  );

  integrationTest(
    "Purchases monthly product from RC Paywall with Stripe Checkout",
    async ({ page, userId, email }) => {
      skipPaywallsTestIfDisabled(integrationTest);

      const fullName = `E2E ${userId.replace(/_/g, " ")}`;

      page = await navigateToStripeCheckoutLandingUrl(page, userId, {
        useRcPaywall: true,
        lang: "en",
        email,
      });

      await expect(page.getByText("E2E Tests for Purchases JS")).toBeVisible();
      await expect(
        page.getByText(
          "Testing current Offering is picked when no offering is passed",
        ),
      ).toBeVisible();

      const monthlyPackage = page.getByText("monthly", { exact: true });
      await monthlyPackage.click();

      const purchaseButton = page.getByText(/Subscribe/i);
      await expect(purchaseButton).toBeVisible();
      await purchaseButton.click();

      await completeStripeCheckoutEmbeddedForm(page, email, fullName);
      await confirmPaymentComplete(page);

      await Promise.all([
        page.waitForURL(/\/success\//),
        page.getByRole("button", { name: /continue/i }).click(),
      ]);

      await expect(
        page.getByText("Enjoy your premium experience."),
      ).toBeVisible();
    },
  );
});
