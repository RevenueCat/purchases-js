/**
 * Helper functions to safely access browser globals (window, document)
 * in environments that may not have them available (e.g., Node.js, Expo Go).
 */

import { ErrorCode, PurchasesError } from "../entities/errors";

/**
 * Access the `window` global or fail.
 * @returns The `window` object if defined
 * @throws PurchasesError if `window` is not available
 */
export function getWindow(): Window {
  // eslint-disable-next-line no-restricted-globals
  if (typeof window !== "undefined") {
    // eslint-disable-next-line no-restricted-globals
    return window;
  }

  throw new PurchasesError(
    ErrorCode.UnsupportedError,
    "window is not available. This SDK requires a browser environment for this operation.",
  );
}

/**
 * Safely access the `window` global, allowing undefined.
 * @returns The `window` object or undefined if not available
 */
export function getNullableWindow(): Window | undefined {
  // eslint-disable-next-line no-restricted-globals
  if (typeof window !== "undefined") {
    // eslint-disable-next-line no-restricted-globals
    return window;
  }
  return undefined;
}

/**
 * Access the `document` global or fail.
 * @returns The `document` object if defined
 * @throws PurchasesError if `document` is not available
 */
export function getDocument(): Document {
  // eslint-disable-next-line no-restricted-globals
  if (typeof document !== "undefined") {
    // eslint-disable-next-line no-restricted-globals
    return document;
  }

  throw new PurchasesError(
    ErrorCode.UnsupportedError,
    "document is not available. This SDK requires a browser environment for this operation.",
  );
}

/**
 * Safely access the `document` global, allowing undefined.
 * @returns The `document` object or undefined if not available
 */
export function getNullableDocument(): Document | undefined {
  // eslint-disable-next-line no-restricted-globals
  if (typeof document !== "undefined") {
    // eslint-disable-next-line no-restricted-globals
    return document;
  }
  return undefined;
}
