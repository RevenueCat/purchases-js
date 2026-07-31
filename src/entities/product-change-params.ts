/**
 * Options for changing an existing Web Billing subscription via
 * {@link Purchases.purchase} with {@link PurchaseParams.productChangeInfo}.
 * @internal
 */
export interface ProductChangeInfo {
  /**
   * RevenueCat subscription public id (`sub…`) of the subscription to change.
   *
   * Typically obtained by your backend via the
   * [Developer API](https://www.revenuecat.com/docs/api-v2)
   * customer subscriptions list and passed to the client with the token.
   */
  subscriptionId: string;
  /**
   * Optional short-lived subscriber access token override for this call.
   * Falls back to {@link PurchasesConfig.subscriberToken} when omitted.
   *
   * Minted server-side using a secret API key via the RevenueCat Developer
   * API `authenticate` endpoint.
   */
  subscriberToken?: string;
}

/**
 * Outcome of confirming a RevenueCat Billing product change.
 * @internal
 */
export interface ProductChangeResult {
  /**
   * Identifier of the RC Billing operation session tracking the change.
   */
  operationSessionId: string;
  /**
   * Whether the change was applied immediately (upgrade, charged now with a
   * prorated credit for unused time) or deferred to the end of the current
   * billing cycle (downgrade). Matches the configured product change path
   * `change_type`.
   */
  changeType: "immediate" | "deferred";
  /**
   * The product identifier the subscription was (or will be) changed to.
   */
  newProductId: string;
}
