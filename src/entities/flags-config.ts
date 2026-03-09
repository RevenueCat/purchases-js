export const supportedRCSources = ["app", "embedded"];

/**
 * Determines when the store module (e.g. Stripe) is loaded.
 * - `"configuration"`: The store module is preloaded when the SDK is configured.
 * - `"purchase_start"`: The store module is loaded on demand when a purchase is started.
 * @public
 */
export type StoreLoadTime = "configuration" | "purchase_start";

/**
 * Flags used to enable or disable certain features in the sdk.
 * @public
 */
export interface FlagsConfig {
  /**
   * If set to true, the SDK will automatically collect UTM parameters and store them as at the time of purchase.
   * @defaultValue true
   */
  autoCollectUTMAsMetadata?: boolean;

  /**
   * If set to true, the SDK will automatically collect analytics events.
   * @defaultValue true
   */
  collectAnalyticsEvents?: boolean;

  /**
   * Describes the platform that originated the purchase.
   * This does not technically belong here but since the public Purchase configuration
   * does not use objects, it is the easiest way to pass this internal parameter.
   * @internal
   */
  rcSource?: string;

  /**
   * If set to `true`, the SDK will force the display of Apple Pay and Google Pay
   * buttons on supported platforms, even when the customer is not signed in to
   * their wallet. This may result in a sign-in flow being triggered.
   *
   * Useful for increasing wallet visibility, particularly on platforms like
   * desktop Chromium (macOS), where Apple Pay requires explicit enabling.
   *
   * Default behavior (`false`) relies on Stripe's auto-detection to optimize
   * for conversion.
   * @defaultValue false
   * @internal
   */
  forceEnableWalletMethods?: boolean;

  /**
   * Determines when the store module (e.g. Stripe) is loaded.
   * - `"configuration"`: Preloaded when the SDK is configured (default).
   * - `"purchase_start"`: Loaded on demand when a purchase is started.
   * @defaultValue "configuration"
   */
  storeLoadTime?: StoreLoadTime;
}

export const defaultFlagsConfig: FlagsConfig = {
  autoCollectUTMAsMetadata: true,
  collectAnalyticsEvents: true,
  storeLoadTime: "configuration",
};
