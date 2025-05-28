import test, { type Page } from "@playwright/test";
import { getUserId } from "./test-helpers";
import { getEmailFromUserId } from "./test-helpers";

export const ALLOW_PAYWALLS_TESTS =
  process.env.VITE_ALLOW_PAYWALLS_TESTS === "true";

export const SKIP_TAX_CALCULATION_REAL_TESTS =
  process.env.VITE_ALLOW_TAXES_TESTS !== "true";

interface TestFixtures {
  userId: string;
  email: string;
  page: Page;
}

export const integrationTest = test.extend<TestFixtures>({
  userId: async ({ browserName }, use) => {
    const userId = getUserId(browserName);
    await use(userId);
  },
  email: async ({ userId }, use) => {
    const email = getEmailFromUserId(userId);
    await use(email);
  },
  page: async ({ browser }, use) => {
    const page = await browser.newPage();
    await use(page);
    await page.close();
  },
});

integrationTest.beforeEach(async ({ page }) => {
  await page.route("**/v1/events", async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({}),
    });
  });
});
