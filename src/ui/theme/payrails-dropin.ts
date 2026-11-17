import type { DropinAppearance } from "@payrails/web-sdk";
import type { BrandingAppearance } from "../../entities/branding";
import { DEFAULT_FORM_COLORS } from "./colors";
import { toFormColors, toShape } from "./utils";

export const toPayrailsDropinAppearance = (
  appearance: BrandingAppearance | null | undefined,
): DropinAppearance => {
  const colors = toFormColors(appearance);
  const shape = toShape(appearance);

  return {
    rules: {
      ".payrails-button": {
        backgroundColor: colors.primary,
        color: colors["primary-text"],
        borderRadius: shape["input-button-border-radius"],
      },
      ".payrails-button:hover": { backgroundColor: colors["primary-hover"] },
      ".payrails-label": { color: DEFAULT_FORM_COLORS["grey-text-dark"] },
      ".payrails-branding-header .payrails-label, .payrails-branding-footer .payrails-text":
        { color: colors["grey-text-light"] },
    },
    cardForm: {
      rules: {
        ".payrails-input": { borderRadius: shape["input-border-radius"] },
        ".payrails-input:focus": { borderColor: colors.focus, outline: "none" },
        ".payrails-input--dirty:not(:focus).payrails-input--invalid": {
          borderColor: colors.error,
        },
        ".payrails-error": { color: colors.error },
      },
    },
  };
};
