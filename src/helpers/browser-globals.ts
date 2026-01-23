/* eslint-disable no-restricted-globals */

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
  if (typeof window !== "undefined") {
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
  if (typeof window !== "undefined") {
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
  if (typeof document !== "undefined") {
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
  if (typeof document !== "undefined") {
    return document;
  }
  return undefined;
}
