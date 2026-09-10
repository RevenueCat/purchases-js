import type { KeplerFileSystem as AmazonKeplerFileSystem } from "@amazon-devices/kepler-file-system";
import { ErrorCode, PurchasesError } from "../entities/errors";

/**
 * Shared Kepler File System loader contract used by VegaDeviceCache.
 *
 * Keeping this as an injected dependency lets the default purchases-js module
 * avoid importing the Vega-only File System package. The Vega entry point
 * installs the native module implementation before re-exporting the public
 * SDK API.
 */
export type KeplerFileSystem = typeof AmazonKeplerFileSystem;
export type KeplerFileSystemLoader = () => Promise<KeplerFileSystem>;

const missingKeplerFileSystemLoader: KeplerFileSystemLoader = async () => {
  throw new PurchasesError(
    ErrorCode.ConfigurationError,
    "Kepler File System is supported only by the @revenuecat/purchases-js/vega entry point.",
  );
};

let keplerFileSystemLoader: KeplerFileSystemLoader =
  missingKeplerFileSystemLoader;

/**
 * Installs the runtime-specific Kepler File System implementation.
 *
 * @internal
 */
export function setKeplerFileSystemLoader(
  loader: KeplerFileSystemLoader,
): void {
  keplerFileSystemLoader = loader;
}

/**
 * Restores the loader used when no Vega-capable entry point has configured one.
 *
 * @internal
 */
export function resetKeplerFileSystemLoader(): void {
  keplerFileSystemLoader = missingKeplerFileSystemLoader;
}

/**
 * Gets the Kepler File System through the implementation selected by the
 * active entry point.
 *
 * @internal
 */
export function loadKeplerFileSystem(): Promise<KeplerFileSystem> {
  return keplerFileSystemLoader();
}
