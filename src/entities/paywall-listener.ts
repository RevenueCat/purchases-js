import type { PurchaseListener } from "./purchase-listener";
import type { PaywallInteractionEvent } from "./paywall-interaction-event";

/**
 * Listener for paywall purchase lifecycle events.
 * @public
 */
export type PaywallListener = PurchaseListener & {
  /**
   * Called when the user interacts with a paywall control, also when analytics collection is disabled.
   * Exceptions thrown here are logged and do not affect the paywall.
   */
  onInteraction?: (event: PaywallInteractionEvent) => void;
};
