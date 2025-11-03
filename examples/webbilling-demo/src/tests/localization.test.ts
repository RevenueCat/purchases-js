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
  ["es", "Suscribirse a", "Pago seguro mediante RevenueCat"],
  ["it", "Abbonati a", "settimanale", "mensile", "annuale"],
  ["en", "Subscribe to", "Secure checkout by RevenueCat"],
  ["fr", "S'abonner à", "Paiement sécurisé par RevenueCat"],
  ["de", "Abonnieren", "Sicherer Checkout über RevenueCat"],
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
      page.getByText(x),
    );
    for (const x of packageCards) {
      await expect(x).toBeVisible();
    }
  });
});
