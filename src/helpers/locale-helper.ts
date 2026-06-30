import { getNullableWindow } from "./browser-globals";

export const toBcp47Locale = (locale?: string): string | undefined => {
  if (!locale) {
    return locale;
  }

  const normalizedLocale = locale.replace(/_/g, "-");

  try {
    const [canonicalLocale] = Intl.getCanonicalLocales(normalizedLocale);
    if (canonicalLocale) {
      return canonicalLocale;
    }
  } catch {
    // Continue to try a more permissive fallback.
  }

  const languageOnly = normalizedLocale.split("-")[0];

  try {
    const [canonicalLocale] = Intl.getCanonicalLocales(languageOnly);
    if (canonicalLocale) {
      return canonicalLocale;
    }
  } catch {
    // Fallthrough to the language code when canonicalization fails.
  }

  return languageOnly;
};

/**
 * The buyer's browser locale (e.g. "ja-JP"), or undefined outside a browser.
 *
 * Used as the default `selectedLocale` for the checkout entry points so the
 * checkout UI and the lifecycle emails render in the buyer's language with no
 * extra configuration - the same behaviour the paywall flow already has. Pass
 * `selectedLocale` explicitly to override.
 */
export const getBrowserLocale = (): string | undefined =>
  getNullableWindow()?.navigator?.language;
