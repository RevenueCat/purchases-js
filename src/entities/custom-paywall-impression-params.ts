import type { Offering } from "./offerings";

/**
 * Parameters for tracking an impression of a custom paywall.
 *
 * Pass the offering used to render the paywall to include its offering,
 * placement, and targeting attribution in the event.
 * @public
 */
export interface CustomPaywallImpressionParams {
  /** An optional identifier for the custom paywall shown to the customer. */
  paywallId?: string;

  /** The offering used to render the custom paywall. */
  offering?: Offering;
}
