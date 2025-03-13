export const brandingLanguageViewportModes = {
  "mobile-en-default": {
    name: "Mobile / English / Default",
    viewport: "mobile",
    brandingName: "None",
    locale: "en",
  },
  "tablet-en-default": {
    name: "Tablet / English / Default",
    viewport: "tablet",
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
  "tablet-fr-igify": {
    name: "Tablet / French / Igify",
    viewport: "tablet",
    brandingName: "Igify",
    locale: "fr",
  },
  "desktop-fr-igify": {
    name: "Desktop / French / Igify",
    viewport: "desktop",
    brandingName: "Igify",
    locale: "fr",
  },
  "embedded-fr-igify": {
    name: "Embedded / French / Igify",
    viewport: "embedded",
    brandingName: "Igify",
    locale: "fr",
  },
  "mobile-ar-dipsea": {
    name: "Mobile / Arabic / Dipsea",
    viewport: "mobile",
    brandingName: "Dipsea",
    locale: "ar",
  },
  "tablet-ar-dipsea": {
    name: "Tablet / Arabic / Dipsea",
    viewport: "tablet",
    brandingName: "Dipsea",
    locale: "ar",
  },
  "desktop-ar-dipsea": {
    name: "Desktop / Arabic / Dipsea",
    viewport: "desktop",
    brandingName: "Dipsea",
    locale: "ar",
  },
  "embedded-ar-dipsea": {
    name: "Embedded / Arabic / Dipsea",
    viewport: "embedded",
    brandingName: "Dipsea",
    locale: "ar",
  },
};

export const brandingModes = {
  "mobile-en-default": brandingLanguageViewportModes["mobile-en-default"],
  "mobile-fr-igify": brandingLanguageViewportModes["mobile-fr-igify"],
  "mobile-ar-dipsea": brandingLanguageViewportModes["mobile-ar-dipsea"],
};

export const allModes = {
  ...brandingLanguageViewportModes,
};
