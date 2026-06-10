import { expect } from "@playwright/test";
import { PADDLE_TEST_API_KEY } from "../helpers/fixtures";
import { integrationTest } from "../helpers/integration-test";
import {
  confirmPaymentError,
  getPackageCards,
  skipPaddleTestsIfDisabled,
  startPurchaseFlow,
} from "../helpers/test-helpers";
import {
  navigateToPaddleLandingUrl,
  PADDLE_TEST_TIMEOUT_MS,
  PADDLE_UI_STEP_TIMEOUT_MS,
} from "./test-helpers";

integrationTest.describe("Paddle flow", () => {
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
    "Shows an error screen when checkout/start returns missing paddle checkout params",
    async ({ page, userId, email }) => {
      page = await navigateToPaddleLandingUrl(page, userId, { email });

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
      // The Paddle flow surfaces this as an unknown error, unlike the
      // Stripe Checkout flow's "Purchase not started" copy.
      await confirmPaymentError(
        page,
        /An unknown error occurred/i,
        PADDLE_UI_STEP_TIMEOUT_MS,
      );
    },
  );
});
