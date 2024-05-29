/**
 * Parameters used to customise the purchase flow when invoking the `.purchase` method.
 * @public
 */
export interface PurchaseFlowParams {
  /**
   * The optionId to be used for this purchase. If not specified the default one will be used.
   */
  subscriptionPurchaseOptionId?: string;
  /**
   * The HTML element where the billing view should be added. If null, a new div will be created at the root of the page and appended to the body.
   */
  htmlTarget?: HTMLElement;
  /**
   * The email of the user. If null, RevenueCat will ask the customer for their email.
   */
  customerEmail?: string;
}
