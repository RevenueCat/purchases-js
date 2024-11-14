import { Offering } from "./offerings";

/**
 * Parameters for the {@link Purchases.renderPaywall} method.
 * @public
 */
export interface RenderPaywallParams {
  /**
   * The identifier of the offering to fetch the paywall for.
   * Can be a string identifier or one of the predefined keywords.
   */
  readonly offering: Offering;

  readonly htmlTarget?: HTMLElement;

  readonly purchaseHtmlTarget?: HTMLElement;
}
