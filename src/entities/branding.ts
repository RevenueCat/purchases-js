/**
 * @public
 * `BrandingAppearance` defines the appearance settings
 *  of an app's branding configuration.
 */
export interface BrandingAppearance {
  color_buttons_primary: string;
  color_buttons_primary_text?: string | null;
  color_accent: string;
  color_error: string;
  color_product_info_bg: string;
  color_form_bg: string;
  color_page_bg: string;
  font: string;
  shapes: "default" | "rectangle" | "rounded" | "pill";
  show_product_description: boolean;
}

/** @internal */
export const DEFAULT_BRANDING_APPEARANCE: BrandingAppearance = {
  color_buttons_primary: "#576CDB",
  color_buttons_primary_text: null,
  color_accent: "#1148B8",
  color_error: "#B0171F",
  color_product_info_bg: "#EFF3FA",
  color_form_bg: "#FFFFFF",
  color_page_bg: "#EFF3FA",
  font: "default",
  shapes: "default",
  show_product_description: false,
};
