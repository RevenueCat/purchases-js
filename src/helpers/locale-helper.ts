/**
 * The bare language subtag of a locale, lowercased: `en_US`, `en-US` and `EN`
 * all become `en`. Mirrors the fallback `Translator` uses to resolve a locale
 * with a region to its language's translations, so callers that branch on a
 * language match agree with the strings they will actually get back.
 */
export const toLanguageCode = (locale: string): string =>
  locale.split("_")[0].split("-")[0].toLowerCase();

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
