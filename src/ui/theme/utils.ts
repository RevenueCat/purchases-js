import { toColorsStyleVar, toFormColors, toProductInfoColors } from "./colors";
import type { BrandingAppearance } from "src/networking/responses/branding-response";
import { toShape, toShapeStyle } from "./shapes";

/**
 * Assigns values to the css variables given the branding appearance customization.
 * @param appearance BrandingAppearance
 * @return a style parameter compatible string.
 */
export const toProductInfoStyleVar = (appearance?: BrandingAppearance) => {
  const colorVariablesString = toColorsStyleVar(
    toProductInfoColors(appearance),
  );

  const shapeVariableString = toShapeStyle(toShape(appearance));

  return [colorVariablesString, shapeVariableString].join("; ");
};

/**
 * Assigns values to the css variables given the branding appearance customization.
 * @param appearance BrandingAppearance
 * @return a style parameter compatible string.
 */
export const toFormStyleVar = (appearance?: BrandingAppearance) => {
  const colorVariablesString = toColorsStyleVar(toFormColors(appearance));

  const shapeVariableString = toShapeStyle(toShape(appearance));

  return [colorVariablesString, shapeVariableString].join("; ");
};
