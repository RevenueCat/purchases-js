import { BrandingAppearance } from "../../networking/responses/branding-response";

export const RoundedShape: Record<string, string> = {
  "input-border-radius": "12px",
  "input-button-border-radius": "12px",
  "modal-border-radius": "16px",
};

export const RectangularShape: Record<string, string> = {
  "input-border-radius": "0px",
  "input-button-border-radius": "0px",
  "modal-border-radius": "0px",
};

export const PillsShape: Record<string, string> = {
  "input-border-radius": "24px",
  "input-button-border-radius": "56px",
  "modal-border-radius": "16px",
};

export const DefaultShape = RoundedShape;

export const toShape = (
  brandingAppearance?: BrandingAppearance | undefined,
) => {
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
