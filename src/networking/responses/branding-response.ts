import type { BrandingAppearance } from "../../entities/branding";

export type BrandingInfoResponse = {
  app_icon: string | null;
  app_icon_webp: string | null;
  appearance: BrandingAppearance;
  id: string;
  app_name: string | null;
  support_email?: string | null;
};
