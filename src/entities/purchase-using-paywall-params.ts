import type { Offering } from "./offerings";

/**
 * Parameters for the {@link Purchases.purchaseUsingPaywall} method.
 * @public
 */
export interface PurchaseUsingPaywallParams {
  /**
   * The identifier of the offering to fetch the paywall for.
   * Can be a string identifier or one of the predefined keywords.
   */
  readonly offering: Offering;

  readonly htmlTarget?: HTMLElement;

  readonly purchaseHtmlTarget?: HTMLElement;

  readonly customerEmail?: string;

  readonly onNavigateToUrl?: (url: string) => void;

  readonly onBack?: () => void;

  readonly onVisitCustomerCenter?: () => void;

  readonly selectedLocale?: string;
}
