import { expect } from "@playwright/test";
import { PADDLE_TEST_API_KEY } from "../helpers/fixtures";
import { integrationTest } from "../helpers/integration-test";
import {
  getPackageCards,
  skipPaddleTestsIfDisabled,
  startPurchaseFlow,
} from "../helpers/test-helpers";
import {
  confirmPaddleCheckoutFormVisible,
  confirmPaddleInlineCheckoutVisible,
  forcePaddleCheckoutMode,
  getPaddleOverlayCloseButton,
  getPaddleOverlayFrame,
  getPaddleReturnButton,
  navigateToPaddleLandingUrl,
  PADDLE_TEST_TIMEOUT_MS,
  PADDLE_UI_STEP_TIMEOUT_MS,
} from "./test-helpers";

// Cancel/close flows never complete a payment, so unlike the happy-path
// purchases they are safe to run from CI datacenter IPs.
integrationTest.describe("Paddle cancel flow", () => {
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

  integrationTest.afterEach(async () => {
    // Sleep between tests to stay clear of Paddle sandbox rate limits.
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  integrationTest(
    "Returns to the paywall when closing the inline checkout",
    async ({ page, userId, email }) => {
      page = await navigateToPaddleLandingUrl(page, userId, { email });
      await forcePaddleCheckoutMode(page, "inline");

      await expect(page.getByText("Paddle demo")).toBeVisible({
        timeout: PADDLE_UI_STEP_TIMEOUT_MS,
      });

      const packageCards = await getPackageCards(page);
      expect(packageCards.length).toBeGreaterThan(0);

      await startPurchaseFlow(packageCards[0]);
      await confirmPaddleInlineCheckoutVisible(page);

      const returnButton = getPaddleReturnButton(page);
      await expect(returnButton).toBeVisible({
        timeout: PADDLE_UI_STEP_TIMEOUT_MS,
      });
      await returnButton.click();

      // The purchase promise rejects with a user-cancelled error and the demo
      // stays on the paywall with the checkout UI fully unmounted.
      await expect(
        page.getByTestId("paddle-inline-checkout-container"),
      ).not.toBeVisible({ timeout: PADDLE_UI_STEP_TIMEOUT_MS });

      const packageCardsAfterCancel = await getPackageCards(page);
      expect(packageCardsAfterCancel.length).toBeGreaterThan(0);
      expect(page.url()).not.toContain("/success/");
    },
  );

  integrationTest(
    "Returns to the paywall when closing the overlay checkout",
    async ({ page, userId, email }) => {
      page = await navigateToPaddleLandingUrl(page, userId, { email });
      await forcePaddleCheckoutMode(page, "overlay");

      await expect(page.getByText("Paddle demo")).toBeVisible({
        timeout: PADDLE_UI_STEP_TIMEOUT_MS,
      });

      const packageCards = await getPackageCards(page);
      expect(packageCards.length).toBeGreaterThan(0);

      await startPurchaseFlow(packageCards[0]);

      const overlayFrame = getPaddleOverlayFrame(page);
      await confirmPaddleCheckoutFormVisible(overlayFrame);

      // Closing via Paddle's own control fires a user-initiated
      // checkout.closed event, which the SDK maps to a user-cancelled error.
      const closeButton = getPaddleOverlayCloseButton(overlayFrame);
      await expect(closeButton).toBeVisible({
        timeout: PADDLE_UI_STEP_TIMEOUT_MS,
      });
      await closeButton.click();

      await expect(page.locator("iframe[src*='paddle.com']")).not.toBeVisible({
        timeout: PADDLE_UI_STEP_TIMEOUT_MS,
      });

      const packageCardsAfterCancel = await getPackageCards(page);
      expect(packageCardsAfterCancel.length).toBeGreaterThan(0);
      expect(page.url()).not.toContain("/success/");
    },
  );
});
