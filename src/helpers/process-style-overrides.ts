import { appearanceConfigStore } from "../store/store";
import { Colors } from "../assets/colors";
import { WPL_BASE_URL } from "../assets/constants";

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
  appearance?: Record<string, string | boolean>,
) => {
  // Return default colors if there's no appearance configuration object
  // or if the current host is coming from a WPL
  if (!appearance || window.location.host.includes(WPL_BASE_URL))
    return mapObjectToColorVariableString(Colors);

  // Set configuration object to store for custom overrides
  appearanceConfigStore.set(appearance);

  // Map global variables to css variables from default color object
  const mappedVariablesDict = Object.entries(variableNameMap).reduce(
    (defaultColorDict, [appearanceColorDictKey, defaultColorDictKey]) => {
      if (appearance[appearanceColorDictKey]) {
        defaultColorDict[defaultColorDictKey] = appearance[
          appearanceColorDictKey
        ] as string;
      }
      return defaultColorDict;
    },
    Colors,
  );

  return mapObjectToColorVariableString(mappedVariablesDict);
};

// Map color object into a single CSS variable string
const mapObjectToColorVariableString = (colorDict: Record<string, string>) =>
  Object.entries(colorDict)
    .map(([key, value]) => `--rc-color-${key}: ${value}`)
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
