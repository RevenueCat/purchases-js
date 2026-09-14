import type { FlagsConfig } from "./flags-config";
import type { HttpConfig } from "./http-config";
import type { BrandingAppearance } from "./branding";

/**
 * Contextual information specific to workflows.
 * @internal
 */
export interface WorkflowContext {
  /**
   * Optional identifier to group events emitted by the SDK.
   */
  workflowIdentifier?: string;
}

/**
 * Additional context to be associated with the configured Purchases instance.
 * @internal
 */
export interface PurchasesContext {
  /**
   * Optional workflow-specific context shared across SDK components.
   */
  workflowContext?: WorkflowContext;
}

/**
 * Configuration object for initializing the Purchases SDK.
 *
 * @example
 * ```typescript
 * // Object-based configuration (recommended)
 * const purchases = Purchases.configure({
 *   apiKey: "your_api_key",
 *   appUserId: "user_123",
 *   httpConfig: { additionalHeaders: { "Custom-Header": "value" } },
 *   flags: { autoCollectUTMAsMetadata: true }
 * });
 *
 * // Legacy separate arguments (deprecated)
 * const purchases = Purchases.configure(
 *   "your_api_key",
 *   "user_123",
 *   { additionalHeaders: { "Custom-Header": "value" } },
 *   { autoCollectUTMAsMetadata: true }
 * );
 * ```
 *
 * @public
 */
export interface PurchasesConfig {
  /**
   * RevenueCat API Key. Can be obtained from the RevenueCat dashboard.
   */
  apiKey: string;
  /**
   * Your unique id for identifying the user.
   */
  appUserId: string;
  /**
   * Advanced http configuration to customise the SDK usage {@link HttpConfig}.
   */
  httpConfig?: HttpConfig;
  /**
   * Advanced functionality configuration {@link FlagsConfig}.
   */
  flags?: FlagsConfig;
  /**
   * Overrides the Dashboard branding appearance for purchases created by this
   * instance, including purchases started through {@link Purchases.presentPaywall}.
   * Only the provided values are overridden. A value passed directly to
   * {@link PurchaseParams.brandingAppearanceOverride} takes precedence for that
   * purchase.
   *
   * For Stripe Checkout, this customizes the supported mobile wallet experience.
   * The Stripe-hosted fallback opened through "Pay another way" remains light and
   * cannot currently be customized.
   */
  brandingAppearanceOverride?: Partial<BrandingAppearance>;
  /**
   * Optional short-lived subscriber access token used for RevenueCat Billing
   * product-change checkout. Minted server-side via the Developer API (https://www.revenuecat.com/docs/api-v2)
   * `authenticate` endpoint.
   * @internal
   */
  subscriberToken?: string;
  /**
   * Additional contextual information for the Purchases instance.
   * @internal
   */
  context?: PurchasesContext;
  /**
   * Optional external trace_id for analytics event tracking.
   * If provided, this trace_id will be used for all events tracked by the SDK.
   * If not provided, the SDK will generate an ephemeral trace_id automatically.
   * @internal
   */
  trace_id?: string;
}
