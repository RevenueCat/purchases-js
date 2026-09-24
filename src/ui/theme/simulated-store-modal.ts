import type { BrandingAppearance } from "../../entities/branding";
import {
  applyAlpha,
  isHexColorLight,
  toFormColors,
  toProductInfoColors,
  toShape,
} from "./utils";

/**
 * CSS variables for the Test Store purchase modal. Returns an empty string
 * without an appearance so the modal keeps its neutral default styling.
 */
export const toSimulatedStoreModalStyleVars = (
  appearance: BrandingAppearance | null | undefined,
): string => {
  if (!appearance) {
    return "";
  }

  const formColors = toFormColors(appearance);
  const infoColors = toProductInfoColors(appearance);
  const shape = toShape(appearance);

  const variables: Record<string, string> = {
    "card-bg": formColors.background,
    "card-text": formColors["grey-text-dark"],
    "card-text-secondary": formColors["grey-text-light"],
    "details-bg": infoColors.background,
    "details-text": infoColors["grey-text-dark"],
    "details-text-secondary": infoColors["grey-text-light"],
    primary: formColors.primary,
    "primary-hover": formColors["primary-hover"],
    "primary-text": formColors["primary-text"],
    error: formColors.error,
    "error-hover": applyAlpha(formColors.error, 0.1),
    "error-text": isHexColorLight(formColors.error) ? "black" : "white",
    "cancel-bg": applyAlpha(formColors.background, 0.05),
    "cancel-hover": applyAlpha(formColors.background, 0.1),
    "details-radius": shape["input-border-radius"],
    "button-radius": shape["input-button-border-radius"],
  };

  return Object.entries(variables)
    .map(([key, value]) => `--rc-simulated-store-${key}: ${value}`)
    .join("; ");
};
