import type { BrandingAppearance } from "../../entities/branding";

export type BrandingInfoResponse = {
  app_icon: string | null;
  app_icon_webp: string | null;
  app_wordmark: string | null;
  app_wordmark_webp: string | null;
  appearance: BrandingAppearance | null;
  id: string;
  app_name: string | null;
  support_email?: string | null;
  gateway_tax_collection_enabled: boolean;
};
