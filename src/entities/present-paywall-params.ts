import type { Offering } from "./offerings";

/**
 * Parameters for the {@link Purchases.presentPaywall} method.
 * @public
 */
export interface PresentPaywallParams {
  /**
   * The identifier of the offering to fetch the paywall for.
   * Can be a string identifier or one of the predefined keywords.
   */
  readonly offering?: Offering;

  /**
   * The target element where the paywall will be rendered.
   * The paywall will create a full-screen overlay if null.
   */
  readonly htmlTarget?: HTMLElement;

  /**
   * The target element where the checkout flow will be rendered.
   * The checkout flow will create a full-screen overlay if null.
   */
  readonly purchaseHtmlTarget?: HTMLElement;

  /**
   * The email of the customer starting the purchase.
   * If passed the checkout flow will not ask for it to the customer.
   */
  readonly customerEmail?: string;

  /**
   * Callback to be called when the paywall tries to navigate to an external URL.
   */
  readonly onNavigateToUrl?: (url: string) => void;

  /**
   * Callback to be called when the paywall tries to navigate back.
   */
  readonly onBack?: (closePaywall: () => void) => void;

  /**
   * Callback to be called when the paywall tries to visit the customer center.
   */
  readonly onVisitCustomerCenter?: () => void;

  /**
   * Callback called when an error that won't close the paywall occurs.
   * For example, a retryable error during the purchase process.
   */
  readonly onPurchaseError?: (error: Error) => void;

  /**
   * The locale to use for the paywall and the checkout flow.
   */
  readonly selectedLocale?: string;

  /**
   * Whether to hide back buttons in the paywall. Defaults to false.
   */
  readonly hideBackButtons?: boolean;
}
