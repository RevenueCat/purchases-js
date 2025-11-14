import type { FlagsConfig } from "./flags-config";
import type { HttpConfig } from "./http-config";

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
   * Additional contextual information for the Purchases instance.
   * @internal
   */
  context?: PurchasesContext;
}
