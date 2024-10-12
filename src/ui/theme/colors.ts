import { BrandingAppearance } from "../../networking/responses/branding-response";

export const DEFAULT_COLORS: Record<string, string> = {
  error: "#f2545b",
  warning: "#f4e971",
  focus: "#000080",
  "grey-text-dark": "#000000",
  "grey-text-light": "#767676",
  "grey-ui-dark": "#dfdfdf",
  white: "#ffffff",
  "background-dark": "#000000",
  "background-light": "#ffffff",
  "text-dark": "#000000",
  "text-light": "#ffffff",
  "input-background": "transparent",
};

const hexToRGB = (color: string) => {
  if (color.length == 7)
    return [
      parseInt(color.slice(1, 3), 16),
      parseInt(color.slice(3, 5), 16),
      parseInt(color.slice(5, 7), 16),
    ];
  if (color.length == 4)
    return [
      parseInt(color[1], 16),
      parseInt(color[2], 16),
      parseInt(color[3], 16),
    ];
  return null;
};

const textColorForBackground = (color: string) => {
  if (!color) {
    return null;
  }
  if (color.startsWith("#")) {
    const rgb = hexToRGB(color);
    if (rgb == null) {
      return null;
    }
    const [r, g, b] = rgb;
    const sum = r + g + b;
    if (sum < 3 * 128) {
      return "white";
    }
    return "black";
  }
  return null;
};

const fallback = (somethingNullable: any | null, defaultValue: any) => {
  if (!somethingNullable) {
    return defaultValue;
  }
  return somethingNullable;
};

export const toColors = (
  brandingAppearance?: BrandingAppearance | undefined,
) => {
  return brandingAppearance
    ? {
        ...DEFAULT_COLORS,
        error: brandingAppearance.color_error,
        focus: brandingAppearance.color_accent,
        "background-dark": fallback(
          brandingAppearance.color_product_info_bg,
          DEFAULT_COLORS["background-dark"],
        ),
        "background-light": fallback(
          brandingAppearance.color_form_bg,
          DEFAULT_COLORS["background-light"],
        ),
        "text-dark": fallback(
          textColorForBackground(brandingAppearance.color_form_bg),
          DEFAULT_COLORS["text-dark"],
        ),
        "text-light": fallback(
          textColorForBackground(brandingAppearance.color_product_info_bg),
          DEFAULT_COLORS["text-light"],
        ),
      }
    : { ...DEFAULT_COLORS }; //copy, do not reference.
};

export const toColorsStyleVar = (colors: Record<string, string>) => {
  return Object.entries(colors)
    .map(([key, value]) => `--rc-color-${key}: ${value}`)
    .join("; ");
};
