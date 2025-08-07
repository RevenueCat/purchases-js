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
   * If set to true, the SDK will allow Paddle API keys. Paddle is not fully supported yet, only some features are available.
   * @defaultValue false
   * @internal
   */
  allowPaddleAPIKey?: boolean;
}

export const defaultFlagsConfig: FlagsConfig = {
  autoCollectUTMAsMetadata: true,
  collectAnalyticsEvents: true,
};
