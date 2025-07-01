import type { FlagsConfig } from "./flags-config";
import type { HttpConfig } from "./http-config";

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
}
