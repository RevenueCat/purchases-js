import { expect } from "@playwright/test";
import {
  getPackageCards,
  navigateToLandingUrl,
  skipPaywallsTestIfDisabled,
  startPurchaseFlow,
} from "./helpers/test-helpers";
import { integrationTest } from "./helpers/integration-test";
import { RC_PAYWALL_TEST_OFFERING_ID } from "./helpers/fixtures";

const TEST_CASES = [
  ["es", "Suscribirse a", "semanal", "mensual", "anual"],
  ["it", "Abbonati a", "settimanale", "mensile", "annuale"],
  ["en", "Subscribe to", "weekly", "monthly", "yearly"],
  ["fr", "S'abonner à", "hebdomadaire", "mensuel", "annuel"],
  ["de", "Abonnieren", "wöchentlich", "monatlich", "jährlich"],
];

TEST_CASES.forEach(([lang, subscribeTo, weekly, monthly, yearly]) => {
  integrationTest(`Displays in ${lang}`, async ({ page, userId }) => {
    page = await navigateToLandingUrl(page, userId, { lang });

    const packageCards = await getPackageCards(page);
    await startPurchaseFlow(packageCards[1]);

    await expect(page.getByText(subscribeTo)).toBeVisible();
  });

  integrationTest(`Displays paywall in ${lang}`, async ({ page, userId }) => {
    skipPaywallsTestIfDisabled(integrationTest);

    page = await navigateToLandingUrl(page, userId, {
      lang,
      offeringId: RC_PAYWALL_TEST_OFFERING_ID,
      useRcPaywall: true,
    });

    const packageCards = [weekly, monthly, yearly].map((x) =>
      page.getByText(x, { exact: true }),
    );
    for (const x of packageCards) {
      await expect(x).toBeVisible();
    }
  });
});
