export const brandingLanguageViewportModes = {
  "mobile-en-default": {
    name: "Mobile / English / Default",
    viewport: "mobile",
    brandingName: "None",
    locale: "en",
  },
  "desktop-en-default": {
    name: "Desktop / English / Default",
    viewport: "desktop",
    brandingName: "None",
    locale: "en",
  },
  "embedded-en-default": {
    name: "Embedded / English / Default",
    viewport: "embedded",
    brandingName: "None",
    locale: "en",
  },
  "mobile-fr-igify": {
    name: "Mobile / French / Igify",
    viewport: "mobile",
    brandingName: "Igify",
    locale: "fr",
  },
  "desktop-fr-igify": {
    name: "Desktop / French / Igify",
    viewport: "desktop",
    brandingName: "Igify",
    locale: "fr",
  },
};

export const brandingModes = {
  "mobile-en-default": brandingLanguageViewportModes["mobile-en-default"],
  "mobile-fr-igify": brandingLanguageViewportModes["mobile-fr-igify"],
};

export const mobileAndDesktopBrandingModes = {
  "mobile-en-default": brandingLanguageViewportModes["mobile-en-default"],
  "mobile-fr-igify": brandingLanguageViewportModes["mobile-fr-igify"],
  "desktop-en-default": brandingLanguageViewportModes["desktop-en-default"],
  "desktop-fr-igify": brandingLanguageViewportModes["desktop-fr-igify"],
};

export const allModes = {
  ...brandingLanguageViewportModes,
};
