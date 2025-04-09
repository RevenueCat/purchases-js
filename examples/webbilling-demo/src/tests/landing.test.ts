import test, { expect } from "@playwright/test";
import {
  getAllElementsByLocator,
  getPackageCards,
  getPaywallPackageCards,
  getUserId,
  RC_PAYWALL_TEST_OFFERING_ID,
  RC_PAYWALL_TEST_OFFERING_ID_WITH_VARIABLES,
  setupTest,
} from "./test-helpers";

test.describe("Landing", () => {
  test("Get offerings displays packages", async ({ browser, browserName }) => {
    const userId = getUserId(browserName);
    const page = await setupTest(browser, userId);
    const packageCards = await getPackageCards(page);

    const EXPECTED_VALUES = [
      /30[,.]00/,
      /19[,.]99/,
      /15[,.]00/,
      /99[,.]99/,
      /2[,.]99/,
    ];

    await Promise.all(
      packageCards.map(
        async (card, index) =>
          await expect(card).toHaveText(EXPECTED_VALUES[index]),
      ),
    );
  });

  test("Get offerings can filter by offering ID", async ({
    browser,
    browserName,
  }) => {
    const userId = getUserId(browserName);
    const offeringId = "default_download";
    const page = await setupTest(browser, userId, { offeringId });

    const EXPECTED_VALUES = [/30[,.]00/, /15[,.]00/, /19[,.]99/];
    const packageCards = await getPackageCards(page);
    expect(packageCards.length).toBe(3);
    await Promise.all(
      packageCards.map(
        async (card, index) =>
          await expect(card).toHaveText(EXPECTED_VALUES[index]),
      ),
    );
  });

  test("Can render an RC Paywall", async ({ browser, browserName }) => {
    const userId = getUserId(browserName);
    const page = await setupTest(browser, userId, {
      offeringId: RC_PAYWALL_TEST_OFFERING_ID,
      useRcPaywall: true,
    });
    const title = page.getByText("E2E Tests for Purchases JS");
    await expect(title).toBeVisible();
  });

  test("Can render an RC Paywall using variables", async ({
    browser,
    browserName,
  }) => {
    const userId = getUserId(browserName);
    const page = await setupTest(browser, userId, {
      offeringId: RC_PAYWALL_TEST_OFFERING_ID_WITH_VARIABLES,
      useRcPaywall: true,
    });
    const packageCards = await getPaywallPackageCards(page);

    // Get the purchase button as a Locator
    const purchaseButton = (
      await getAllElementsByLocator(page, "button.rc-pw-purchase-button")
    )[0];

    await expect(purchaseButton).toContainText(
      "PURCHASE FOR $1.25/1wk($5.00/mo)",
    );

    await packageCards[1].click();
    await expect(purchaseButton).toContainText("PURCHASE FOR $30.00");

    await packageCards[2].click();
    await expect(purchaseButton).toContainText(
      "PURCHASE FOR $19.99/1yr($1.67/mo)",
    );
  });
});
