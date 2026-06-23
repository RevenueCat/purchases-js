import type { WalletButtonTheme } from "@revenuecat/purchases-ui-js";
import type { CustomTranslations } from "../ui/localization/translator";
import type { Package, PurchaseMetadata, PurchaseOption } from "./offerings";
import type { PurchaseListener } from "./purchase-listener";

/**
 * Callback to be called when the express purchase button is ready to be updated.
 * @experimental
 * @public
 */
export interface ExpressPurchaseButtonUpdater {
  /**
   * Updates the purchase option of the express purchase button.
   */
  updatePurchase: (pkg: Package, purchaseOption?: PurchaseOption) => void;
}

/**
 * Parameters for the {@link Purchases.presentExpressPurchaseButton} method.
 *
 * @example
 * ```ts
 * const offerings = await purchases.getOfferings();
 * const pkg = offerings.current?.availablePackages[0];
 * const htmlTarget = document.getElementById("express-purchase-button");
 * const fallbackButton = document.getElementById("checkout-button");
 *
 * if (pkg && htmlTarget) {
 *   let expressButtonUpdater: ExpressPurchaseButtonUpdater | undefined;
 *
 *   void purchases.presentExpressPurchaseButton({
 *     rcPackage: pkg,
 *     htmlTarget,
 *     onButtonReady: (updater, walletsAvailable) => {
 *       expressButtonUpdater = updater;
 *       htmlTarget.hidden = !walletsAvailable;
 *
 *       if (fallbackButton) {
 *         fallbackButton.hidden = walletsAvailable;
 *       }
 *     },
 *   });
 *
 *   // If the customer selects a different package later, update the button
 *   // instead of rendering a new one.
 *   function onSelectedPackageChanged(nextPackage: Package) {
 *     expressButtonUpdater?.updatePurchase(nextPackage);
 *   }
 * }
 * ```
 *
 * @experimental
 * @public
 */
export interface PresentExpressPurchaseButtonParams {
  /**
   * The package you want to purchase. Obtained from {@link Purchases.getOfferings}.
   */
  rcPackage: Package;
  /**
   * The HTML element where the express purchase button should be rendered.
   */
  htmlTarget: HTMLElement;
  /**
   * The option to be used for this purchase. If not specified or null the default one will be used.
   */
  purchaseOption?: PurchaseOption | null;
  /**
   * The email of the user. If undefined, RevenueCat will ask the customer for their email.
   */
  customerEmail?: string;
  /**
   * The locale to use for the purchase flow. If not specified, English will be used
   */
  selectedLocale?: string;
  /**
   * The default locale to use if the selectedLocale is not available.
   * Defaults to english.
   */
  defaultLocale?: string;
  /**
   * The purchase metadata to be passed to the backend.
   * Any information provided here will be propagated to the payment gateway and
   * to the RC transaction as metadata.
   */
  metadata?: PurchaseMetadata;
  /**
   * @internal
   * @experimental
   * Allows the user to override the default labels used in the purchase flow.
   *
   */
  labelsOverride?: CustomTranslations;
  /**
   * Callback to be called when the express purchase button is ready to be clicked.
   */
  onButtonReady?: (
    updater: ExpressPurchaseButtonUpdater,
    walletsAvailable: boolean,
  ) => void;
  /**
   * Optional listener for purchase lifecycle events.
   */
  listener?: PurchaseListener;
  /**
   * Theme for the Stripe wallet button appearance.
   * Matches Apple Pay button styles: 'black', 'white', or 'white-outline'
   * Defaults to "black".
   */
  walletButtonTheme?: WalletButtonTheme;
}
