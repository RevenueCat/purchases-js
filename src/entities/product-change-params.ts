/**
 * Parameters for {@link Purchases.changeProduct}.
 * @experimental
 */
export interface ChangeProductParams {
  /**
   * The product identifier of the Web Billing product to change the
   * customer's current subscription to. A product change path from the
   * current product to this product must be configured in RevenueCat.
   */
  newProductId: string;
  /**
   * A short-lived subscriber access token authenticating the current
   * customer. This must be minted server-side using a secret API key via the
   * RevenueCat Developer API `authenticate` endpoint, and passed to the
   * browser. Never use a RevenueCat API key here.
   */
  subscriberToken: string;
}

/**
 * Result of {@link Purchases.changeProduct}.
 * @experimental
 */
export interface ProductChangeResult {
  /**
   * Identifier of the RC Billing operation session tracking the change.
   */
  operationSessionId: string;
  /**
   * Whether the change was applied immediately (upgrade, charged now with a
   * prorated credit for unused time) or deferred to the end of the current
   * billing cycle (downgrade).
   */
  changeTiming: "immediate" | "deferred";
  /**
   * The product identifier the subscription was (or will be) changed to.
   */
  newProductId: string;
}
