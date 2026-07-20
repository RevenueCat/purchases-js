import type { Offering } from "./offerings";
import type { PaywallListener } from "./paywall-listener";
import type {
  CompleteWorkflowNavigateArgs,
  CustomVariables,
} from "@revenuecat/purchases-ui-js";

export type { CompleteWorkflowNavigateArgs };

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
   * If set to true, the Web Billing checkout shown from the paywall
   * will display a discount input code field.
   */
  readonly showDiscountCodeField?: boolean;

  /**
   * Initial discount code to apply to the checkout when one already exists
   * outside of the paywall UI, for example in the hosting page's URL.
   */
  readonly discountCode?: string;

  /**
   * Called when the applied discount code changes in the checkout shown from
   * the paywall. This can be used to sync host state such as URL parameters.
   */
  readonly onDiscountCodeChanged?: (discountCode: string | null) => void;

  /**
   * Callback to be called when the paywall tries to navigate to an external URL.
   *
   * Markdown text links keep their native browser navigation. Use this callback
   * for side effects or to customize how button-driven URL actions are handled.
   */
  readonly onNavigateToUrl?: (url: string) => void;

  /**
   * Called when the paywall uses a complete_workflow button (exit URL).
   * If omitted, the SDK opens the URL: new tab for `external_browser`, same tab for
   * `in_app_browser` / `deep_link`.
   * @internal
   */
  readonly onCompleteWorkflowNavigate?: (
    args: CompleteWorkflowNavigateArgs,
  ) => void | Promise<void>;

  /**
   * Callback to be called when the paywall tries to navigate back.
   *
   * Example:
   * ```ts
   * onBack: (closePaywall) => {
   *   // You may want to keep the paywall open while showing a confirmation
   *   // modal or logging analytics, then close it if the user confirms.
   *   // If you want the back action to dismiss the paywall immediately,
   *   // call closePaywall() right away.
   *   closePaywall();
   * }
   * ```
   */
  readonly onBack?: (closePaywall: () => void) => void;

  /**
   * Callback to be called when the paywall tries to visit the customer center.
   */
  readonly onVisitCustomerCenter?: () => void;

  /**
   * Callback called when an error that won't close the paywall occurs.
   * For example, a retryable error during the purchase process.
   * @deprecated Use `listener.onPurchaseError` instead.
   */
  readonly onPurchaseError?: (error: Error) => void;

  /**
   * Optional listener for paywall purchase lifecycle events.
   */
  readonly listener?: PaywallListener;

  /**
   * The locale to use for the paywall and the checkout flow.
   */
  readonly selectedLocale?: string;

  /**
   * Whether to hide back buttons in the paywall. Defaults to false.
   */
  readonly hideBackButtons?: boolean;

  /**
   * Custom variables to pass to the paywall at runtime, overriding defaults set
   * in the RevenueCat dashboard.
   *
   * Variables must be defined in the dashboard first. Reference them in paywall
   * text using the `custom.` prefix (e.g. `{{ custom.player_name }}`).
   *
   * @example
   * ```ts
   * presentPaywall({
   *   customVariables: {
   *     player_name: CustomVariableValue.string('Ada'),
   *     level: CustomVariableValue.number(42),
   *     is_premium: CustomVariableValue.boolean(true),
   *   },
   * });
   * ```
   */
  readonly customVariables?: CustomVariables;
}
