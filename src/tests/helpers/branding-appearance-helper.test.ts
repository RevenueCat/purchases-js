import { describe, expect, test } from "vitest";
import type { BrandingInfoResponse } from "../../networking/responses/branding-response";
import {
  applyBrandingAppearanceOverride,
  mergeBrandingAppearanceOverrides,
} from "../../helpers/branding-appearance-helper";

const brandingInfo: BrandingInfoResponse = {
  id: "test-branding-id",
  app_name: "Test App",
  app_icon: null,
  app_icon_webp: null,
  app_wordmark: null,
  app_wordmark_webp: null,
  appearance: {
    color_buttons_primary: "#000000",
    color_accent: "#111111",
    color_error: "#222222",
    color_product_info_bg: "#333333",
    color_form_bg: "#444444",
    color_page_bg: "#555555",
    font: "sans-serif",
    shapes: "rounded",
    show_product_description: true,
  },
  gateway_tax_collection_enabled: false,
  brand_font_config: null,
};

describe("applyBrandingAppearanceOverride", () => {
  test("merges partial values without changing the cached branding", () => {
    const result = applyBrandingAppearanceOverride(brandingInfo, {
      color_buttons_primary: "#ffffff",
      color_page_bg: "#101010",
    });

    expect(result?.appearance).toEqual({
      ...brandingInfo.appearance,
      color_buttons_primary: "#ffffff",
      color_page_bg: "#101010",
    });
    expect(brandingInfo.appearance?.color_buttons_primary).toBe("#000000");
    expect(brandingInfo.appearance?.color_page_bg).toBe("#555555");
  });

  test("returns the cached branding unchanged when no override is provided", () => {
    expect(applyBrandingAppearanceOverride(brandingInfo)).toBe(brandingInfo);
  });
});

describe("mergeBrandingAppearanceOverrides", () => {
  test("uses per-purchase values over configured values", () => {
    expect(
      mergeBrandingAppearanceOverrides(
        {
          color_buttons_primary: "#000000",
          color_page_bg: "#111111",
        },
        {
          color_page_bg: "#ffffff",
          shapes: "pill",
        },
      ),
    ).toEqual({
      color_buttons_primary: "#000000",
      color_page_bg: "#ffffff",
      shapes: "pill",
    });
  });
});
