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

async function preloadStripeJsTrain(page: Page, train: string): Promise<void> {
  await page.addInitScript((trainName) => {
    const script = document.createElement("script");
    script.src = `https://js.stripe.com/${trainName}/stripe.js`;
    (document.head ?? document.documentElement).appendChild(script);
  }, train);
}

async function loadedStripeJsTrains(page: Page): Promise<string[]> {
  return page.$$eval(
    'script[src*="js.stripe.com"][src*="/stripe.js"]',
    (scripts) =>
      scripts.map(
        (script) =>
          new URL((script as HTMLScriptElement).src).pathname.split("/")[1],
      ),
  );
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

        await preloadStripeJsTrain(page, train);
        page = await navigateToStripeCheckoutLandingUrl(page, userId, {
          email,
        });

        await expect(page.getByText("Stripe Checkout demo")).toBeVisible({
          timeout: STRIPE_CHECKOUT_UI_STEP_TIMEOUT_MS,
        });

        const packageCards = await getPackageCards(page);
        expect(packageCards.length).toBeGreaterThan(0);

        await startPurchaseFlow(packageCards[0]);
        await confirmStripeCheckoutVisible(page);

        // The SDK reuses the page's train rather than injecting its own; a
        // second train would mean it bypassed the merchant's Stripe.js.
        expect([...new Set(await loadedStripeJsTrains(page))]).toEqual([train]);

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
