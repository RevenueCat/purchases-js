import type { BrandingAppearance } from "src/networking/responses/branding-response";
import { writable } from "svelte/store";

export const DEFAULT_STORE_VALUES: BrandingAppearance = {
  color_buttons_primary: "",
  color_accent: "",
  color_error: "",
  color_product_info_bg: "",
  color_form_bg: "",
  color_page_bg: "",
  font: "",
  shapes: "default",
  show_product_description: false,
};

// Store to hold appearance configuration object for custom overrides
export const appearanceConfigStore =
  writable<BrandingAppearance>(DEFAULT_STORE_VALUES);
