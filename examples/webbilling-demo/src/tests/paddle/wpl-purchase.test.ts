import { expect } from "@playwright/test";
import { integrationTest } from "../helpers/integration-test";
import { skipPaddleTestsIfDisabled } from "../helpers/test-helpers";
import {
  completePaddleCheckoutForm,
  confirmPaddleCheckoutFormVisible,
  getPaddleOverlayFrame,
  PADDLE_TEST_TIMEOUT_MS,
  PADDLE_UI_STEP_TIMEOUT_MS,
} from "./test-helpers";

// Web Purchase Link for the Paddle E2E project. Unlike the rest of this
// suite, this exercises the DEPLOYED hosted checkout (rc-billing-checkout +
// the released SDK) at pay.rev.cat rather than the local build — it's a
// cross-repo production smoke test of the link → offering → Paddle →
// entitlement configuration, not a regression gate for local changes.
const PADDLE_WPL_URL =
  process.env.VITE_RC_PADDLE_E2E_WPL_URL ??
  "https://pay.rev.cat/aafsdajoyiylamsl";

integrationTest.describe("Paddle Web Purchase Link smoke", () => {
  integrationTest.describe.configure({
    timeout: PADDLE_TEST_TIMEOUT_MS,
  });

  integrationTest.skip(
    ({ browserName }) => !!process.env.CI && browserName !== "chromium",
    "Paddle tests run only in Chromium on CI",
  );

  skipPaddleTestsIfDisabled(integrationTest);

  integrationTest.afterEach(async () => {
    // Sleep between tests to stay clear of Paddle sandbox rate limits.
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  integrationTest(
    "Purchases a product through the hosted Web Purchase Link",
    async ({ page, userId, email }) => {
      const fullName = `E2E ${userId.replace(/_/g, " ")}`;

      await page.goto(`${PADDLE_WPL_URL}/${encodeURIComponent(userId)}`);

      // The hosted page lists the offering's packages as selectable cards.
      const productCard = page
        .getByRole("button", { name: /weekly no free trial/i })
        .or(page.getByLabel(/weekly no free trial/i))
        .first();
      await expect(productCard).toBeVisible({
        timeout: PADDLE_UI_STEP_TIMEOUT_MS,
      });
      await productCard.click();

      const paddleFrame = getPaddleOverlayFrame(page);
      await confirmPaddleCheckoutFormVisible(paddleFrame);
      await completePaddleCheckoutForm(paddleFrame, email, fullName);

      await expect(page.getByText("Payment complete")).toBeVisible({
        timeout: PADDLE_UI_STEP_TIMEOUT_MS,
      });
    },
  );
});
