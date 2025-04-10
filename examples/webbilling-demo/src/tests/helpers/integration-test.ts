import test, { type Page } from "@playwright/test";
import { getUserId } from "./test-helpers";
import { getEmailFromUserId } from "./test-helpers";

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
  },
});
