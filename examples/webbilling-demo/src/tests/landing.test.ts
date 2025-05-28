import { expect } from "@playwright/test";
import {
  getPackageCards,
  getPaywallPackageCards,
  getPaywallPurchaseButtons,
  navigateToLandingUrl,
  skipPaywallsTestIfDisabled,
} from "./helpers/test-helpers";
import { integrationTest } from "./helpers/integration-test";

import { RC_PAYWALL_TEST_OFFERING_ID_WITH_VARIABLES } from "./helpers/fixtures";
import { RC_PAYWALL_TEST_OFFERING_ID } from "./helpers/fixtures";

integrationTest("Displays all packages", async ({ page, userId }) => {
  page = await navigateToLandingUrl(page, userId);
  const packageCards = await getPackageCards(page);

  expect(packageCards.length).toBe(5);
  expect(packageCards[0]).toHaveText(/30[,.]00/);
  expect(packageCards[1]).toHaveText(/19[,.]99/);
  expect(packageCards[2]).toHaveText(/15[,.]00/);
  expect(packageCards[3]).toHaveText(/99[,.]99/);
  expect(packageCards[4]).toHaveText(/2[,.]99/);
});

integrationTest(
  "Displays packages by offering ID",
  async ({ page, userId }) => {
    const offeringId = "default_download";
    page = await navigateToLandingUrl(page, userId, { offeringId });

    const packageCards = await getPackageCards(page);
    expect(packageCards.length).toBe(3);
    expect(packageCards[0]).toHaveText(/30[,.]00/);
    expect(packageCards[1]).toHaveText(/15[,.]00/);
    expect(packageCards[2]).toHaveText(/19[,.]99/);
  },
);

integrationTest("Displays an RC Paywall", async ({ page, userId }) => {
  skipPaywallsTestIfDisabled(integrationTest);

  page = await navigateToLandingUrl(page, userId, {
    offeringId: RC_PAYWALL_TEST_OFFERING_ID,
    useRcPaywall: true,
  });
  const title = page.getByText("E2E Tests for Purchases JS");
  await expect(title).toBeVisible();
});

integrationTest(
  "Displays an RC Paywall using variables",
  async ({ page, userId }) => {
    skipPaywallsTestIfDisabled(integrationTest);

    page = await navigateToLandingUrl(page, userId, {
      offeringId: RC_PAYWALL_TEST_OFFERING_ID_WITH_VARIABLES,
      useRcPaywall: true,
    });
    const packageCards = await getPaywallPackageCards(page);
    const purchaseButtons = await getPaywallPurchaseButtons(page);
    const button = purchaseButtons[0];

    await expect(button).toContainText("PURCHASE FOR $1.25/1wk($5.00/mo)");

    await packageCards[1].click();
    await expect(button).toContainText("PURCHASE FOR $30.00");

    await packageCards[2].click();
    await expect(button).toContainText("PURCHASE FOR $19.99/1yr($1.67/mo)");
  },
);
