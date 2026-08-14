import type { BrandingAppearance } from "@revenuecat/purchases-js";

export const configuredAppearanceOverride = {
  color_buttons_primary: "#9c4eff",
  color_buttons_primary_text: "#ffffff",
  color_accent: "#9c4eff",
  color_error: "#d94a4a",
  color_product_info_bg: "#d8b9ff",
  color_form_bg: "#ffffff",
  color_page_bg: "#f5f5f5",
  shapes: "rounded",
} satisfies Partial<BrandingAppearance>;

export const operationAppearanceOverride = {
  color_buttons_primary: "#b4fab7",
  color_buttons_primary_text: "#000000",
  color_accent: "#9c4eff",
  color_error: "#d94a4a",
  color_product_info_bg: "#ffcdc2",
  color_form_bg: "#ffffff",
  color_page_bg: "#f5f5f5",
  shapes: "pill",
} satisfies Partial<BrandingAppearance>;
