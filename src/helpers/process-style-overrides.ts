import { appearanceConfigStore } from "../store/store";
import { Colors } from "../assets/colors";
import type { BrandingAppearance } from "src/networking/responses/branding-response";

// Known variable names that map 1<>1 into variables from the Colors object
const variableNameMap: Record<string, string> = {
  color_error: "error",
  color_accent: "focus",
  color_buttons_primary: "button-primary-bg",
};

// Variable names for which a contrasting foreground color is needed
const foregroundColorMap: Record<string, string> = {
  color_buttons_primary: "button-primary-text",
};

const parseHexColor: (color: string) => { r: number; g: number; b: number } = (
  color,
) => {
  const hex = color.replace("#", "");
  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16),
  };
};

export const mapStyleOverridesToStyleVariables = (
  appearance?: BrandingAppearance,
) => {
  // Return default colors if there's no appearance configuration object
  // or if the current host is coming from a WPL
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

  // Map foreground color variables
  for (const [appearanceColorDictKey, defaultColorDictKey] of Object.entries(
    foregroundColorMap,
  )) {
    if (appearance[appearanceColorDictKey as keyof BrandingAppearance]) {
      // Get the RGB values of the background color
      const { r, g, b } = parseHexColor(
        appearance[
          appearanceColorDictKey as keyof BrandingAppearance
        ] as string,
      );
      if (r * 0.299 + g * 0.587 + b * 0.114 > 186) {
        // This is a luminance calculation courtesy of GitHub copilot
        // Light background, use dark text
        mappedVariablesDict[defaultColorDictKey] = Colors["grey-text-dark"];
      } else {
        // Dark background, use light text
        mappedVariablesDict[defaultColorDictKey] = Colors["white"];
      }
    }
  }

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
