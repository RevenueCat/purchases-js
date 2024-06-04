import { type Package, type PurchaseOption } from "./offerings";

/**
 * Parameters used to customise the purchase flow when invoking the `.purchase` method.
 * @public
 */
export interface PurchaseParams {
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
}
