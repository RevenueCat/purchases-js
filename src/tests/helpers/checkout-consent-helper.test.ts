import { describe, expect, test } from "vitest";
import { ProductType } from "../../entities/offerings";
import { isCheckoutConsentRequired } from "../../helpers/checkout-consent-helper";
import { brandingInfo } from "../../stories/fixtures";

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
