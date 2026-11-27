import type { PurchaseListener } from "./purchase-listener";
import type { PaywallInteractionEvent } from "./paywall-interaction-event";
import type { FlowEvent } from "./flow-event";

/**
 * Listener for paywall purchase lifecycle events.
 * @public
 */
export type PaywallListener = PurchaseListener & {
  /**
   * Called when the user interacts with a paywall control.
   * Exceptions thrown here are logged and do not affect the paywall.
   */
  onInteraction?: (event: PaywallInteractionEvent) => void;
  /**
   * Called when the user starts or completes a flow step, closes the flow, or a paywall step is shown or closed.
   * Thrown errors and rejected promises are logged. The paywall continues without waiting for the callback.
   */
  onFlowEvent?: (event: FlowEvent) => void;
};
