import { describe, expect, test } from "vitest";
import type { BrandingAppearance } from "../../entities/branding";
import { applyAlpha, toFormColors } from "../../ui/theme/utils";

const brandingAppearanceWithPrimaryColor = (
  color_buttons_primary: string,
): BrandingAppearance => ({
  color_buttons_primary,
  color_accent: "#767676",
  color_error: "#B0171F",
  color_product_info_bg: "#EFF3FA",
  color_form_bg: "#FFFFFF",
  color_page_bg: "#FFFFFF",
  font: "default",
  shapes: "default",
  show_product_description: true,
});

describe("overlayColor", () => {
  test("applies black overlay for a light color", () => {
    expect(applyAlpha("#FFFFFF", 0.1)).toBe("#E6E6E6"); // 10% black overlay on white
  });

  test("applies white overlay for a dark color", () => {
    expect(applyAlpha("#000000", 0.1)).toBe("#1A1A1A"); // 10% white overlay on black
  });

  test("applies correct overlay for a mid-tone color", () => {
    expect(applyAlpha("#888888", 0.15)).toBe("#9A9A9A"); // 15% lighter grey
  });

  test("returns same color if alpha is 0", () => {
    expect(applyAlpha("#123456", 0)).toBe("#123456");
  });

  test("returns full overlay color if alpha is 1", () => {
    expect(applyAlpha("#123456", 1)).toBe("#FFFFFF"); // White overlay completely replaces dark color
  });

  test("handles incorrect hex input gracefully", () => {
    expect(applyAlpha("invalid", 0.5)).toBe("#808080"); // Should fall back to neutral gray
  });

  test("handles incorrect alpha input gracefully", () => {
    expect(applyAlpha("#FFFFFF", -4)).toBe("#FFFFFF");
  });
});

describe("toFormColors", () => {
  test("uses black primary text for white buttons", () => {
    expect(
      toFormColors(brandingAppearanceWithPrimaryColor("#FFFFFF"))[
        "primary-text"
      ],
    ).toBe("black");
  });

  test("uses white primary text for black buttons", () => {
    expect(
      toFormColors(brandingAppearanceWithPrimaryColor("#000000"))[
        "primary-text"
      ],
    ).toBe("white");
  });

  test("uses black primary text for mid-tone buttons when contrast is higher", () => {
    expect(
      toFormColors(brandingAppearanceWithPrimaryColor("#888888"))[
        "primary-text"
      ],
    ).toBe("black");
  });

  test("keeps white primary text for the default primary color", () => {
    expect(
      toFormColors(brandingAppearanceWithPrimaryColor("#576CDB"))[
        "primary-text"
      ],
    ).toBe("white");
  });

  test("falls back to the default primary text for invalid primary colors", () => {
    expect(
      toFormColors(brandingAppearanceWithPrimaryColor("#GGGGGG"))[
        "primary-text"
      ],
    ).toBe("#ffffff");
  });

  test("expands shorthand hex colors before calculating contrast", () => {
    expect(
      toFormColors(brandingAppearanceWithPrimaryColor("#FFF"))["primary-text"],
    ).toBe("black");
  });
});
