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
  ["es", "Pago seguro mediante RevenueCat"],
  ["it", "Pagamento sicuro tramite RevenueCat"],
  ["en", "Secure checkout by RevenueCat"],
  ["fr", "Paiement sécurisé par RevenueCat"],
  ["de", "Sicherer Checkout über RevenueCat"],
];

TEST_CASES.forEach(([lang, title]) => {
  integrationTest(`Displays in ${lang}`, async ({ page, userId }) => {
    page = await navigateToLandingUrl(page, userId, { lang });

    const packageCards = await getPackageCards(page);
    await startPurchaseFlow(page, packageCards[1]);

    await expect(page.getByText(title)).toBeVisible();
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

    await expect(page.getByText(title)).toBeVisible();
  });
});
