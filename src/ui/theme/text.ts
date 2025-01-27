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

export const DEFAULT_FONT_FAMILY = `"PP Object Sans", system-ui, Avenir, Helvetica, Arial, sans-serif`;

/*
 * Font weights as per: https://pangrampangram.com/products/object-sans
 * Thin 140
 * Light 215
 * Regular 315
 * Medium 430
 * Semibold 500
 * Bold 570
 * Heavy 730
 * Black 900
 */
export const DEFAULT_TEXT_STYLES: TextStyles = {
  title1: {
    desktop: { fontSize: "32px", lineHeight: "40px", fontWeight: "500" },
    mobile: { fontSize: "28px", lineHeight: "34px", fontWeight: "500" },
  },
  title2: {
    desktop: { fontSize: "24px", lineHeight: "28px", fontWeight: "500" },
    mobile: { fontSize: "24px", lineHeight: "28px", fontWeight: "500" },
  },
  title3: {
    desktop: { fontSize: "22px", lineHeight: "28px", fontWeight: "500" },
    mobile: { fontSize: "19px", lineHeight: "25px", fontWeight: "500" },
  },
  title4: {
    desktop: { fontSize: "18px", lineHeight: "24px", fontWeight: "500" },
    mobile: { fontSize: "16px", lineHeight: "auto", fontWeight: "500" },
  },
  body1: {
    desktop: { fontSize: "16px", lineHeight: "150%", fontWeight: "400" },
    mobile: { fontSize: "14px", lineHeight: "140%", fontWeight: "315" },
  },
  body2: {
    desktop: { fontSize: "17px", lineHeight: "150%", fontWeight: "400" },
    mobile: { fontSize: "15px", lineHeight: "140%", fontWeight: "315" },
  },
  caption: {
    desktop: { fontSize: "14px", lineHeight: "150%", fontWeight: "400" },
    mobile: { fontSize: "12px", lineHeight: "140%", fontWeight: "315" },
  },
};
