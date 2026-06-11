import { expect, type Page } from "@playwright/test";
import { PADDLE_TEST_API_KEY } from "../helpers/fixtures";
import { integrationTest } from "../helpers/integration-test";
import {
  confirmPaymentComplete,
  confirmPaymentError,
  getPackageCards,
  skipPaddleTestsIfDisabled,
  startPurchaseFlow,
} from "../helpers/test-helpers";
import {
  completePaddleCheckoutForm,
  confirmPaddleCheckoutFormVisible,
  confirmPaddleInlineCheckoutVisible,
  confirmSandboxBannerVisible,
  forcePaddleCheckoutMode,
  getPaddleInlineCheckoutFrame,
  getPaddleOverlayFrame,
  navigateToPaddleLandingUrl,
  PADDLE_TEST_TIMEOUT_MS,
  PADDLE_UI_STEP_TIMEOUT_MS,
} from "./test-helpers";

async function confirmSuccessPage(page: Page) {
  await confirmPaymentComplete(page, PADDLE_UI_STEP_TIMEOUT_MS);

  const continueButton = page.getByRole("button", { name: /continue/i });
  await expect(continueButton).toBeVisible({
    timeout: PADDLE_UI_STEP_TIMEOUT_MS,
  });

  await Promise.all([
    page.waitForURL(/\/success\//, { timeout: PADDLE_UI_STEP_TIMEOUT_MS }),
    continueButton.click(),
  ]);

  await expect(page.getByText("Enjoy your premium experience.")).toBeVisible({
    timeout: PADDLE_UI_STEP_TIMEOUT_MS,
  });
}

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
    "Purchases a product with the inline checkout",
    async ({ page, userId, email }) => {
      const fullName = `E2E ${userId.replace(/_/g, " ")}`;

      page = await navigateToPaddleLandingUrl(page, userId);
      await forcePaddleCheckoutMode(page, "inline");

      await expect(page.getByText("Paddle demo")).toBeVisible({
        timeout: PADDLE_UI_STEP_TIMEOUT_MS,
      });

      const packageCards = await getPackageCards(page);
      expect(packageCards.length).toBeGreaterThan(0);

      await startPurchaseFlow(packageCards[0]);
      await confirmPaddleInlineCheckoutVisible(page);
      await confirmSandboxBannerVisible(page);

      // The RC-rendered order summary is fed by Paddle's checkout.updated
      // totals; assert presence only — exact figures depend on address-entry
      // timing and would be flaky.
      await expect(page.locator(".rcb-paddle-summary")).toBeVisible({
        timeout: PADDLE_UI_STEP_TIMEOUT_MS,
      });

      await completePaddleCheckoutForm(
        getPaddleInlineCheckoutFrame(page),
        email,
        fullName,
      );

      // The processing state only shows between checkout.completed and the
      // backend poll finishing, which can be near-instant — accept either it
      // or the success page.
      await expect(
        page
          .locator(".rcb-paddle-processing")
          .or(page.getByText("Payment complete"))
          .first(),
      ).toBeVisible({ timeout: PADDLE_UI_STEP_TIMEOUT_MS });

      await confirmSuccessPage(page);
    },
  );

  integrationTest(
    "Purchases a product with the overlay checkout",
    async ({ page, userId, email }) => {
      const fullName = `E2E ${userId.replace(/_/g, " ")}`;

      page = await navigateToPaddleLandingUrl(page, userId);
      await forcePaddleCheckoutMode(page, "overlay");

      await expect(page.getByText("Paddle demo")).toBeVisible({
        timeout: PADDLE_UI_STEP_TIMEOUT_MS,
      });

      const packageCards = await getPackageCards(page);
      expect(packageCards.length).toBeGreaterThan(0);

      await startPurchaseFlow(packageCards[0]);

      const overlayFrame = getPaddleOverlayFrame(page);
      await confirmPaddleCheckoutFormVisible(overlayFrame);
      await completePaddleCheckoutForm(overlayFrame, email, fullName);

      await confirmSuccessPage(page);
    },
  );

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
