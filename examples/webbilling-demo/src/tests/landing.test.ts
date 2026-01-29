import { expect } from "@playwright/test";
import {
  getPackageCards,
  navigateToLandingUrl,
  skipPaywallsTestIfDisabled,
} from "./helpers/test-helpers";
import { integrationTest } from "./helpers/integration-test";

import {
  RC_PAYWALL_TEST_OFFERING_ID,
  RC_PAYWALL_TEST_OFFERING_ID_WITH_VARIABLES,
} from "./helpers/fixtures";

integrationTest("Displays all packages", async ({ page, userId }) => {
  page = await navigateToLandingUrl(page, userId);
  await expect(page.getByText(/30[,.]00/)).toBeVisible();
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

    await expect(page.getByText(/30[,.]00/)).toBeVisible();
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
  "Displays an RC Paywall using the current offering if none is passed",
  async ({ page, userId }) => {
    skipPaywallsTestIfDisabled(integrationTest);

    page = await navigateToLandingUrl(page, userId, {
      useRcPaywall: true,
    });
    const title = page.getByText("E2E Tests for Purchases JS");
    await expect(title).toBeVisible();
    const subtitle = page.getByText(
      "Testing current Offering is picked when no offering is passed",
    );
    await expect(subtitle).toBeVisible();
  },
);

integrationTest(
  "Displays an RC Paywall using variables",
  async ({ page, userId }) => {
    skipPaywallsTestIfDisabled(integrationTest);

    page = await navigateToLandingUrl(page, userId, {
      offeringId: RC_PAYWALL_TEST_OFFERING_ID_WITH_VARIABLES,
      useRcPaywall: true,
    });
    const packageCards = [
      page.getByText("weekly"),
      page.getByText("monthly"),
      page.getByText("yearly"),
    ];

    const buttonWithWeeklyVariables = page.getByText("PURCHASE weekly", {
      exact: true,
    });
    await expect(buttonWithWeeklyVariables).toBeVisible();

    await packageCards[1].click();
    const buttonWithMonthlyVariables = page.getByText("PURCHASE monthly", {
      exact: true,
    });
    await expect(buttonWithMonthlyVariables).toBeVisible();

    await packageCards[2].click();
    const buttonWithYearlyVariables = page.getByText("PURCHASE yearly", {
      exact: true,
    });
    await expect(buttonWithYearlyVariables).toBeVisible();
  },
);
