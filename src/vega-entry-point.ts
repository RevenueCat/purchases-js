/**
 * Tracks whether the Vega entry point is active.
 *
 * The Vega module enables this as an import side effect before exposing the
 * shared Purchases API. The default entry point leaves it disabled so it can
 * continue to support all of its existing stores.
 *
 * @internal
 */
let isVegaEntryPointActive = false;

/** @internal */
export function activateVegaEntryPoint(): void {
  isVegaEntryPointActive = true;
}

/** @internal */
export function isVegaEntryPoint(): boolean {
  return isVegaEntryPointActive;
}
