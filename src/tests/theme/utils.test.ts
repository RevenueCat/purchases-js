import { describe, expect, test } from "vitest";
import type { BrandingAppearance } from "../../entities/branding";
import {
  applyAlpha,
  isHexColorLight,
  toFormColors,
} from "../../ui/theme/utils";

const brandingAppearanceWithPrimaryColor = (
  color_buttons_primary: string,
  color_buttons_primary_text?: string | null,
): BrandingAppearance => ({
  color_buttons_primary,
  color_buttons_primary_text,
  color_accent: "#767676",
  color_error: "#B0171F",
  color_product_info_bg: "#EFF3FA",
  color_form_bg: "#FFFFFF",
  color_page_bg: "#FFFFFF",
  font: "default",
  shapes: "default",
  show_product_description: true,
});

describe("isHexColorLight", () => {
  test("returns true for light colors", () => {
    expect(isHexColorLight("#ffffff")).toBe(true);
    expect(isHexColorLight("#EFF3FA")).toBe(true);
  });

  test("returns false for dark colors", () => {
    expect(isHexColorLight("#000000")).toBe(false);
    expect(isHexColorLight("#1a1a2e")).toBe(false);
  });

  test("falls back to light for unparseable colors", () => {
    expect(isHexColorLight("transparent")).toBe(true);
    expect(isHexColorLight("")).toBe(true);
  });
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
  test("uses the primary text override when present", () => {
    expect(
      toFormColors(brandingAppearanceWithPrimaryColor("#13C892", "#FFFFFF"))[
        "primary-text"
      ],
    ).toBe("#FFFFFF");
  });

  test("uses automatic primary text color when primary text override is null", () => {
    expect(
      toFormColors(brandingAppearanceWithPrimaryColor("#13C892", null))[
        "primary-text"
      ],
    ).toBe("black");
  });
});
