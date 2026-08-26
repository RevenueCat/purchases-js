import { afterEach, describe, expect, test, vi } from "vitest";
import { Purchases } from "../main";
import { configurePurchases } from "./base.purchases_test";
import { createMonthlyPackageMock } from "./mocks/offering-mock-provider";
import { buildOffering } from "./utils/fixtures-utils";

describe("Purchases.trackCustomPaywallImpression", () => {
  afterEach(() => {
    Purchases.getSharedInstance().close();
  });

  test("uses the offering passed by the caller", () => {
    const purchases = configurePurchases();
    const trackEvent = vi.spyOn(
      purchases["eventsTracker"],
      "trackCustomPaywallImpression",
    );
    const offering = buildOffering([createMonthlyPackageMock()]);
    const offeringWithContext = {
      ...offering,
      identifier: "placement-offering",
      availablePackages: offering.availablePackages.map((pkg) => ({
        ...pkg,
        webBillingProduct: {
          ...pkg.webBillingProduct,
          presentedOfferingContext: {
            offeringIdentifier: "placement-offering",
            placementIdentifier: "home_banner",
            targetingContext: { revision: 3, ruleId: "rule_abc123" },
          },
        },
      })),
    };

    purchases.trackCustomPaywallImpression({
      paywallId: "custom-paywall",
      offering: offeringWithContext,
    });

    expect(trackEvent).toHaveBeenCalledExactlyOnceWith({
      paywallId: "custom-paywall",
      offeringId: "placement-offering",
      placementIdentifier: "home_banner",
      targetingRevision: 3,
      targetingRuleId: "rule_abc123",
    });
  });

  test("uses the current offering cached by getOfferings when none is passed", async () => {
    const purchases = configurePurchases();
    await purchases.getOfferings();
    const trackEvent = vi.spyOn(
      purchases["eventsTracker"],
      "trackCustomPaywallImpression",
    );

    purchases.trackCustomPaywallImpression({ paywallId: "custom-paywall" });

    expect(trackEvent).toHaveBeenCalledExactlyOnceWith({
      paywallId: "custom-paywall",
      offeringId: "offering_1",
      placementIdentifier: undefined,
      targetingRevision: 123,
      targetingRuleId: "test_rule_id",
    });
  });

  test("tracks an unattributed event when no offering is available", () => {
    const purchases = configurePurchases();
    const trackEvent = vi.spyOn(
      purchases["eventsTracker"],
      "trackCustomPaywallImpression",
    );

    purchases.trackCustomPaywallImpression({ paywallId: "custom-paywall" });

    expect(trackEvent).toHaveBeenCalledExactlyOnceWith({
      paywallId: "custom-paywall",
      offeringId: undefined,
      placementIdentifier: undefined,
      targetingRevision: undefined,
      targetingRuleId: undefined,
    });
  });

  test("clears the cached offering when the app user changes", async () => {
    const purchases = configurePurchases();
    await purchases.getOfferings();
    await purchases["replaceUserId"]("newAppUserId");
    const trackEvent = vi.spyOn(
      purchases["eventsTracker"],
      "trackCustomPaywallImpression",
    );

    purchases.trackCustomPaywallImpression({ paywallId: "custom-paywall" });

    expect(trackEvent).toHaveBeenCalledExactlyOnceWith({
      paywallId: "custom-paywall",
      offeringId: undefined,
      placementIdentifier: undefined,
      targetingRevision: undefined,
      targetingRuleId: undefined,
    });
  });
});
