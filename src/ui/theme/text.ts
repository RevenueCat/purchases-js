/**
 * All text styles get translated into --rc-text-<property_name> CSS variables.
 * i.e., --rc-text-title1-font-size or --rc-text-title1-line-height
 */

interface TextStyle {
  fontSize: string;
  lineHeight: string;
  fontWeight: string;
}

export interface TextStyles {
  [key: string]: {
    mobile: TextStyle;
    desktop: TextStyle;
  };
}

export const DEFAULT_FONT_FAMILY =
  "-apple-system, BlinkMacSystemFont, avenir next, avenir, segoe ui, helvetica neue, helvetica, Cantarell, Ubuntu, roboto, noto, arial, sans-serif";

export const DEFAULT_TEXT_STYLES: TextStyles = {
  titleXXLarge: {
    desktop: { fontSize: "32px", lineHeight: "140%", fontWeight: "500" },
    mobile: { fontSize: "28px", lineHeight: "140%", fontWeight: "500" },
  },
  titleXLarge: {
    desktop: { fontSize: "36px", lineHeight: "140%", fontWeight: "500" },
    mobile: { fontSize: "24px", lineHeight: "140%", fontWeight: "500" },
  },
  titleLarge: {
    desktop: { fontSize: "28px", lineHeight: "140%", fontWeight: "500" },
    mobile: { fontSize: "20px", lineHeight: "140%", fontWeight: "500" },
  },
  titleMedium: {
    desktop: { fontSize: "24px", lineHeight: "140%", fontWeight: "500" },
    mobile: { fontSize: "17px", lineHeight: "140%", fontWeight: "500" },
  },
  // sm font on figma
  body1: {
    desktop: { fontSize: "16px", lineHeight: "140%", fontWeight: "400" },
    mobile: { fontSize: "16px", lineHeight: "140%", fontWeight: "400" },
  },
  caption: {
    desktop: { fontSize: "14px", lineHeight: "140%", fontWeight: "400" },
    mobile: { fontSize: "12px", lineHeight: "140%", fontWeight: "400" },
  },
};
