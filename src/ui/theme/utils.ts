import { BrandingAppearance } from "src/networking/responses/branding-response";
import {
  Colors,
  DEFAULT_FORM_COLORS,
  DEFAULT_INFO_COLORS,
  FormColorsToBrandingAppearanceMapping,
  InfoColorsToBrandingAppearanceMapping,
} from "./colors";
import {
  DefaultShape,
  PillsShape,
  RectangularShape,
  RoundedShape,
  Shape,
} from "./shapes";

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

const rgbToTextColors = ([r, g, b]: [number, number, number]) => {
  const sum = r + g + b;
  const baseColor = sum <= 3 * 128 ? "255,255,255" : "0,0,0";

  return {
    "grey-text-dark": `rgba(${baseColor},0.8)`,
    "grey-text-light": `rgba(${baseColor},0.50)`,
    "grey-ui-dark": `rgba(${baseColor},0.125)`,
    "grey-ui-light": `rgba(${baseColor},0.05)`,
  };
};

const textColorsForBackground = (
  backgroundColors: string,
  defaultColors: Colors,
) => {
  const fallbackColors = {
    "grey-text-dark": defaultColors["grey-text-dark"],
    "grey-text-light": defaultColors["grey-text-light"],
    "grey-ui-dark": defaultColors["grey-ui-dark"],
    "grey-ui-light": defaultColors["grey-ui-light"],
  };

  if (!backgroundColors) {
    return fallbackColors;
  }

  if (backgroundColors.startsWith("#")) {
    const rgb = hexToRGB(backgroundColors);
    if (rgb == null) {
      return fallbackColors;
    }
    return rgbToTextColors(rgb);
  }

  return fallbackColors;
};

const fallback = (somethingNullable: any | null, defaultValue: any) => {
  return somethingNullable ? somethingNullable : defaultValue;
};

const mapColors = (
  colorsMapping: any,
  defaultColors: Colors,
  brandingAppearance?: BrandingAppearance | undefined,
): Colors => {
  const mappedColors = Object.entries(colorsMapping).map(([target, source]) => [
    target,
    fallback(
      brandingAppearance
        ? brandingAppearance[source as keyof BrandingAppearance]
        : null,
      defaultColors[target as keyof Colors],
    ),
  ]);

  return Object.fromEntries(mappedColors) as Colors;
};

export const toColors = (
  colorsMapping: any,
  defaultColors: Colors,
  brandingAppearance?: BrandingAppearance | undefined,
): Colors => {
  const mappedColors = mapColors(
    colorsMapping,
    defaultColors,
    brandingAppearance,
  );

  return brandingAppearance
    ? {
        ...defaultColors,
        ...mappedColors,
        ...textColorsForBackground(mappedColors.background, defaultColors),
      }
    : { ...defaultColors }; //copy, do not reference.
};

export const toProductInfoColors = (
  brandingAppearance?: BrandingAppearance | undefined,
): Colors => {
  return toColors(
    InfoColorsToBrandingAppearanceMapping,
    DEFAULT_INFO_COLORS,
    brandingAppearance,
  );
};

export const toFormColors = (
  brandingAppearance?: BrandingAppearance | undefined,
): Colors => {
  return toColors(
    FormColorsToBrandingAppearanceMapping,
    DEFAULT_FORM_COLORS,
    brandingAppearance,
  );
};

export const toShape = (
  brandingAppearance?: BrandingAppearance | undefined,
): Shape => {
  if (!brandingAppearance) {
    return DefaultShape;
  }
  switch (brandingAppearance.shapes) {
    case "rounded":
      return RoundedShape;
    case "rectangle":
      return RectangularShape;
    case "pill":
      return PillsShape;
    default:
      return DefaultShape;
  }
};

export const toStyleVar = (prefix: string = "", entries: [string, string][]) =>
  entries.map(([key, value]) => `--rc-${prefix}-${key}: ${value}`).join("; ");

/**
 * Assigns values to the css variables given the branding appearance customization.
 * @param appearance BrandingAppearance
 * @return a style parameter compatible string.
 */
export const toProductInfoStyleVar = (appearance?: BrandingAppearance) => {
  const colorVariablesString = toStyleVar(
    "color",
    Object.entries(toProductInfoColors(appearance)),
  );

  const shapeVariableString = toStyleVar(
    "shape",
    Object.entries(toShape(appearance)),
  );

  return [colorVariablesString, shapeVariableString].join("; ");
};

/**
 * Assigns values to the css variables given the branding appearance customization.
 * @param appearance BrandingAppearance
 * @return a style parameter compatible string.
 */
export const toFormStyleVar = (appearance?: BrandingAppearance) => {
  const colorVariablesString = toStyleVar(
    "color",
    Object.entries(toFormColors(appearance)),
  );

  const shapeVariableString = toStyleVar(
    "shape",
    Object.entries(toShape(appearance)),
  );

  return [colorVariablesString, shapeVariableString].join("; ");
};
