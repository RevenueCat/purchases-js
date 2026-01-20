import init, { add } from "@revenuecat/purchases-core";

let initialized = false;

/**
 * Initialize the Rust WASM core module.
 * This must be called before using any core functions.
 * Safe to call multiple times - will only initialize once.
 */
export async function initCore(): Promise<void> {
  if (!initialized) {
    await init();
    initialized = true;
  }
}

export { add };

