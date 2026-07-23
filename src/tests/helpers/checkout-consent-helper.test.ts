import { describe, expect, test } from "vitest";
import { ProductType } from "../../entities/offerings";
import {
  isCheckoutConsentRequired,
  resolveTermsAndConditionsUrl,
} from "../../helpers/checkout-consent-helper";
import { brandingInfo } from "../../stories/fixtures";

describe("resolveTermsAndConditionsUrl", () => {
  const configuredUrl = "https://example.com/configured-terms";

  test("prefers the URL provided to the purchase", () => {
    expect(
      resolveTermsAndConditionsUrl({
        brandingInfo: {
          ...brandingInfo,
          require_checkout_consent: true,
          terms_and_conditions_url: configuredUrl,
        },
        termsAndConditionsUrl: "https://example.com/purchase-terms",
      }),
    ).toBe("https://example.com/purchase-terms");
  });

  test("falls back to the app-config URL when consent is required", () => {
    expect(
      resolveTermsAndConditionsUrl({
        brandingInfo: {
          ...brandingInfo,
          require_checkout_consent: true,
          terms_and_conditions_url: configuredUrl,
        },
      }),
    ).toBe(configuredUrl);
  });

  test("does not use the app-config URL when consent is disabled", () => {
    expect(
      resolveTermsAndConditionsUrl({
        brandingInfo: {
          ...brandingInfo,
          require_checkout_consent: false,
          terms_and_conditions_url: configuredUrl,
        },
      }),
    ).toBeUndefined();
  });

  test("returns null when consent is required without a configured URL", () => {
    expect(
      resolveTermsAndConditionsUrl({
        brandingInfo: {
          ...brandingInfo,
          require_checkout_consent: true,
          terms_and_conditions_url: null,
        },
      }),
    ).toBeNull();
  });
});

describe("isCheckoutConsentRequired", () => {
  test("returns true when branding requires consent, terms URL exists, and product is a subscription", () => {
    expect(
      isCheckoutConsentRequired({
        brandingInfo: { ...brandingInfo, require_checkout_consent: true },
        termsAndConditionsUrl: "https://example.com/terms",
        productDetails: { productType: ProductType.Subscription },
      }),
    ).toBe(true);
  });

  test("returns false when branding does not require consent", () => {
    expect(
      isCheckoutConsentRequired({
        brandingInfo: { ...brandingInfo, require_checkout_consent: false },
        termsAndConditionsUrl: "https://example.com/terms",
        productDetails: { productType: ProductType.Subscription },
      }),
    ).toBe(false);
  });

  test("returns false when terms URL is missing", () => {
    expect(
      isCheckoutConsentRequired({
        brandingInfo: { ...brandingInfo, require_checkout_consent: true },
        termsAndConditionsUrl: null,
        productDetails: { productType: ProductType.Subscription },
      }),
    ).toBe(false);
  });

  test("returns false for one-time purchases", () => {
    expect(
      isCheckoutConsentRequired({
        brandingInfo: { ...brandingInfo, require_checkout_consent: true },
        termsAndConditionsUrl: "https://example.com/terms",
        productDetails: { productType: ProductType.Consumable },
      }),
    ).toBe(false);
  });
});
