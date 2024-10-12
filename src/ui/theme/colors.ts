import { BrandingAppearance } from "../../networking/responses/branding-response";

export const DEFAULT_FORM_COLORS: Record<string, string> = {
  error: "#f2545b",
  warning: "#f4e971",
  focus: "#576CDB",
  accent: "#576CDB",
  primary: "#000000",
  white: "#ffffff",
  "grey-text-dark": "rgba(0,0,0,1)",
  "grey-text-light": "rgba(0,0,0,0.5)",
  "grey-ui-dark": "#dfdfdf",
  "grey-ui-light": "rgba(0,0,0,0.125)",
  "input-background": "transparent",
  background: "white",
};

export const DEFAULT_INFO_COLORS: Record<string, string> = {
  error: "#f2545b",
  warning: "#f4e971",
  focus: "#576CDB",
  accent: "#576CDB",
  primary: "#ffffff",
  white: "#ffffff",
  "grey-text-dark": "rgba(255,255,255,1)",
  "grey-text-light": "rgba(255,255,255,0.5)",
  "grey-ui-dark": "rgba(255,255,255,1)",
  "grey-ui-light": "rgba(255,255,255,0.125)",
  "input-background": "transparent",
  background: "#000000",
};

const hexToRGB = (color: string): [number, number, number] | null => {
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

const rgbToColors = ([r, g, b]: [number, number, number]) => {
  const sum = r + g + b;
  const baseColor = sum <= 3 * 128 ? "255,255,255" : "0,0,0";

  return {
    "grey-text-dark": `rgba(${baseColor},0.8)`,
    "grey-text-light": `rgba(${baseColor},0.50)`,
    "grey-ui-dark": `rgba(${baseColor},0.125)`,
    "grey-ui-light": `rgba(${baseColor},0.05)`,
  };
};

const textColorForBackground = (color: string, defaultColors: any) => {
  const fallback = {
    "grey-text-dark": defaultColors["grey-text-dark"],
    "grey-text-light": defaultColors["grey-text-light"],
    "grey-ui-dark": defaultColors["grey-ui-dark"],
    "grey-ui-light": defaultColors["grey-ui-light"],
  };

  if (!color) {
    return fallback;
  }
  if (color.startsWith("#")) {
    const rgb = hexToRGB(color);
    if (rgb == null) {
      return fallback;
    }
    return rgbToColors(rgb);
  }

  return fallback;
};

const fallback = (somethingNullable: any | null, defaultValue: any) => {
  if (!somethingNullable) {
    return defaultValue;
  }
  return somethingNullable;
};

export const toProductInfoColors = (
  brandingAppearance?: BrandingAppearance | undefined,
) => {
  return brandingAppearance
    ? {
        ...DEFAULT_INFO_COLORS,
        error: fallback(
          brandingAppearance.color_error,
          DEFAULT_INFO_COLORS["error"],
        ),
        focus: fallback(
          brandingAppearance.color_accent,
          DEFAULT_INFO_COLORS["focus"],
        ),
        accent: fallback(
          brandingAppearance.color_accent,
          DEFAULT_INFO_COLORS["accent"],
        ),
        primary: fallback(
          brandingAppearance.color_buttons_primary,
          DEFAULT_INFO_COLORS["primary"],
        ),
        background: fallback(
          brandingAppearance.color_product_info_bg,
          DEFAULT_INFO_COLORS["background"],
        ),
        ...textColorForBackground(
          brandingAppearance.color_product_info_bg,
          DEFAULT_INFO_COLORS,
        ),
      }
    : { ...DEFAULT_INFO_COLORS }; //copy, do not reference.
};

export const toFormColors = (
  brandingAppearance?: BrandingAppearance | undefined,
) => {
  return brandingAppearance
    ? {
        ...DEFAULT_FORM_COLORS,
        error: fallback(
          brandingAppearance.color_error,
          DEFAULT_FORM_COLORS["error"],
        ),
        focus: fallback(
          brandingAppearance.color_accent,
          DEFAULT_FORM_COLORS["focus"],
        ),
        accent: fallback(
          brandingAppearance.color_accent,
          DEFAULT_FORM_COLORS["accent"],
        ),
        primary: fallback(
          brandingAppearance.color_buttons_primary,
          DEFAULT_FORM_COLORS["primary"],
        ),
        background: fallback(
          brandingAppearance.color_form_bg,
          DEFAULT_FORM_COLORS["background"],
        ),
        ...textColorForBackground(
          brandingAppearance.color_form_bg,
          DEFAULT_FORM_COLORS,
        ),
      }
    : { ...DEFAULT_FORM_COLORS }; //copy, do not reference.
};

export const toColorsStyleVar = (colors: Record<string, string>) => {
  return Object.entries(colors)
    .map(([key, value]) => `--rc-color-${key}: ${value}`)
    .join("; ");
};
