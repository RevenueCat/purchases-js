import test, { expect } from "@playwright/test";
import {
  navigateToLandingUrl,
  getPackageCards,
  startPurchaseFlow,
  skipPaywallsTestIfDisabled,
} from "./helpers/test-helpers";
import { integrationTest } from "./helpers/integration-test";
import { RC_PAYWALL_TEST_OFFERING_ID_WITH_VARIABLES } from "./helpers/fixtures";

test.describe("Back button navigation", () => {
  integrationTest(
    "Browser back button closes checkout modal and stays on page",
    async ({ page, userId }) => {
      page = await navigateToLandingUrl(page, userId);
      const initialUrl = page.url();

      const packageCards = await getPackageCards(page);
      await startPurchaseFlow(packageCards[1]);

      // Wait for checkout modal to appear
      const checkoutTitle = page.getByText("Secure Checkout");
      await expect(checkoutTitle).toBeVisible();

      // Press browser back button
      await page.goBack();

      // Verify checkout modal is closed
      await expect(checkoutTitle).not.toBeVisible();

      // Verify we're still on the same page (not navigated away)
      expect(page.url()).toBe(initialUrl);
    },
  );

  integrationTest(
    "Browser back button closes RC Paywall and stays on page",
    async ({ page, userId }) => {
      skipPaywallsTestIfDisabled(integrationTest);

      page = await navigateToLandingUrl(page, userId, {
        offeringId: RC_PAYWALL_TEST_OFFERING_ID_WITH_VARIABLES,
        useRcPaywall: true,
      });
      const initialUrl = page.url();

      // Verify paywall is visible
      const title = page.getByText("E2E Tests for Purchases JS");
      await expect(title).toBeVisible();

      // Select a package to open the purchase flow
      const weekly = page.getByText("weekly", { exact: true });
      await weekly.click();

      const purchaseButton = page.getByText("PURCHASE weekly", { exact: true });
      await expect(purchaseButton).toBeVisible();
      await purchaseButton.click();

      // Wait for checkout to appear
      const checkoutTitle = page.getByText("Subscribe to");
      await expect(checkoutTitle).toBeVisible();

      // Press browser back button
      await page.goBack();

      // Verify checkout modal is closed
      await expect(checkoutTitle).not.toBeVisible();

      // Verify we're still on the same page (not navigated away)
      expect(page.url()).toBe(initialUrl);
    },
  );
});
