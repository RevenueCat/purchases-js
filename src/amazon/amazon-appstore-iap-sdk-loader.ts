import type * as AmazonVegaSdk from "@amazon-devices/keplerscript-appstore-iap-lib";
import { ErrorCode, PurchasesError } from "../entities/errors";

/**
 * Shared Amazon AppStore IAP SDK loader contract used by AmazonBillingWrapper.
 *
 * Keeping this as an injected dependency lets the default purchases-js module
 * include the shared wrapper without importing the Flow-based Amazon IAP
 * package. The Vega module installs an implementation that loads the
 * native Amazon module before re-exporting the public SDK API.
 */
export type AmazonAppstoreIAPSDK = typeof AmazonVegaSdk;
export type AmazonAppstoreIAPSDKLoader = () => Promise<AmazonAppstoreIAPSDK>;

// The default implementation intentionally throws an error. This loader is replaced
// with a complete implementation as a side effect of
// importing `@revenuecat/purchases-js/vega`.
let amazonAppstoreIAPSDKLoader: AmazonAppstoreIAPSDKLoader = async () => {
  throw new PurchasesError(
    ErrorCode.ConfigurationError,
    "Amazon Appstore is supported only by the @revenuecat/purchases-js/vega entry point.",
  );
};

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
 * Gets the SDK through the implementation selected by the active entry point.
 *
 * @internal
 */
export function loadAmazonAppstoreIAPSDK(): Promise<AmazonAppstoreIAPSDK> {
  return amazonAppstoreIAPSDKLoader();
}
