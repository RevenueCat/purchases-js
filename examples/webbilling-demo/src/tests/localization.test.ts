import test, { expect } from "@playwright/test";
import {
  getUserId,
  setupTest,
  getPackageCards,
  getPaywallPackageCards,
  startPurchaseFlow,
  getAllElementsByLocator,
  RC_PAYWALL_TEST_OFFERING_ID,
} from "./test-helpers";

test.describe("Localization", () => {
  [
    ["es", "Pago seguro mediante RevenueCat"],
    ["it", "Pagamento sicuro tramite RevenueCat"],
    ["en", "Secure checkout by RevenueCat"],
    ["fr", "Paiement sécurisé par RevenueCat"],
    ["de", "Sicherer Checkout über RevenueCat"],
  ].forEach(([lang, title]) => {
    test(`Shows the purchase flow in ${lang}`, async ({
      browser,
      browserName,
    }) => {
      const userId = getUserId(browserName);
      const page = await setupTest(browser, userId, { lang });

      const packageCards = await getPackageCards(page);
      await startPurchaseFlow(packageCards[1]);

      await expect(page.getByText(title)).toBeVisible({ timeout: 10000 });
    });
  });

  [
    ["es", "Pago seguro mediante RevenueCat"],
    ["it", "Pagamento sicuro tramite RevenueCat"],
    ["en", "Secure checkout by RevenueCat"],
    ["fr", "Paiement sécurisé par RevenueCat"],
    ["de", "Sicherer Checkout über RevenueCat"],
  ].forEach(([lang, title]) => {
    test(`Shows the purchase flow in ${lang} when purchasing from paywalls`, async ({
      browser,
      browserName,
    }) => {
      const userId = getUserId(browserName);
      const page = await setupTest(browser, userId, {
        lang,
        offeringId: RC_PAYWALL_TEST_OFFERING_ID,
        useRcPaywall: true,
      });

      const packageCards = await getPaywallPackageCards(page);
      await packageCards[0].click();

      // Get the purchase button as a Locator
      const purchaseButton = (
        await getAllElementsByLocator(page, "button.rc-pw-purchase-button")
      )[0];

      await expect(purchaseButton).toBeVisible();
      await purchaseButton.click();

      await expect(page.getByText(title)).toBeVisible({ timeout: 10000 });
    });
  });
});
