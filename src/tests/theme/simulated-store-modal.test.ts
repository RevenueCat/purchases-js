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

  test("maps the appearance onto the modal variables", () => {
    const vars = parseStyleVars(toSimulatedStoreModalStyleVars(appearance));

    expect(vars["--rc-simulated-store-card-bg"]).toBe("#FFFFFF");
    expect(vars["--rc-simulated-store-details-bg"]).toBe("#114AB8");
    expect(vars["--rc-simulated-store-primary"]).toBe("#000000");
    expect(vars["--rc-simulated-store-primary-text"]).toBe("white");
    expect(vars["--rc-simulated-store-error"]).toBe("#E61054");
    expect(vars["--rc-simulated-store-button-radius"]).toBe("9999px");
    expect(vars["--rc-simulated-store-details-radius"]).toBe("12px");
  });

  test("picks readable text colors for the details background", () => {
    const vars = parseStyleVars(toSimulatedStoreModalStyleVars(appearance));

    expect(vars["--rc-simulated-store-details-text"]).toBe("rgb(255,255,255)");
    expect(vars["--rc-simulated-store-card-text"]).toBe("rgb(0,0,0)");
  });
});
