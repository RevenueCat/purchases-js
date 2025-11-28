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
