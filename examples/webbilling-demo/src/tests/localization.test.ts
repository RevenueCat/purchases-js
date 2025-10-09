import { expect } from "@playwright/test";
import {
  getPackageCards,
  getPaywallPackageCards,
  startPurchaseFlow,
  navigateToLandingUrl,
  getPaywallPurchaseButtons,
  skipPaywallsTestIfDisabled,
} from "./helpers/test-helpers";
import { integrationTest } from "./helpers/integration-test";
import { RC_PAYWALL_TEST_OFFERING_ID } from "./helpers/fixtures";

const TEST_CASES = [
  ["es", "Suscribirse a", "Pago seguro mediante RevenueCat"],
  ["it", "Abbonati a", "Pagamento sicuro tramite RevenueCat"],
  ["en", "Subscribe to", "Secure checkout by RevenueCat"],
  ["fr", "S'abonner à", "Paiement sécurisé par RevenueCat"],
  ["de", "Abonnieren", "Sicherer Checkout über RevenueCat"],
];

TEST_CASES.forEach(([lang, subscribeTo, safePayment]) => {
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

    const packageCards = await getPaywallPackageCards(page);
    await packageCards[0].click();

    const purchaseButtons = await getPaywallPurchaseButtons(page);
    const purchaseButton = purchaseButtons[0];

    await expect(purchaseButton).toBeVisible();
    await purchaseButton.click();

    await expect(page.getByText(safePayment)).toBeVisible();
  });
});
