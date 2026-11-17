import { describe, expect, test } from "vitest";
import type { BrandingAppearance } from "../../entities/branding";
import { toPayrailsDropinAppearance } from "../../ui/theme/payrails-dropin";
import { DEFAULT_FORM_COLORS } from "../../ui/theme/colors";
import { RoundedShape } from "../../ui/theme/shapes";

const BRANDING_TEXT_SELECTOR =
  ".payrails-branding-header .payrails-label, .payrails-branding-footer .payrails-text";

const appearance: BrandingAppearance = {
  color_buttons_primary: "#000000",
  color_accent: "#969696",
  color_error: "#E61054",
  color_product_info_bg: "#114AB8",
  color_form_bg: "#FFFFFF",
  color_page_bg: "#114AB8",
  font: "default",
  shapes: "pill",
  show_product_description: true,
};

describe("toPayrailsDropinAppearance", () => {
  test("maps the appearance onto the drop-in button, branding text and card form rules", () => {
    expect(toPayrailsDropinAppearance(appearance)).toEqual({
      rules: {
        ".payrails-button": {
          backgroundColor: "#000000",
          color: "white",
          borderRadius: "9999px",
        },
        ".payrails-button:hover": { backgroundColor: "#1A1A1A" },
        ".payrails-label": { color: "rgba(0,0,0,1)" },
        [BRANDING_TEXT_SELECTOR]: { color: "rgba(0,0,0,0.70)" },
      },
      cardForm: {
        rules: {
          ".payrails-input": { borderRadius: "12px" },
          ".payrails-input:focus": { borderColor: "#969696", outline: "none" },
          ".payrails-input--dirty:not(:focus).payrails-input--invalid": {
            borderColor: "#E61054",
          },
          ".payrails-error": { color: "#E61054" },
        },
      },
    });
  });

  test("keeps labels and card inputs readable on Payrails' white surface and lightens branding text on a dark form", () => {
    const result = toPayrailsDropinAppearance({
      ...appearance,
      color_form_bg: "#000000",
      color_buttons_primary_text: "#FFCC00",
    });

    expect(result.rules?.[".payrails-button"]).toMatchObject({
      color: "#FFCC00",
    });
    expect(result.rules?.[".payrails-label"]).toEqual({
      color: "rgba(0,0,0,1)",
    });
    expect(result.rules?.[BRANDING_TEXT_SELECTOR]).toEqual({
      color: "rgba(255,255,255,0.70)",
    });
    expect(result.cardForm?.rules?.[".payrails-input"]).toEqual({
      borderRadius: "12px",
    });
  });

  test.each([
    ["default", "4px", "8px"],
    ["rounded", "4px", "8px"],
    ["rectangle", "0px", "0px"],
    ["pill", "12px", "9999px"],
  ] as const)(
    "maps the %s shape onto input and button radii",
    (shapes, inputRadius, buttonRadius) => {
      const result = toPayrailsDropinAppearance({ ...appearance, shapes });

      expect(result.rules?.[".payrails-button"]).toMatchObject({
        borderRadius: buttonRadius,
      });
      expect(result.cardForm?.rules?.[".payrails-input"]).toEqual({
        borderRadius: inputRadius,
      });
    },
  );

  test("falls back to the default form colors and shape without an appearance", () => {
    const result = toPayrailsDropinAppearance(null);

    expect(result.rules?.[".payrails-button"]).toEqual({
      backgroundColor: DEFAULT_FORM_COLORS.primary,
      color: DEFAULT_FORM_COLORS["primary-text"],
      borderRadius: RoundedShape["input-button-border-radius"],
    });
    expect(result.rules?.[BRANDING_TEXT_SELECTOR]).toEqual({
      color: DEFAULT_FORM_COLORS["grey-text-light"],
    });
    expect(result.cardForm?.rules?.[".payrails-input"]).toEqual({
      borderRadius: RoundedShape["input-border-radius"],
    });
  });
});
