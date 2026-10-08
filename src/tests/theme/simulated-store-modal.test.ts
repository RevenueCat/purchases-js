import { describe, expect, test } from "vitest";
import type { BrandingAppearance } from "../../entities/branding";
import { toSimulatedStoreModalStyleVars } from "../../ui/theme/simulated-store-modal";

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

const parseStyleVars = (styleVars: string): Record<string, string> =>
  Object.fromEntries(
    styleVars.split("; ").map((declaration) => {
      const [name, value] = declaration.split(": ");
      return [name, value];
    }),
  );

describe("toSimulatedStoreModalStyleVars", () => {
  test("returns no variables without an appearance", () => {
    expect(toSimulatedStoreModalStyleVars(null)).toBe("");
    expect(toSimulatedStoreModalStyleVars(undefined)).toBe("");
  });

  test("maps the appearance onto the modal variables with readable text colors", () => {
    expect(
      parseStyleVars(toSimulatedStoreModalStyleVars(appearance)),
    ).toMatchObject({
      "--rc-simulated-store-card-bg": "#FFFFFF",
      "--rc-simulated-store-card-text": "rgb(0,0,0)",
      "--rc-simulated-store-details-bg": "#114AB8",
      "--rc-simulated-store-details-text": "rgb(255,255,255)",
      "--rc-simulated-store-primary": "#000000",
      "--rc-simulated-store-primary-text": "white",
      "--rc-simulated-store-error": "#E61054",
      "--rc-simulated-store-button-radius": "9999px",
      "--rc-simulated-store-details-radius": "12px",
    });
  });
});
