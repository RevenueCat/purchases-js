import { appearanceConfigStore } from "../store/store";
import { Colors } from "../assets/colors";
import { WPL_BASE_URL } from "../assets/constants";

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

const mapObjectToColorVariableString = (colorDict: Record<string, string>) =>
  Object.entries(colorDict)
    .map(([key, value]) => `--rc-color-${key}: ${value}`)
    .join("; ");
