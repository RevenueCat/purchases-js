import { expect, type Page } from "@playwright/test";
import { STRIPE_CHECKOUT_TEST_API_KEY } from "../helpers/fixtures";
import { integrationTest } from "../helpers/integration-test";
import {
  confirmPaymentComplete,
  getPackageCards,
  skipStripeTestsIfDisabled,
  startPurchaseFlow,
} from "../helpers/test-helpers";
import {
  completeStripeCheckoutEmbeddedForm,
  confirmStripeCheckoutVisible,
  navigateToStripeCheckoutLandingUrl,
  STRIPE_CHECKOUT_TEST_TIMEOUT_MS,
  STRIPE_CHECKOUT_UI_STEP_TIMEOUT_MS,
} from "./test-helpers";

// Stripe.js is a single global per page and our loader reuses whatever train a
// merchant self-loaded, so the SDK must work against any of them - even though
// the embedded-checkout method was renamed across trains
// (initEmbeddedCheckout -> createEmbeddedCheckoutPage in dahlia).
const STRIPE_JS_TRAINS = ["basil", "clover", "dahlia"] as const;

async function activeStripeTrain(page: Page): Promise<string | undefined> {
  return page.evaluate(() => {
    const stripe = (window as unknown as { Stripe?: { version?: unknown } })
      .Stripe;
    return stripe?.version === undefined ? undefined : String(stripe.version);
  });
}

integrationTest.describe("Stripe Checkout cross-version compatibility", () => {
  integrationTest.describe.configure({
    timeout: STRIPE_CHECKOUT_TEST_TIMEOUT_MS,
  });

  integrationTest.skip(
    ({ browserName }) => !!process.env.CI && browserName !== "chromium",
    "Stripe Checkout tests run only in Chromium on CI",
  );

  skipStripeTestsIfDisabled(integrationTest);

  integrationTest.skip(
    !STRIPE_CHECKOUT_TEST_API_KEY,
    "Stripe Checkout E2E tests require VITE_RC_STRIPE_CHECKOUT_E2E_API_KEY.",
  );

  integrationTest.afterEach(async () => {
    // Sleep between tests to avoid hitting the rate limit of the Stripe Checkout API.
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  for (const train of STRIPE_JS_TRAINS) {
    integrationTest(
      `completes embedded checkout when the page self-loads Stripe.js ${train}`,
      async ({ page, userId, email }) => {
        const fullName = `E2E ${userId.replace(/_/g, " ")}`;

        page = await navigateToStripeCheckoutLandingUrl(page, userId, {
          email,
        });

        await expect(page.getByText("Stripe Checkout demo")).toBeVisible({
          timeout: STRIPE_CHECKOUT_UI_STEP_TIMEOUT_MS,
        });

        // Self-load this train so it is the active Stripe.js before checkout,
        // mimicking a merchant that loads Stripe.js itself. addScriptTag awaits
        // the load, so window.Stripe is set when it resolves.
        await page.addScriptTag({
          url: `https://js.stripe.com/${train}/stripe.js`,
        });
        expect(await activeStripeTrain(page)).toBe(train);

        const packageCards = await getPackageCards(page);
        expect(packageCards.length).toBeGreaterThan(0);

        await startPurchaseFlow(packageCards[0]);
        await confirmStripeCheckoutVisible(page);

        // The SDK ran against the merchant's train, not its own bundled one.
        expect(await activeStripeTrain(page)).toBe(train);

        await completeStripeCheckoutEmbeddedForm(page, email, fullName, false);
        await confirmPaymentComplete(page, STRIPE_CHECKOUT_UI_STEP_TIMEOUT_MS);

        const continueButton = page.getByRole("button", { name: /continue/i });
        await expect(continueButton).toBeVisible({
          timeout: STRIPE_CHECKOUT_UI_STEP_TIMEOUT_MS,
        });

        await Promise.all([
          page.waitForURL(/\/success\//, {
            timeout: STRIPE_CHECKOUT_UI_STEP_TIMEOUT_MS,
          }),
          continueButton.click(),
        ]);

        await expect(
          page.getByText("Enjoy your premium experience."),
        ).toBeVisible({ timeout: STRIPE_CHECKOUT_UI_STEP_TIMEOUT_MS });
      },
    );
  }
});
