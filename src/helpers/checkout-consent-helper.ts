import { ProductType, type Product } from "../entities/offerings";
import type { BrandingInfoResponse } from "../networking/responses/branding-response";

/**
 * Consent checkbox is shown only when branding requires it, a terms URL is
 * available, and the purchase is a subscription.
 */
export function isCheckoutConsentRequired({
  brandingInfo,
  termsAndConditionsUrl,
  productDetails,
}: {
  brandingInfo: BrandingInfoResponse | null | undefined;
  termsAndConditionsUrl?: string | null;
  productDetails: Pick<Product, "productType">;
}): boolean {
  return (
    !!brandingInfo?.require_checkout_consent &&
    !!termsAndConditionsUrl &&
    productDetails.productType === ProductType.Subscription
  );
}
