import { appearanceConfigStore } from "../store/store";
import { DEFAULT_COLORS, toColors, toColorsStyleVar } from "../ui/theme/colors";
import type { BrandingAppearance } from "src/networking/responses/branding-response";
import { toShape, toShapeStyle } from "../ui/theme/shapes";

/**
 * Get the CSS variable string for a given property
 */
export const getStyleVariable = ({
  property,
  variableName,
  fallbackVariableName,
}: {
  property: string | undefined;
  variableName: string;
  fallbackVariableName: string;
}) => {
  return `--${variableName}: ${property || `var(${fallbackVariableName})`}`;
};

/**
 * Assigns values to the css variables given the branding appearance customization.
 * @param appearance BrandingAppearance
 * @return a style parameter compatible string.
 */
export const toStyleVar = (appearance?: BrandingAppearance) => {
  // Return default colors if there's no appearance configuration object
  if (!appearance) {
    return toColorsStyleVar(DEFAULT_COLORS);
  }

  // Set configuration object to store for custom overrides
  appearanceConfigStore.set(appearance);

  const colorVariablesString = toColorsStyleVar(toColors(appearance));

  const shapeVariableString = toShapeStyle(toShape(appearance));

  return [colorVariablesString, shapeVariableString].join("; ");
};

/**
 * Receives an SVG as a string along with a value for the fill attribute
 * and if the value exists, replaces the icon's fill
 * and returns a data URL for the new SVG to be used in an <img> tag
 */
export const getReplacedFillSvgAsImgUrl = (
  fillVariableValue: string,
  icon: string,
) => {
  const svgContent = fillVariableValue
    ? icon.replace(/fill="#[0-9A-Fa-f]{6}"/, `fill="${fillVariableValue}"`)
    : icon;

  return `data:image/svg+xml,${encodeURIComponent(svgContent)}`;
};
