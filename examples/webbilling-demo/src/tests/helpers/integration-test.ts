import test, { type Page } from "@playwright/test";
import { getUserId } from "./test-helpers";
import { getEmailFromUserId } from "./test-helpers";

export const ALLOW_PAYWALLS_TESTS =
  process.env.VITE_ALLOW_PAYWALLS_TESTS === "true";

export const SKIP_TAX_REAL_TESTS = (() => {
  const skipUntilDate = process.env.VITE_SKIP_TAX_REAL_TESTS_UNTIL;
  if (!skipUntilDate) return false;
  try {
    // Validate the format is yyyy-mm-dd
    const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateFormatRegex.test(skipUntilDate)) {
      console.error(
        "Invalid date format for VITE_SKIP_TAX_REAL_TESTS_UNTIL. Expected format is 'yyyy-mm-dd'",
      );
      return false;
    }
    const skipDate = new Date(skipUntilDate);
    if (isNaN(skipDate.getTime())) {
      console.error(
        "Invalid date format for VITE_SKIP_TAX_REAL_TESTS_UNTIL. Expecting 'yyyy-mm-dd'",
      );
      return false;
    }

    // Get current date normalized to midnight UTC
    const now = new Date();
    const currentDate = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
    );

    // Normalize skip date to midnight UTC to ensure consistent comparison
    const normalizedSkipDate = new Date(
      Date.UTC(skipDate.getFullYear(), skipDate.getMonth(), skipDate.getDate()),
    );

    return currentDate < normalizedSkipDate;
  } catch (error) {
    console.error("Error parsing VITE_SKIP_TAX_REAL_TESTS_UNTIL:", error);
    return false;
  }
})();

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
