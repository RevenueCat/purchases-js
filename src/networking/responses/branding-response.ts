/**
 * `BrandingAppearance` defines the appearance settings
 *  of an app's branding configuration.
 * @internal
 */
export type BrandingAppearance = {
  color_buttons_primary: string;
  color_accent: string;
  color_error: string;
  color_product_info_bg: string;
  color_form_bg: string;
  color_page_bg: string;
  font: string;
  shapes: "default" | "rectangle" | "rounded" | "pill";
  show_product_description: boolean;
};

export type BrandingInfoResponse = {
  app_icon: string | null;
  app_icon_webp: string | null;
  appearance: BrandingAppearance;
  id: string;
  app_name: string | null;
  support_email?: string | null;
};
