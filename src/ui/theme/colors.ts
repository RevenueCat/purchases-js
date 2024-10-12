import { BrandingAppearance } from "../../networking/responses/branding-response";

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
  focus: "#576CDB",
  accent: "#576CDB",
  primary: "#000000",
  white: "#ffffff",
  "grey-text-dark": "rgba(0,0,0,1)",
  "grey-text-light": "rgba(0,0,0,0.5)",
  "grey-ui-dark": "rgba(0,0,0,0.125)",
  "grey-ui-light": "rgba(0,0,0,0.005)",
  "input-background": "transparent",
  background: "white",
};

export const DEFAULT_INFO_COLORS: Colors = {
  error: "#f2545b",
  warning: "#f4e971",
  focus: "#576CDB",
  accent: "#576CDB",
  primary: "#ffffff",
  white: "#ffffff",
  "grey-text-dark": "rgba(255,255,255,1)",
  "grey-text-light": "rgba(255,255,255,0.5)",
  "grey-ui-dark": "rgba(255,255,255,0.125)",
  "grey-ui-light": "rgba(255,255,255,0.005)",
  "input-background": "transparent",
  background: "#000000",
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
  background: "color_form_bg",
};

export const InfoColorsToBrandingAppearanceMapping = {
  ...ColorsToBrandingAppearanceMapping,
  background: "color_product_info_bg",
};
