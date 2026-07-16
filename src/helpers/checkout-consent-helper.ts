import type { CheckoutConsentConfig } from "../entities/purchase-params";
import type { PurchaseOption } from "../entities/offerings";
import type { BrandingInfoResponse } from "../networking/responses/branding-response";
import { isSubscriptionOption } from "./checkout-disclosure-helper";

export function resolveCheckoutConsentRequired(
  sdkConfig: CheckoutConsentConfig | null | undefined,
  brandingInfo: Pick<BrandingInfoResponse, "appearance"> | null | undefined,
): boolean {
  if (sdkConfig != null) {
    return sdkConfig.required === true;
  }

  return brandingInfo?.appearance?.require_checkout_consent === true;
}

export function isCheckoutConsentActive(
  checkoutConsentRequired: boolean,
  purchaseOption: PurchaseOption | null | undefined,
): boolean {
  return checkoutConsentRequired && isSubscriptionOption(purchaseOption);
}
