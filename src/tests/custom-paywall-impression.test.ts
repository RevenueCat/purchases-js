import { afterEach, describe, expect, test, vi } from "vitest";
import { Purchases } from "../main";
import { configurePurchases } from "./base.purchases_test";
import { createMonthlyPackageMock } from "./mocks/offering-mock-provider";
import { APIPostRequest, eventsURL } from "./test-responses";
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

  test("uses an offering without a paywall ID", () => {
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

    purchases.trackCustomPaywallImpression({ offering: offeringWithContext });

    expect(trackEvent).toHaveBeenCalledExactlyOnceWith({
      paywallId: undefined,
      offeringId: "placement-offering",
      placementIdentifier: "home_banner",
      targetingRevision: 3,
      targetingRuleId: "rule_abc123",
    });
  });

  test("sends a custom paywall impression from the public API", async () => {
    const purchases = configurePurchases();
    const offering = buildOffering([createMonthlyPackageMock()]);

    purchases.trackCustomPaywallImpression({
      paywallId: "custom-paywall",
      offering: {
        ...offering,
        identifier: "placement-offering",
      },
    });
    await purchases["eventsTracker"].flushAllEvents();

    expect(APIPostRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: eventsURL,
        keepalive: true,
        json: expect.objectContaining({
          events: expect.arrayContaining([
            expect.objectContaining({
              version: 1,
              type: "custom_paywall_impression",
              app_user_id: "someAppUserId",
              paywall_id: "custom-paywall",
              offering_id: "placement-offering",
            }),
          ]),
        }),
      }),
    );
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

  test("preserves the cached current offering after a filtered fetch excludes it", async () => {
    const purchases = configurePurchases();
    await purchases.getOfferings();
    await purchases.getOfferings({ offeringIdentifier: "offering_2" });
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

  test("tracks an unattributed event when called without parameters", () => {
    const purchases = configurePurchases();
    const trackEvent = vi.spyOn(
      purchases["eventsTracker"],
      "trackCustomPaywallImpression",
    );

    purchases.trackCustomPaywallImpression();

    expect(trackEvent).toHaveBeenCalledExactlyOnceWith({
      paywallId: undefined,
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
