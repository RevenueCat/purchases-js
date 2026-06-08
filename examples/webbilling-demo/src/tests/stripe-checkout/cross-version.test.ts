import { expect, type Page } from "@playwright/test";
import { STRIPE_CHECKOUT_TEST_API_KEY } from "../helpers/fixtures";
import { integrationTest } from "../helpers/integration-test";
import {
  getPackageCards,
  skipStripeTestsIfDisabled,
  startPurchaseFlow,
} from "../helpers/test-helpers";
import {
  confirmStripeCheckoutVisible,
  getStripeEmbeddedCheckoutFrame,
  navigateToStripeCheckoutLandingUrl,
  STRIPE_CHECKOUT_TEST_TIMEOUT_MS,
  STRIPE_CHECKOUT_UI_STEP_TIMEOUT_MS,
} from "./test-helpers";

// Stripe.js is a single global per page and our loader reuses whatever train a
// merchant self-loaded, so the SDK must work against any of them - even though
// the embedded-checkout method was renamed across trains
// (initEmbeddedCheckout -> createEmbeddedCheckoutPage in dahlia).
//
// This matrix asserts the only train-sensitive part: the SDK's call mounts
// Stripe's checkout form against the merchant's self-loaded train. Completing
// the payment is left to purchase-flow.test.ts (local only) - completion runs
// server-side at Stripe, behaves identically across trains, and Stripe blocks
// it from CI datacenter IPs.
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
      `mounts embedded checkout against self-loaded Stripe.js ${train}`,
      async ({ page, userId, email }) => {
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

        // The SDK called createEmbeddedCheckoutPage and Stripe mounted its form.
        // A method missing on this train would throw IntegrationError here, so
        // the iframe and its card field would never render.
        await confirmStripeCheckoutVisible(page);
        const checkoutFrame = getStripeEmbeddedCheckoutFrame(page);
        await expect(
          checkoutFrame
            .getByLabel(/card number/i)
            .or(checkoutFrame.getByPlaceholder(/1234 1234/i))
            .first(),
        ).toBeVisible({ timeout: STRIPE_CHECKOUT_UI_STEP_TIMEOUT_MS });

        // ...and it ran against the merchant's train, not the SDK's bundled one.
        expect(await activeStripeTrain(page)).toBe(train);
      },
    );
  }
});
