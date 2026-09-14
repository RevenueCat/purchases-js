import { ProductType, type Product } from "../entities/offerings";
import type { BrandingInfoResponse } from "../networking/responses/branding-response";

/**
 * Resolves the terms URL used by checkout. An explicitly provided purchase
 * parameter always wins. The app-config URL is used only when checkout consent
 * is enabled.
 */
export function resolveTermsAndConditionsUrl({
  brandingInfo,
  termsAndConditionsUrl,
}: {
  brandingInfo: BrandingInfoResponse | null | undefined;
  termsAndConditionsUrl?: string;
}): string | undefined {
  const resolvedUrl =
    termsAndConditionsUrl ??
    (brandingInfo?.require_checkout_consent
      ? brandingInfo.terms_and_conditions_url
      : undefined);

  return resolvedUrl || undefined;
}

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
