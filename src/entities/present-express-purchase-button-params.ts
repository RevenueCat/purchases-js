import type { Package, PurchaseMetadata, PurchaseOption } from "./offerings";

import type { CustomTranslations } from "../ui/localization/translator";

export interface ExpressPurchaseButtonUpdater {
  updatePurchase(pkg: Package, purchaseOption: PurchaseOption): void;
}

/**
 * Parameters used to customise the purchase flow when invoking the `.purchase` method.
 * @public
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
   * The HTML element where the billing view should be added. If undefined, a new div will be created at the root of the page and appended to the body.
   */
  htmlTarget?: HTMLElement;
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
   * @internal
   */
  onButtonReady?: (updater: ExpressPurchaseButtonUpdater) => void;
}
