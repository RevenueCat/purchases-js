import type { BrandFontConfig } from "src/ui/theme/text";
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
  brand_font_config: BrandFontConfig | null;
  sandbox_configuration?: {
    checkout_feedback_form_url: string | null;
  };
  /**
   * Per-project gate for the Paddle inline checkout rollout (WST-700).
   * When `true`, the SDK presents Paddle's checkout inline (embedded in our own
   * container); when absent or `false`, it falls back to the legacy overlay
   * (modal popup). Toggled server-side by RevenueCat so the rollout can be
   * staged and large/managed accounts can opt in without shipping a code change.
   */
  paddle_inline_checkout_enabled?: boolean;
};
