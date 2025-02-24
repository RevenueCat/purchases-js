import type { BrandingAppearance } from "../../entities/branding";

/**
 * All those colors get translated in --rc-color-<property_name> css variables.
 * i.e. --rc-color-error or --rc-color-input-background
 */
export interface Colors {
  error: string;
  warning: string;
  focus: string;
  accent: string;
  primary: string;
  "primary-hover": string;
  "primary-pressed": string;
  "primary-text": string;
  white: string;
  "grey-text-dark": string;
  "grey-text-light": string;
  "grey-ui-dark": string;
  "grey-ui-light": string;
  "input-background": string;
  background: string;
}

export const DEFAULT_FORM_COLORS: Colors = {
  error: "#f2545b",
  warning: "#f4e971",
  focus: "#1148B8",
  accent: "#767676",
  primary: "#576CDB",
  "primary-hover": "rgba(87, 108, 219, .8)",
  "primary-pressed": "rgba(87, 108, 219, .9)",
  "primary-text": "#ffffff",
  white: "#ffffff",
  "grey-text-dark": "rgba(0,0,0,1)",
  "grey-text-light": "rgba(0,0,0,0.5)",
  "grey-ui-dark": "rgba(0,0,0,0.3)",
  "grey-ui-light": "rgba(0,0,0,0.005)",
  "input-background": "white",
  background: "white",
};

export const DEFAULT_INFO_COLORS: Colors = {
  error: "#f2545b",
  warning: "#f4e971",
  focus: "#1148B8",
  accent: "#767676",
  primary: "#576CDB",
  "primary-hover": "rgba(87, 108, 219, .8)",
  "primary-pressed": "rgba(87, 108, 219, .9)",
  "primary-text": "#ffffff",
  white: "#ffffff",
  "grey-text-dark": "rgba(0,0,0,1)",
  "grey-text-light": "rgba(0,0,0,0.5)",
  "grey-ui-dark": "rgba(0,0,0,0.25)",
  "grey-ui-light": "rgba(0,0,0,0.005)",
  "input-background": "white",
  background: "#EFF3FA",
};

/**
 * Mappings from the colors defined above and the colors downloaded from the BrandingAppearance.
 * Bear in mind that font colors are calculated dynamically given the resulting background color.
 */
export const ColorsToBrandingAppearanceMapping: Record<
  string,
  keyof BrandingAppearance
> = {
  error: "color_error",
  focus: "color_accent",
  accent: "color_accent",
  primary: "color_buttons_primary",
};

export const FormColorsToBrandingAppearanceMapping = {
  ...ColorsToBrandingAppearanceMapping,
  "input-background": "color_form_bg",
  background: "color_form_bg",
};

export const InfoColorsToBrandingAppearanceMapping = {
  ...ColorsToBrandingAppearanceMapping,
  "input-background": "color_product_info_bg",
  background: "color_product_info_bg",
};
