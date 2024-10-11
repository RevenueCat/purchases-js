import { BrandingAppearance } from "../../networking/responses/branding-response";

export const DEFAULT_COLORS: Record<string, string> = {
  error: "#f2545b",
  warning: "#f4e971",
  focus: "#000080",
  "grey-text-dark": "#000000",
  "grey-text-light": "#767676",
  "grey-ui-dark": "#dfdfdf",
  white: "#ffffff",
};

export const toColors = (
  brandingAppearance?: BrandingAppearance | undefined,
) => {
  return brandingAppearance
    ? {
        ...DEFAULT_COLORS,
        error: brandingAppearance.color_error,
        focus: brandingAppearance.color_accent,
      }
    : { ...DEFAULT_COLORS }; //copy, do not reference.
};

export const toColorsStyleVar = (colors: Record<string, string>) => {
  return Object.entries(colors)
    .map(([key, value]) => `--rc-color-${key}: ${value}`)
    .join("; ");
};
