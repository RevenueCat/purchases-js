import test, { type Page } from "@playwright/test";
import { getUserId } from "./test-helpers";
import { getEmailFromUserId } from "./test-helpers";

export const ALLOW_PAYWALLS_TESTS =
  process.env.VITE_ALLOW_PAYWALLS_TESTS === "true";

export const ALLOW_TAX_CALCULATION_FF =
  process.env.VITE_ALLOW_TAX_CALCULATION_FF === "true";

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

export const skipPaywallsTestIfDisabled = (test: typeof integrationTest) => {
  test.skip(
    !ALLOW_PAYWALLS_TESTS,
    "Paywalls tests are disabled. To enable, set VITE_ALLOW_PAYWALLS_TESTS=true in the environment variables.",
  );
};

export const skipTaxCalculationTestIfDisabled = (
  test: typeof integrationTest,
) => {
  test.skip(
    !ALLOW_TAX_CALCULATION_FF,
    "Tax calculation is disabled. To enable, set VITE_ALLOW_TAX_CALCULATION_FF=true in the environment variables.",
  );
};
