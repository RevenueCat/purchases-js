import type * as AmazonVegaSdk from "@amazon-devices/keplerscript-appstore-iap-lib";
import { ErrorCode, PurchasesError } from "../../entities/errors";

/** Native SDK loader installed by the Vega package entry point. */
export type AmazonAppstoreIAPSDK = typeof AmazonVegaSdk;
export type AmazonAppstoreIAPSDKLoader = () => Promise<AmazonAppstoreIAPSDK>;

// The default implementation intentionally throws an error. This loader is replaced
// with a complete implementation as a side effect of
// importing `@revenuecat/purchases-js-vega`.
const missingAmazonAppstoreIAPSDKLoader: AmazonAppstoreIAPSDKLoader =
  async () => {
    throw new PurchasesError(
      ErrorCode.ConfigurationError,
      "Amazon Appstore is supported only by the @revenuecat/purchases-js-vega package.",
    );
  };

let amazonAppstoreIAPSDKLoader: AmazonAppstoreIAPSDKLoader =
  missingAmazonAppstoreIAPSDKLoader;

/**
 * Installs the runtime-specific Amazon SDK implementation.
 *
 * @internal
 */
export function setAmazonAppstoreIAPSDKLoader(
  loader: AmazonAppstoreIAPSDKLoader,
): void {
  amazonAppstoreIAPSDKLoader = loader;
}

/**
 * Restores the loader used when no Amazon-capable entry point has configured one.
 *
 * This is primarily useful for tests that need to verify the standard entry
 * point's failure mode.
 *
 * @internal
 */
export function resetAmazonAppstoreIAPSDKLoader(): void {
  amazonAppstoreIAPSDKLoader = missingAmazonAppstoreIAPSDKLoader;
}

/**
 * Gets the SDK through the implementation selected by the active entry point.
 *
 * @internal
 */
export function loadAmazonAppstoreIAPSDK(): Promise<AmazonAppstoreIAPSDK> {
  return amazonAppstoreIAPSDKLoader();
}
