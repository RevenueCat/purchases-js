import test, { type Page } from "@playwright/test";
import { getUserId } from "./test-helpers";
import { getEmailFromUserId } from "./test-helpers";

export const ALLOW_PAYWALLS_TESTS =
  process.env.VITE_ALLOW_PAYWALLS_TESTS === "true";

export const SKIP_STRIPE_TESTS =
  process.env.VITE_SKIP_STRIPE_TESTS === "true" ||
  process.env.VITE_SKIP_STRIPE_TESTS === "1";

export const SKIP_PADDLE_TESTS =
  process.env.VITE_SKIP_PADDLE_TESTS === "true" ||
  process.env.VITE_SKIP_PADDLE_TESTS === "1";

export const SKIP_STRIPE_TESTS_ON_CAPTCHA =
  process.env.VITE_SKIP_STRIPE_TESTS_ON_CAPTCHA === "true" ||
  process.env.VITE_SKIP_STRIPE_TESTS_ON_CAPTCHA === "1";

// Live Stripe Tax requests consume a limited test quota. Run them manually
// with an explicit opt-in instead of enabling them in normal E2E runs.
export const SKIP_TAX_REAL_TESTS =
  process.env.VITE_RUN_TAX_REAL_TESTS !== "true";

interface TestFixtures {
  userId: string;
  email: string;
  page: Page;
}

export const integrationTest = test.extend<TestFixtures>({
  userId: [
    async ({ browserName }, use) => {
      const userId = getUserId(browserName);
      await use(userId);
    },
    { scope: "test" },
  ],
  email: [
    async ({ userId }, use) => {
      const email = getEmailFromUserId(userId);
      await use(email);
    },
    { scope: "test" },
  ],
  page: async ({ browser }, use) => {
    const page = await browser.newPage();
    await use(page);
    await page.close();
  },
});

integrationTest.beforeEach(async ({ page }) => {
  await page.route("**/v1/events", async (route) => {
    // Only stub RevenueCat's events ingestion — e.revenue.cat in production
    // SDK builds, localhost in dev/test builds, *.revenuecat.com when
    // proxied. Other providers (e.g. Paddle) expose /v1/events-like
    // endpoints of their own that must go through.
    const { hostname } = new URL(route.request().url());
    const isRevenueCatHost =
      hostname === "localhost" ||
      hostname === "revenue.cat" ||
      hostname.endsWith(".revenue.cat") ||
      hostname === "revenuecat.com" ||
      hostname.endsWith(".revenuecat.com");
    if (!isRevenueCatHost) {
      await route.continue();
      return;
    }

    await route.fulfill({
      status: 200,
      body: JSON.stringify({}),
    });
  });
});
