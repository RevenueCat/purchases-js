import type { BrandFontConfig } from "src/ui/theme/text";
import type { BrandingAppearance } from "../../entities/branding";

/**
 * Controls how the billing address is collected during checkout.
 * - `if_required`: the full address UI is only presented when it is required,
 *   e.g. for tax collection in the customer's country. Otherwise only country
 *   and postal code are collected, and postal code is US-only. (default behavior)
 * - `always`: the full address UI is always presented.
 */
export type FullAddressCollectionMode = "if_required" | "always";

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
 * Resolves whether the full billing address UI should be presented, based on the
 * branding configuration and whether the selected country requires the full
 * address to resolve taxes.
 *
 * The full address is collected when either:
 * - `full_address_collection_mode` is `always`, or
 * - tax collection is enabled and the selected country requires the full address
 *   to resolve taxes (determined by the payment gateway, e.g.
 *   `StripeService.countryRequiresFullAddressForTaxes`).
 *
 * Treats a missing mode and any unknown/future mode as `if_required`.
 */
export function shouldCollectFullAddress(
  brandingInfo:
    | Pick<
        BrandingInfoResponse,
        "full_address_collection_mode" | "gateway_tax_collection_enabled"
      >
    | null
    | undefined,
  selectedCountryRequiresFullAddressForTaxes: boolean = false,
): boolean {
  if (brandingInfo?.full_address_collection_mode === "always") {
    return true;
  }

  return (
    !!brandingInfo?.gateway_tax_collection_enabled &&
    selectedCountryRequiresFullAddressForTaxes
  );
}
