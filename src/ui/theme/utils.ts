import { type BrandingAppearance } from "src/networking/responses/branding-response";
import {
  type Colors,
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
  type Shape,
} from "./shapes";
import { DEFAULT_FONT_FAMILY, type TextStyles } from "./text";
import type { Spacing } from "./spacing";

type RGB = {
  r: number;
  g: number;
  b: number;
};

const hexToRGB = (color: string): RGB | null => {
  if (color.length == 7)
    return {
      r: parseInt(color.slice(1, 3), 16),
      g: parseInt(color.slice(3, 5), 16),
      b: parseInt(color.slice(5, 7), 16),
    };
  if (color.length == 4)
    return {
      r: parseInt(color[1], 16),
      g: parseInt(color[2], 16),
      b: parseInt(color[3], 16),
    };
  return null;
};

const isLightColor = ({
  r,
  g,
  b,
  luminanceThreshold,
}: RGB & {
  luminanceThreshold: number;
}) => {
  // Gamma correction
  const gammaCorrect = (color: number) => {
    color = color / 255;
    return color <= 0.03928
      ? color / 12.92
      : Math.pow((color + 0.055) / 1.055, 2.4);
  };

  // Calculate relative luminance with gamma correction
  const luminance =
    0.2126 * gammaCorrect(r) +
    0.7152 * gammaCorrect(g) +
    0.0722 * gammaCorrect(b);

  // Return whether the background is light
  return luminance > luminanceThreshold;
};

export const DEFAULT_LUMINANCE_THRESHOLD = 0.37;

const rgbToTextColors = (
  rgb: RGB,
  luminanceThreshold: number = DEFAULT_LUMINANCE_THRESHOLD,
) => {
  const baseColor = isLightColor({ ...rgb, luminanceThreshold })
    ? "0,0,0"
    : "255,255,255";

  return {
    "grey-text-dark": `rgb(${baseColor})`,
    "grey-text-light": `rgba(${baseColor},0.50)`,
    "grey-ui-dark": `rgba(${baseColor},0.125)`,
    "grey-ui-light": `rgba(${baseColor},0.05)`,
  };
};

const textColorsForBackground = (
  backgroundColor: string,
  primaryColor: string,
  defaultColors: Colors,
  luminanceThreshold: number = DEFAULT_LUMINANCE_THRESHOLD,
) => {
  const textColors = {
    "grey-text-dark": defaultColors["grey-text-dark"],
    "grey-text-light": defaultColors["grey-text-light"],
    "grey-ui-dark": defaultColors["grey-ui-dark"],
    "grey-ui-light": defaultColors["grey-ui-light"],
    "primary-text": defaultColors["primary-text"],
  };

  // Find the text colors for the background
  if (backgroundColor?.startsWith("#")) {
    const rgb = hexToRGB(backgroundColor);
    if (rgb !== null) {
      Object.assign(textColors, rgbToTextColors(rgb));
    }
  }

  // Find the text color for the primary color
  if (primaryColor?.startsWith("#")) {
    const rgb = hexToRGB(primaryColor);
    if (rgb !== null) {
      textColors["primary-text"] = isLightColor({ ...rgb, luminanceThreshold })
        ? "black"
        : "white";
    }
  }

  return textColors;
};

const fallback = <T>(somethingNullable: T | null, defaultValue: T): T => {
  return somethingNullable ? somethingNullable : defaultValue;
};

const mapColors = (
  colorsMapping: Record<string, string>,
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
  colorsMapping: Record<string, string>,
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
        ...textColorsForBackground(
          mappedColors.background,
          mappedColors.primary,
          defaultColors,
        ),
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

/**
 * Convert text styles into CSS variables
 */
export const toTextStyleVar = (prefix: string = "", textStyles: TextStyles) =>
  Object.entries(textStyles)
    .map(
      ([key, { fontSize, lineHeight, fontWeight = "normal" }]) =>
        `--rc-${prefix}-${key}: normal normal ${fontWeight} ${fontSize}/${lineHeight} ${DEFAULT_FONT_FAMILY}`,
    )
    .join("; ");

/**
 * Generates CSS variables for the spacing system.
 */
export const toSpacingVars = (prefix: string = "", spacing: Spacing) =>
  Object.entries(spacing)
    .map(
      ([key, { mobile, desktop }]) =>
        `--rc-${prefix}-${key}-mobile: ${mobile}; --rc-${prefix}-${key}-desktop: ${desktop};`,
    )
    .join(" ");
