import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { mount } from "svelte";
import { configurePurchases } from "./base.purchases_test";
import { createMonthlyPackageMock } from "./mocks/offering-mock-provider";
import { ErrorCode, PurchasesError } from "../main";
import type { Offering, Package } from "../entities/offerings";
import type { ComponentInteractionData } from "../behavioural-events/paywall-event";

vi.mock("svelte", () => ({
  mount: vi.fn(),
  unmount: vi.fn(),
}));

type PaywallMountProps = {
  onPurchaseClicked: (selectedPackageId: string) => void;
  onBackClicked: () => void;
  onComponentInteraction: (data: ComponentInteractionData) => void;
};

const createOfferingWithPaywall = (
  availablePackages: Package[] = [createMonthlyPackageMock()],
): Offering => {
  const monthlyPackage =
    availablePackages.find((pkg) => pkg.identifier === "$rc_monthly") ??
    availablePackages[0]!;
  const annualPackage =
    availablePackages.find((pkg) => pkg.identifier === "$rc_annual") ?? null;

  return {
    identifier: "paywall-offering-id",
    serverDescription: "paywall offering",
    metadata: null,
    packagesById: Object.fromEntries(
      availablePackages.map((pkg) => [pkg.identifier, pkg]),
    ),
    availablePackages,
    lifetime: null,
    annual: annualPackage,
    sixMonth: null,
    threeMonth: null,
    twoMonth: null,
    monthly: monthlyPackage,
    weekly: null,
    paywallComponents: {
      id: "paywall-public-id",
      default_locale: "en_US",
      components_localizations: {
        en_US: {},
      },
    } as unknown as Offering["paywallComponents"],
    uiConfig: {} as Offering["uiConfig"],
  };
};

const createAnnualPackageMock = (): Package => {
  const monthlyPackage = createMonthlyPackageMock();
  return {
    ...monthlyPackage,
    identifier: "$rc_annual",
    rcBillingProduct: {
      ...monthlyPackage.rcBillingProduct,
      identifier: "annual",
    },
    webBillingProduct: {
      ...monthlyPackage.webBillingProduct,
      identifier: "annual",
    },
  };
};

describe("Purchases.presentPaywall() paywall events", () => {
  let paywallProps: PaywallMountProps | undefined;

  beforeEach(() => {
    paywallProps = undefined;
    vi.mocked(mount).mockImplementation((_component, options) => {
      paywallProps = options.props as PaywallMountProps;
      (options.target as Element).innerHTML =
        "<div data-testid='paywall-root'></div>";
      return {} as ReturnType<typeof mount>;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  test("fires paywall_cancel and paywall_close when purchase is cancelled and paywall is dismissed", async () => {
    const purchases = configurePurchases();
    const offering = createOfferingWithPaywall();
    const packageId = offering.availablePackages[0]!.identifier;
    const trackPaywallEventSpy = vi.spyOn(
      purchases["eventsTracker"],
      "trackPaywallEvent",
    );
    vi.spyOn(purchases, "purchase").mockRejectedValue(
      new PurchasesError(ErrorCode.UserCancelledError),
    );

    const paywallPromise = purchases.presentPaywall({ offering });

    expect(paywallProps).toBeDefined();
    paywallProps!.onPurchaseClicked(packageId);
    await vi.waitFor(() => {
      expect(trackPaywallEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: "paywall_cancel" }),
      );
    });

    paywallProps!.onBackClicked();

    await expect(paywallPromise).rejects.toHaveProperty(
      "errorCode",
      ErrorCode.UserCancelledError,
    );
    expect(
      trackPaywallEventSpy.mock.calls.map(([event]) => event.type),
    ).toEqual(["paywall_impression", "paywall_cancel", "paywall_close"]);
  });

  test("rejects immediately without waiting for flush when paywall is closed", async () => {
    const purchases = configurePurchases();
    const offering = createOfferingWithPaywall();
    let flushResolved = false;
    const flushAllEventsSpy = vi
      .spyOn(purchases["eventsTracker"], "flushAllEvents")
      .mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              flushResolved = true;
              resolve();
            }, 1000);
          }),
      );
    vi.spyOn(purchases, "purchase").mockRejectedValue(
      new PurchasesError(ErrorCode.UserCancelledError),
    );

    const paywallPromise = purchases.presentPaywall({ offering });

    expect(paywallProps).toBeDefined();
    paywallProps!.onPurchaseClicked(offering.availablePackages[0]!.identifier);
    paywallProps!.onBackClicked();

    await expect(paywallPromise).rejects.toHaveProperty(
      "errorCode",
      ErrorCode.UserCancelledError,
    );
    expect(flushAllEventsSpy).toHaveBeenCalledTimes(1);
    expect(flushResolved).toBe(false);
  });

  test("does not fire paywall_cancel for non-cancellation errors", async () => {
    const purchases = configurePurchases();
    const offering = createOfferingWithPaywall();
    const packageId = offering.availablePackages[0]!.identifier;
    const trackPaywallEventSpy = vi.spyOn(
      purchases["eventsTracker"],
      "trackPaywallEvent",
    );
    vi.spyOn(purchases, "purchase").mockRejectedValue(
      new PurchasesError(ErrorCode.NetworkError),
    );

    const paywallPromise = purchases.presentPaywall({
      offering,
      onPurchaseError: () => {},
    });
    void paywallPromise.catch(() => undefined);

    expect(paywallProps).toBeDefined();
    paywallProps!.onPurchaseClicked(packageId);

    await vi.waitFor(() => {
      expect(trackPaywallEventSpy).toHaveBeenCalledTimes(1);
    });
    expect(
      trackPaywallEventSpy.mock.calls.map(([event]) => event.type),
    ).toEqual(["paywall_impression"]);
  });

  test("fires paywall_close when external code clears the paywall container", async () => {
    const purchases = configurePurchases();
    const offering = createOfferingWithPaywall();
    const packageId = offering.availablePackages[0]!.identifier;
    const htmlTarget = document.createElement("div");
    htmlTarget.id = "paywall-root";
    document.body.appendChild(htmlTarget);

    const trackPaywallEventSpy = vi.spyOn(
      purchases["eventsTracker"],
      "trackPaywallEvent",
    );
    vi.spyOn(purchases, "purchase").mockImplementation(async () => {
      htmlTarget.innerHTML = "";
      throw new PurchasesError(ErrorCode.UserCancelledError);
    });

    const paywallPromise = purchases.presentPaywall({
      offering,
      htmlTarget,
      purchaseHtmlTarget: htmlTarget,
    });
    void paywallPromise.catch(() => undefined);

    expect(paywallProps).toBeDefined();
    paywallProps!.onPurchaseClicked(packageId);

    await vi.waitFor(() => {
      expect(
        trackPaywallEventSpy.mock.calls.map(([event]) => event.type),
      ).toEqual(
        // MutationObserver fires synchronously when the container is cleared
        // (during the purchase), so paywall_close arrives before the catch
        // block fires paywall_cancel.
        ["paywall_impression", "paywall_close", "paywall_cancel"],
      );
    });
  });

  test("fires paywall_component_interacted when ui-js reports a button interaction", async () => {
    const purchases = configurePurchases();
    const offering = createOfferingWithPaywall();
    const trackPaywallEventSpy = vi.spyOn(
      purchases["eventsTracker"],
      "trackPaywallEvent",
    );

    const paywallPromise = purchases.presentPaywall({ offering });
    void paywallPromise.catch(() => undefined);

    expect(paywallProps).toBeDefined();
    paywallProps!.onComponentInteraction({
      componentType: "button",
      componentName: "Terms Button",
      componentValue: "navigate_to_terms",
      componentURL: "https://example.com/terms",
    });

    await vi.waitFor(() => {
      expect(trackPaywallEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "paywall_component_interacted",
          componentType: "button",
          componentName: "Terms Button",
          componentValue: "navigate_to_terms",
          componentURL: "https://example.com/terms",
        }),
      );
    });

    paywallProps!.onBackClicked();
    await expect(paywallPromise).rejects.toHaveProperty(
      "errorCode",
      ErrorCode.UserCancelledError,
    );
  });

  test("enriches package interactions with product identifiers", async () => {
    const purchases = configurePurchases();
    const monthlyPackage = createMonthlyPackageMock();
    const annualPackage = createAnnualPackageMock();
    const offering = createOfferingWithPaywall([monthlyPackage, annualPackage]);
    const trackPaywallEventSpy = vi.spyOn(
      purchases["eventsTracker"],
      "trackPaywallEvent",
    );

    const paywallPromise = purchases.presentPaywall({ offering });
    void paywallPromise.catch(() => undefined);

    expect(paywallProps).toBeDefined();
    paywallProps!.onComponentInteraction({
      componentType: "package",
      componentName: "Annual Package",
      componentValue: annualPackage.identifier,
      originPackageIdentifier: monthlyPackage.identifier,
      destinationPackageIdentifier: annualPackage.identifier,
      defaultPackageIdentifier: monthlyPackage.identifier,
    });

    await vi.waitFor(() => {
      expect(trackPaywallEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "paywall_component_interacted",
          componentType: "package",
          originPackageIdentifier: monthlyPackage.identifier,
          destinationPackageIdentifier: annualPackage.identifier,
          defaultPackageIdentifier: monthlyPackage.identifier,
          originProductIdentifier: "monthly",
          destinationProductIdentifier: "annual",
          defaultProductIdentifier: "monthly",
        }),
      );
    });

    paywallProps!.onBackClicked();
    await expect(paywallPromise).rejects.toHaveProperty(
      "errorCode",
      ErrorCode.UserCancelledError,
    );
  });

  test("does not fire paywall_component_interacted before impression is tracked", async () => {
    vi.mocked(mount).mockImplementationOnce((_component, options) => {
      paywallProps = options.props as PaywallMountProps;
      paywallProps.onComponentInteraction({
        componentType: "button",
        componentName: "Terms Button",
        componentValue: "navigate_to_terms",
      });
      (options.target as Element).innerHTML =
        "<div data-testid='paywall-root'></div>";
      return {} as ReturnType<typeof mount>;
    });

    const purchases = configurePurchases();
    const offering = createOfferingWithPaywall();
    const trackPaywallEventSpy = vi.spyOn(
      purchases["eventsTracker"],
      "trackPaywallEvent",
    );

    const paywallPromise = purchases.presentPaywall({ offering });
    void paywallPromise.catch(() => undefined);

    expect(paywallProps).toBeDefined();
    paywallProps!.onBackClicked();
    await expect(paywallPromise).rejects.toHaveProperty(
      "errorCode",
      ErrorCode.UserCancelledError,
    );

    expect(
      trackPaywallEventSpy.mock.calls.map(([event]) => event.type),
    ).toEqual(["paywall_impression", "paywall_close"]);
  });

  test("does not fire paywall_component_interacted after the paywall has closed", async () => {
    const purchases = configurePurchases();
    const offering = createOfferingWithPaywall();
    const trackPaywallEventSpy = vi.spyOn(
      purchases["eventsTracker"],
      "trackPaywallEvent",
    );

    const paywallPromise = purchases.presentPaywall({ offering });
    void paywallPromise.catch(() => undefined);

    expect(paywallProps).toBeDefined();
    paywallProps!.onBackClicked();
    await expect(paywallPromise).rejects.toHaveProperty(
      "errorCode",
      ErrorCode.UserCancelledError,
    );

    paywallProps!.onComponentInteraction({
      componentType: "button",
      componentName: "Terms Button",
      componentValue: "navigate_to_terms",
    });

    expect(
      trackPaywallEventSpy.mock.calls.map(([event]) => event.type),
    ).toEqual(["paywall_impression", "paywall_close"]);
  });
});
