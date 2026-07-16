import { describe, expect, test } from "vitest";
import {
  isCheckoutConsentActive,
  resolveCheckoutConsentRequired,
} from "../../helpers/checkout-consent-helper";
import {
  nonSubscriptionOption,
  subscriptionOption,
} from "../../stories/fixtures";
import type { BrandingAppearance } from "../../entities/branding";

const appearance = (
  requireCheckoutConsent?: boolean | null,
): BrandingAppearance => ({
  color_buttons_primary: "#000",
  color_accent: "#000",
  color_error: "#000",
  color_product_info_bg: "#000",
  color_form_bg: "#fff",
  color_page_bg: "#fff",
  font: "default",
  shapes: "default",
  show_product_description: false,
  require_checkout_consent: requireCheckoutConsent,
});

describe("resolveCheckoutConsentRequired", () => {
  test("defaults to false when SDK config and branding are absent", () => {
    expect(resolveCheckoutConsentRequired(undefined, undefined)).toBe(false);
    expect(resolveCheckoutConsentRequired(null, null)).toBe(false);
  });

  test("uses appearance.require_checkout_consent when SDK config is absent", () => {
    expect(
      resolveCheckoutConsentRequired(undefined, {
        appearance: appearance(true),
      }),
    ).toBe(true);
    expect(
      resolveCheckoutConsentRequired(undefined, {
        appearance: appearance(false),
      }),
    ).toBe(false);
    expect(
      resolveCheckoutConsentRequired(undefined, {
        appearance: appearance(null),
      }),
    ).toBe(false);
  });

  test("SDK config overrides appearance default when present", () => {
    expect(
      resolveCheckoutConsentRequired(
        { required: false },
        { appearance: appearance(true) },
      ),
    ).toBe(false);
    expect(
      resolveCheckoutConsentRequired(
        { required: true },
        { appearance: appearance(false) },
      ),
    ).toBe(true);
  });

  test("treats required: false as off even without branding", () => {
    expect(resolveCheckoutConsentRequired({ required: false }, null)).toBe(
      false,
    );
  });
});

describe("isCheckoutConsentActive", () => {
  test("requires both config and a subscription purchase option", () => {
    expect(isCheckoutConsentActive(true, subscriptionOption)).toBe(true);
    expect(isCheckoutConsentActive(true, nonSubscriptionOption)).toBe(false);
    expect(isCheckoutConsentActive(false, subscriptionOption)).toBe(false);
  });
});
