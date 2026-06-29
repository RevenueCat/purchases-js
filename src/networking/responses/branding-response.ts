import type { BrandFontConfig } from "src/ui/theme/text";
import type { BrandingAppearance } from "../../entities/branding";

/**
 * Controls how the billing address is collected during checkout.
 * - `never`: the full address UI is never presented. Only country and postal
 *   code are collected, and postal code is US-only. (default behavior)
 * - `always`: the full address UI is always presented.
 */
export type FullAddressCollectionMode = "never" | "always";

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
  full_address_collection_mode?: FullAddressCollectionMode;
  brand_font_config: BrandFontConfig | null;
  sandbox_configuration?: {
    checkout_feedback_form_url: string | null;
  };
};

/**
 * Resolves whether the full billing address UI should be presented, based on
 * the branding configuration. Treats a missing mode and any unknown/future
 * mode as `never`.
 */
export function shouldCollectFullAddress(
  brandingInfo:
    | Pick<BrandingInfoResponse, "full_address_collection_mode">
    | null
    | undefined,
): boolean {
  return brandingInfo?.full_address_collection_mode === "always";
}
