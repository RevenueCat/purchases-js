import { expect } from "@playwright/test";
import { STRIPE_CHECKOUT_TEST_API_KEY } from "../helpers/fixtures";
import { integrationTest } from "../helpers/integration-test";
import {
  confirmPaymentComplete,
  getPackageCards,
  startPurchaseFlow,
} from "../helpers/test-helpers";
import {
  completeStripeCheckoutEmbeddedForm,
  navigateToStripeCheckoutLandingUrl,
} from "./test-helpers";

integrationTest.describe("Stripe Checkout flow", () => {
  integrationTest.skip(
    !STRIPE_CHECKOUT_TEST_API_KEY,
    "Stripe Checkout E2E tests require VITE_RC_STRIPE_CHECKOUT_E2E_API_KEY.",
  );

  integrationTest(
    "Purchases a product with embedded Stripe Checkout",
    async ({ page, userId, email }) => {
      const fullName = `E2E ${userId.replace(/_/g, " ")}`;

      page = await navigateToStripeCheckoutLandingUrl(page, userId, {
        email,
      });

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
});
