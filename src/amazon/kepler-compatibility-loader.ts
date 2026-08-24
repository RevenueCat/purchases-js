import type { isPresentOnOS as amazonIsPresentOnOS } from "@amazon-devices/kepler-compatibility";
import { ErrorCode, PurchasesError } from "../entities/errors";

/**
 * Shared Kepler compatibility API contract used by VegaDeviceCache.
 *
 * Keeping this as an injected dependency lets the default purchases-js module
 * avoid importing the Vega-only compatibility package. The Vega entry point
 * installs the native implementation before re-exporting the public SDK API.
 */
export type IsPresentOnOS = typeof amazonIsPresentOnOS;

const missingIsPresentOnOS: IsPresentOnOS = () => {
  throw new PurchasesError(
    ErrorCode.ConfigurationError,
    "Kepler compatibility APIs are supported only by the @revenuecat/purchases-js/vega entry point.",
  );
};

let isPresentOnOS: IsPresentOnOS = missingIsPresentOnOS;

/**
 * Installs the runtime-specific Kepler compatibility implementation.
 *
 * @internal
 */
export function setIsPresentOnOS(implementation: IsPresentOnOS): void {
  isPresentOnOS = implementation;
}

/**
 * Checks whether the running Vega OS provides a library version.
 *
 * @internal
 */
export function isKeplerLibraryPresentOnOS(
  libraryName: string,
  version: string,
): boolean {
  return isPresentOnOS(libraryName, version);
}
