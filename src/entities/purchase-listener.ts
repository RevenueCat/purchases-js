import type { Package } from "./offerings";

/**
 * Listener for purchase lifecycle events.
 * @public
 */
export interface PurchaseListener {
  /**
   * Called when a purchase flow is about to start for the given package.
   */
  onPurchaseStarted?: (rcPackage: Package) => void;

  /**
   * Callback called when an error that won't close the paywall occurs.
   * For example, a retryable error during the purchase process.
   */
  onPurchaseError?: (error: Error) => void;

  /**
   * Called when the user cancels the purchase flow.
   */
  onPurchaseCancelled?: () => void;
}
