import type { WalletButtonTheme } from "@revenuecat/purchases-ui-js";
import type { CustomTranslations } from "../ui/localization/translator";
import type { Package, PurchaseMetadata, PurchaseOption } from "./offerings";
import type { PurchaseListener } from "./purchase-listener";

/**
 * Callback to be called when the express purchase button is ready to be updated.
 * @experimental
 */
export interface ExpressPurchaseButtonUpdater {
  /**
   * Updates the purchase option of the express purchase button.
   */
  updatePurchase: (pkg: Package, purchaseOption?: PurchaseOption) => void;
}

/**
 * Parameters for the {@link Purchases.presentExpressPurchaseButton} method.
 * @experimental
 */
export interface PresentExpressPurchaseButtonParams {
  /**
   * The package you want to purchase. Obtained from {@link Purchases.getOfferings}.
   */
  rcPackage: Package;
  /**
   * The option to be used for this purchase. If not specified or null the default one will be used.
   */
  purchaseOption?: PurchaseOption | null;
  /**
   * The HTML element where the express purchase button should be rendered.
   */
  htmlTarget: HTMLElement;
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
   * @default "black"
   */
  walletButtonTheme?: WalletButtonTheme;
}
