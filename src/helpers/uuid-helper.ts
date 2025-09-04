/**
 * Fills the provided byte array with random values using Math.random
 * @param bytes The byte array to fill with random values
 */
function fillBytesWithMathRandom(bytes: Uint8Array): void {
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
}

/**
 * Generates a UUID v4 string.
 * Uses crypto.randomUUID if available, otherwise falls back to a manual implementation.
 * @returns A UUID v4 string in the format xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 */
export function generateUUID(): string {
  // Check if crypto is available
  // (not available in React Native Expo Go by default)
  const cryptoObj = typeof crypto !== "undefined" ? crypto : globalThis.crypto;

  if (cryptoObj && cryptoObj.randomUUID) {
    return cryptoObj.randomUUID();
  }

  const bytes = new Uint8Array(16);
  try {
    if (cryptoObj && cryptoObj.getRandomValues) {
      cryptoObj.getRandomValues(bytes);
    } else {
      fillBytesWithMathRandom(bytes);
    }
  } catch (error) {
    console.log(
      `Error using crypto.getRandomValues(), falling back to Math.random. + ${error}`,
    );
    fillBytesWithMathRandom(bytes);
  }

  // Set version (4) and variant bits
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant

  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0"));
  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10, 16).join(""),
  ].join("-");
}
