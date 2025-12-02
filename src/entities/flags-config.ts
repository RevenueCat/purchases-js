export const supportedRCSources = ["app", "embedded"];

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
}

export const defaultFlagsConfig: FlagsConfig = {
  autoCollectUTMAsMetadata: true,
  collectAnalyticsEvents: true,
};
