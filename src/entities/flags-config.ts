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
}

export const defaultFlagsConfig: FlagsConfig = {
  autoCollectUTMAsMetadata: true,
};
