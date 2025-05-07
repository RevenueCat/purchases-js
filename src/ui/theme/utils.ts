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

import type { BrandFontConfig } from "./text";
import {
  BRANDED_FONT_FAMILY,
  DEFAULT_FONT_FAMILY,
  type TextStyles,
} from "./text";
import type { Spacing } from "./spacing";
import type { BrandingAppearance } from "../../entities/branding";

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
    "grey-text-light": `rgba(${baseColor},0.70)`,
    "grey-ui-dark": `rgba(${baseColor},0.3)`,
    "grey-ui-light": `rgba(${baseColor},0.1)`,
  };
};

function overlayColor(
  baseColor: string,
  overlay: string,
  alpha: number,
): string {
  const base = hexToRGB(baseColor) || { r: 0, g: 0, b: 0 };
  const over = hexToRGB(overlay) || { r: 255, g: 255, b: 255 };
  const r = Math.round(over.r * alpha + base.r * (1 - alpha));
  const g = Math.round(over.g * alpha + base.g * (1 - alpha));
  const b = Math.round(over.b * alpha + base.b * (1 - alpha));
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Applies an alpha value to a color.
 * If the base color is light, the overlay color is black.
 * If the base color is dark, the overlay color is white.
 */
export function applyAlpha(baseColor: string, alpha: number): string {
  const defaultRgb = { r: 255, g: 255, b: 255 };
  const normalizedAlpha = Math.max(0, Math.min(1, alpha));

  let appliedBaseColor = baseColor;

  let baseRgb = hexToRGB(baseColor) || defaultRgb;

  if (isNaN(baseRgb.r) || isNaN(baseRgb.g) || isNaN(baseRgb.b)) {
    baseRgb = defaultRgb;
    appliedBaseColor = "#FFFFFF";
  }

  const baseIsLight = isLightColor({
    ...baseRgb,
    luminanceThreshold: DEFAULT_LUMINANCE_THRESHOLD,
  });
  const overlay = baseIsLight ? "#000000" : "#FFFFFF";
  return overlayColor(appliedBaseColor, overlay, normalizedAlpha);
}

function toHex(val: number) {
  return val.toString(16).padStart(2, "0").toUpperCase();
}

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

const colorsForButtonStates = (primaryColor: string) => {
  return {
    "primary-hover": applyAlpha(primaryColor, 0.1),
    "primary-pressed": applyAlpha(primaryColor, 0.15),
  };
};

const fallback = <T>(
  somethingNullable: T | null | undefined,
  defaultValue: T,
): T => {
  return somethingNullable ? somethingNullable : defaultValue;
};

const mapColors = (
  colorsMapping: Record<string, string>,
  defaultColors: Colors,
  brandingAppearance?: BrandingAppearance | null | undefined,
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
  brandingAppearance?: BrandingAppearance | null | undefined,
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
        ...colorsForButtonStates(mappedColors.primary),
      }
    : { ...defaultColors }; //copy, do not reference.
};

export const toProductInfoColors = (
  brandingAppearance?: BrandingAppearance | null | undefined,
): Colors => {
  return toColors(
    InfoColorsToBrandingAppearanceMapping,
    DEFAULT_INFO_COLORS,
    brandingAppearance,
  );
};

export const toFormColors = (
  brandingAppearance?: BrandingAppearance | null | undefined,
): Colors => {
  return toColors(
    FormColorsToBrandingAppearanceMapping,
    DEFAULT_FORM_COLORS,
    brandingAppearance,
  );
};

export const toShape = (
  brandingAppearance?: BrandingAppearance | null | undefined,
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
export const toProductInfoStyleVar = (
  appearance?: BrandingAppearance | null,
) => {
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
export const toFormStyleVar = (appearance?: BrandingAppearance | null) => {
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
 * Convert text styles into CSS variables for both desktop and mobile.
 */
export const toTextStyleVar = (
  prefix: string = "",
  textStyles: TextStyles,
  brand_font_config: BrandFontConfig | null | undefined,
) => {
  return Object.entries(textStyles)
    .flatMap(([key, { desktop, mobile }]) => {
      const desktopFontStyle = `normal normal ${desktop.fontWeight} ${desktop.fontSize}/${desktop.lineHeight} ${DEFAULT_FONT_FAMILY}`;
      const mobileFontStyle = `normal normal ${mobile.fontWeight} ${mobile.fontSize}/${mobile.lineHeight} ${DEFAULT_FONT_FAMILY}`;
      const brandedDesktopFontStyle = `normal normal ${brand_font_config?.desktop?.font_weight} ${brand_font_config?.desktop?.font_size} ${BRANDED_FONT_FAMILY}`;
      const brandedMobileFontStyle = `normal normal ${brand_font_config?.mobile?.font_weight} ${brand_font_config?.mobile?.font_size} ${BRANDED_FONT_FAMILY}`;

      return [
        `--rc-${prefix}-${key}-desktop: ${desktopFontStyle}`,
        `--rc-${prefix}-${key}-mobile: ${mobileFontStyle}`,
        `--rc-${prefix}-${key}-branded-desktop: ${brand_font_config?.desktop ? brandedDesktopFontStyle : desktopFontStyle}`,
        `--rc-${prefix}-${key}-branded-mobile: ${brand_font_config?.mobile ? brandedMobileFontStyle : mobileFontStyle}`,
        `--rc-${prefix}-${key}-desktop-font-size: ${desktop.fontSize}`,
        `--rc-${prefix}-${key}-mobile-font-size: ${mobile.fontSize}`,
      ];
    })
    .join("; ");
};

/**
 * Generates CSS variables for the spacing system.
 */
export const toSpacingVars = (prefix: string = "", spacing: Spacing) =>
  Object.entries(spacing)
    .map(
      ([key, { mobile, desktop }]) =>
        `--rc-${prefix}-${key}-mobile: ${mobile};  --rc-${prefix}-${key}-desktop: ${desktop};`,
    )
    .join(" ");
