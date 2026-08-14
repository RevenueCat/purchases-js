import {
  DEFAULT_BRANDING_APPEARANCE,
  type BrandingAppearance,
} from "../entities/branding";
import type { BrandingInfoResponse } from "../networking/responses/branding-response";

export function mergeBrandingAppearanceOverrides(
  configuredOverride?: Partial<BrandingAppearance>,
  purchaseOverride?: Partial<BrandingAppearance>,
): Partial<BrandingAppearance> | undefined {
  if (!configuredOverride && !purchaseOverride) {
    return undefined;
  }

  return { ...configuredOverride, ...purchaseOverride };
}

export function applyBrandingAppearanceOverride(
  brandingInfo: BrandingInfoResponse | null,
  appearanceOverride?: Partial<BrandingAppearance>,
): BrandingInfoResponse | null {
  if (!brandingInfo || !appearanceOverride) {
    return brandingInfo;
  }

  return {
    ...brandingInfo,
    appearance: {
      ...(brandingInfo.appearance ?? DEFAULT_BRANDING_APPEARANCE),
      ...appearanceOverride,
    },
  };
}
