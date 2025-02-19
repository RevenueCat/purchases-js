/**
 * @public
 * `BrandingAppearance` defines the appearance settings
 *  of an app's branding configuration.
 */
export interface BrandingAppearance {
  color_buttons_primary: string;
  color_accent: string;
  color_error: string;
  color_product_info_bg: string;
  color_form_bg: string;
  color_page_bg: string;
  font: string;
  shapes: "default" | "rectangle" | "rounded" | "pill";
  show_product_description: boolean;
}
