import type { Package } from "./offerings";
import type { PurchasesError } from "./errors";

/**
 * Listener for paywall purchase lifecycle events.
 * All methods are optional, matching Android's default empty implementations.
 * @public
 */
export interface PaywallListener {
  /**
   * Called when a purchase flow is about to start for the given package.
   */
  onPurchaseStarted?: (rcPackage: Package) => void;

  /**
   * Called when a purchase flow fails with an error.
   */
  onPurchaseError?: (error: PurchasesError) => void;

  /**
   * Called when the user cancels the purchase flow.
   */
  onPurchaseCancelled?: () => void;
}
