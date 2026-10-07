import type { BrandingAppearance } from "../../entities/branding";
import {
  applyAlpha,
  colorsForButtonStates,
  isHexColorLight,
  toFormColors,
  toProductInfoColors,
  toShape,
  toStyleVar,
} from "./utils";

export const toSimulatedStoreModalStyleVars = (
  appearance: BrandingAppearance | null | undefined,
): string => {
  if (!appearance) {
    return "";
  }

  const formColors = toFormColors(appearance);
  const infoColors = toProductInfoColors(appearance);
  const shape = toShape(appearance);
  const primaryStates = colorsForButtonStates(formColors.primary);
  const errorStates = colorsForButtonStates(formColors.error);

  const variables: Record<string, string> = {
    "card-bg": formColors.background,
    "card-text": formColors["grey-text-dark"],
    "card-text-secondary": formColors["grey-text-light"],
    "details-bg": infoColors.background,
    "details-text": infoColors["grey-text-dark"],
    "details-text-secondary": infoColors["grey-text-light"],
    primary: formColors.primary,
    "primary-hover": primaryStates["primary-hover"],
    "primary-text": formColors["primary-text"],
    error: formColors.error,
    "error-hover": errorStates["primary-hover"],
    "error-text": isHexColorLight(formColors.error) ? "black" : "white",
    "cancel-bg": applyAlpha(formColors.background, 0.05),
    "cancel-hover": applyAlpha(formColors.background, 0.1),
    "details-radius": shape["input-border-radius"],
    "button-radius": shape["input-button-border-radius"],
  };

  return toStyleVar("simulated-store", Object.entries(variables));
};
