/**
 * PlatformInfo is an interface that represents the information about the platform.
 * Used by RevenueCat Hybrid SDKs to provide information about the platform.
 * @public
 * @experimental
 */
export interface PlatformInfo {
  /**
   * The flavor of the SDK.
   */
  readonly flavor: string;
  /**
   * The version of the hybrid SDK.
   */
  readonly version: string;
}
