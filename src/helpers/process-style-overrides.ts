import { appearanceConfigStore } from "../store/store";
import { Colors } from "../ui/theme/colors";
import type { BrandingAppearance } from "src/networking/responses/branding-response";
import {
  DefaultShape,
  PillsShape,
  RectangularShape,
  RoundedShape,
} from "../ui/theme/shapes";

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

// Known variable names that map 1<>1 into variables from the Colors object
const variableNameMap: Record<string, string> = {
  color_error: "error",
  color_accent: "focus",
};

export const mapStyleOverridesToStyleVariables = (
  appearance?: BrandingAppearance,
) => {
  // Return default colors if there's no appearance configuration object
  if (!appearance) {
    return mapObjectToColorVariableString(Colors);
  }

  // Set configuration object to store for custom overrides
  appearanceConfigStore.set(appearance);

  // Map global variables to css variables from default color object
  const mappedVariablesDict = Object.entries(variableNameMap).reduce(
    (defaultColorDict, [appearanceColorDictKey, defaultColorDictKey]) => {
      if (appearance[appearanceColorDictKey as keyof BrandingAppearance]) {
        defaultColorDict[defaultColorDictKey] = appearance[
          appearanceColorDictKey as keyof BrandingAppearance
        ] as string;
      }
      return defaultColorDict;
    },
    Colors,
  );

  const colorVariablesString =
    mapObjectToColorVariableString(mappedVariablesDict);

  let shapeVariableString = "";

  switch (appearance.shapes) {
    case "rounded":
      shapeVariableString = mapObjectToShapeVariableString(RoundedShape);
      break;
    case "rectangle":
      shapeVariableString = mapObjectToShapeVariableString(RectangularShape);
      break;
    case "pill":
      shapeVariableString = mapObjectToShapeVariableString(PillsShape);
      break;
    default:
      shapeVariableString = mapObjectToShapeVariableString(DefaultShape);
  }

  return [colorVariablesString, shapeVariableString].join("; ");
};

// Map color object into a single CSS variable string
const mapObjectToColorVariableString = (colorDict: Record<string, string>) =>
  Object.entries(colorDict)
    .map(([key, value]) => `--rc-color-${key}: ${value}`)
    .join("; ");

const mapObjectToShapeVariableString = (colorDict: Record<string, string>) =>
  Object.entries(colorDict)
    .map(([key, value]) => `--rc-shape-${key}: ${value}`)
    .join("; ");

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
