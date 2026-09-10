import { ErrorCode, PurchasesError } from "../entities/errors";

/**
 * Shared Kepler File System compatibility contract used by VegaDeviceCache.
 *
 * The Vega entry point installs the OS-specific version check. Keeping the
 * package name and version there prevents the default entry point from
 * including Vega-only File System support.
 */
export type KeplerFileSystemExistsSupportCheck = () => boolean;

const missingKeplerFileSystemExistsSupportCheck: KeplerFileSystemExistsSupportCheck =
  () => {
    throw new PurchasesError(
      ErrorCode.ConfigurationError,
      "Kepler compatibility APIs are supported only by the @revenuecat/purchases-js/vega entry point.",
    );
  };

let keplerFileSystemExistsSupportCheck: KeplerFileSystemExistsSupportCheck =
  missingKeplerFileSystemExistsSupportCheck;

/**
 * Installs the Vega OS version check for Kepler File System's `exists` API.
 *
 * @internal
 */
export function setKeplerFileSystemExistsSupportCheck(
  supportCheck: KeplerFileSystemExistsSupportCheck,
): void {
  keplerFileSystemExistsSupportCheck = supportCheck;
}

/**
 * Checks whether the running Vega OS provides Kepler File System's `exists` API.
 *
 * @internal
 */
export function isKeplerFileSystemExistsSupported(): boolean {
  return keplerFileSystemExistsSupportCheck();
}
