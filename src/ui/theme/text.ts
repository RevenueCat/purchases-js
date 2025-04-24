/**
 * All text styles get translated into --rc-text-<property_name> CSS variables.
 * i.e., --rc-text-title1-font-size or --rc-text-title1-line-height
 */

export interface TextStyle {
  fontSize: string;
  lineHeight: string;
  fontWeight: string;
  letterSpacing?: string;
}

export type ScreenType = "mobile" | "desktop";

export type ScreenTextStyle = Record<TextStyleKey, TextStyle>;

export type TextStyleKey =
  | "heading2xl"
  | "headingXl"
  | "headingLg"
  | "headingMd"
  | "bodyBase"
  | "bodySmall"
  | "labelButton"
  | "labelDefault"
  | "captionDefault"
  | "captionLink";

export type TextStyles = Record<
  TextStyleKey,
  {
    mobile: TextStyle;
    desktop: TextStyle;
  }
>;

export const DEFAULT_FONT_FAMILY =
  "-apple-system, BlinkMacSystemFont, avenir next, avenir, segoe ui, helvetica neue, helvetica, Cantarell, Ubuntu, roboto, noto, arial, sans-serif";

const FONT_WEIGHTS = {
  regular: "400",
  medium: "500",
  semibold: "600",
};

const FONT_SIZES = {
  "10": "10px",
  "12": "12px",
  "14": "14px",
  "16": "16px",
  "18": "18px",
  "20": "20px",
  "24": "24px",
  "28": "28px",
  "32": "32px",
  "36": "36px",
  "40": "40px",
};

const LINE_HEIGHTS = {
  "120": "120%",
  "130": "130%",
  "140": "140%",
};

const LETTER_SPACING = {
  tight: "0.20%",
  regular: "0",
  loose: "0.20%",
};

const MOBILE_TEXT_STYLES: ScreenTextStyle = {
  heading2xl: {
    fontSize: FONT_SIZES["28"],
    lineHeight: LINE_HEIGHTS["130"],
    fontWeight: FONT_WEIGHTS["semibold"],
    letterSpacing: LETTER_SPACING["loose"],
  },
  headingXl: {
    fontSize: FONT_SIZES["24"],
    lineHeight: LINE_HEIGHTS["130"],
    fontWeight: FONT_WEIGHTS["semibold"],
    letterSpacing: LETTER_SPACING["loose"],
  },
  headingLg: {
    fontSize: "20px",
    lineHeight: LINE_HEIGHTS["130"],
    fontWeight: FONT_WEIGHTS["semibold"],
    letterSpacing: LETTER_SPACING["loose"],
  },
  headingMd: {
    fontSize: "16px",
    lineHeight: LINE_HEIGHTS["140"],
    fontWeight: FONT_WEIGHTS["medium"],
    letterSpacing: LETTER_SPACING["regular"],
  },
  bodyBase: {
    fontSize: FONT_SIZES["16"],
    lineHeight: LINE_HEIGHTS["140"],
    fontWeight: FONT_WEIGHTS["regular"],
    letterSpacing: LETTER_SPACING["regular"],
  },
  bodySmall: {
    fontSize: FONT_SIZES["14"],
    lineHeight: LINE_HEIGHTS["140"],
    fontWeight: FONT_WEIGHTS["regular"],
    letterSpacing: LETTER_SPACING["regular"],
  },
  labelButton: {
    fontSize: FONT_SIZES["16"],
    lineHeight: LINE_HEIGHTS["140"],
    fontWeight: FONT_WEIGHTS["semibold"],
    letterSpacing: LETTER_SPACING["tight"],
  },
  labelDefault: {
    fontSize: FONT_SIZES["14"],
    lineHeight: LINE_HEIGHTS["140"],
    fontWeight: FONT_WEIGHTS["regular"],
    letterSpacing: LETTER_SPACING["tight"],
  },
  captionDefault: {
    fontSize: FONT_SIZES["12"],
    lineHeight: LINE_HEIGHTS["140"],
    fontWeight: FONT_WEIGHTS["regular"],
    letterSpacing: LETTER_SPACING["regular"],
  },
  captionLink: {
    fontSize: FONT_SIZES["12"],
    lineHeight: LINE_HEIGHTS["140"],
    fontWeight: FONT_WEIGHTS["regular"],
    letterSpacing: LETTER_SPACING["regular"],
  },
};

const DESKTOP_TEXT_STYLES: ScreenTextStyle = {
  heading2xl: {
    ...MOBILE_TEXT_STYLES.heading2xl,
    fontSize: FONT_SIZES["36"],
  },
  headingXl: {
    ...MOBILE_TEXT_STYLES.headingXl,
    fontSize: FONT_SIZES["32"],
  },
  headingLg: {
    ...MOBILE_TEXT_STYLES.headingLg,
    fontSize: FONT_SIZES["24"],
  },
  headingMd: {
    ...MOBILE_TEXT_STYLES.headingMd,
    fontSize: FONT_SIZES["18"],
  },
  bodyBase: {
    ...MOBILE_TEXT_STYLES.bodyBase,
  },
  bodySmall: {
    ...MOBILE_TEXT_STYLES.bodySmall,
  },
  labelButton: {
    ...MOBILE_TEXT_STYLES.labelButton,
  },
  labelDefault: {
    ...MOBILE_TEXT_STYLES.labelDefault,
  },
  captionDefault: {
    ...MOBILE_TEXT_STYLES.captionDefault,
  },
  captionLink: {
    ...MOBILE_TEXT_STYLES.captionLink,
  },
};

export const DEFAULT_TEXT_STYLES: TextStyles = {
  heading2xl: {
    mobile: MOBILE_TEXT_STYLES.heading2xl,
    desktop: DESKTOP_TEXT_STYLES.heading2xl,
  },
  headingXl: {
    desktop: DESKTOP_TEXT_STYLES.heading2xl,
    mobile: MOBILE_TEXT_STYLES.heading2xl,
  },
  headingLg: {
    desktop: DESKTOP_TEXT_STYLES.headingLg,
    mobile: MOBILE_TEXT_STYLES.headingLg,
  },
  headingMd: {
    desktop: DESKTOP_TEXT_STYLES.headingMd,
    mobile: MOBILE_TEXT_STYLES.headingMd,
  },
  bodyBase: {
    desktop: DESKTOP_TEXT_STYLES.bodyBase,
    mobile: MOBILE_TEXT_STYLES.bodyBase,
  },
  bodySmall: {
    desktop: DESKTOP_TEXT_STYLES.bodySmall,
    mobile: MOBILE_TEXT_STYLES.bodySmall,
  },
  labelButton: {
    desktop: DESKTOP_TEXT_STYLES.labelButton,
    mobile: MOBILE_TEXT_STYLES.labelButton,
  },
  labelDefault: {
    desktop: DESKTOP_TEXT_STYLES.labelDefault,
    mobile: MOBILE_TEXT_STYLES.labelDefault,
  },
  captionDefault: {
    desktop: DESKTOP_TEXT_STYLES.captionDefault,
    mobile: MOBILE_TEXT_STYLES.captionDefault,
  },
  captionLink: {
    desktop: DESKTOP_TEXT_STYLES.captionLink,
    mobile: MOBILE_TEXT_STYLES.captionLink,
  },
};
