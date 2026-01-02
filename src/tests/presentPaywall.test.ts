import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as svelte from "svelte";
import { ErrorCode } from "../entities/errors";
import { configurePurchases } from "./base.purchases_test";
import { waitFor } from "@testing-library/svelte";
import type { Offering, Package, PackageType } from "../entities/offerings";

// Minimal mock offering with paywall components
function createOfferingWithPaywall(): Offering {
  const mockPackage: Package = {
    identifier: "$rc_monthly",
    packageType: "$rc_monthly" as unknown as PackageType,
    rcBillingProduct: {
      currentPrice: {
        currency: "USD",
        amount: 300,
        amountMicros: 3000000,
        formattedPrice: "$3.00",
      },
      displayName: "Monthly",
      title: "Monthly",
      description: null,
      identifier: "monthly",
      productType: 0,
      normalPeriodDuration: "P1M",
      presentedOfferingIdentifier: "offering_with_paywall",
      presentedOfferingContext: {
        offeringIdentifier: "offering_with_paywall",
        targetingContext: null,
        placementIdentifier: null,
      },
      defaultPurchaseOption: {
        id: "base",
        priceId: "price_1",
        base: {
          cycleCount: 1,
          periodDuration: "P1M",
          period: { number: 1, unit: 1 },
          price: {
            amount: 300,
            amountMicros: 3000000,
            currency: "USD",
            formattedPrice: "$3.00",
          },
          pricePerWeek: null,
          pricePerMonth: null,
          pricePerYear: null,
        },
        trial: null,
        introPrice: null,
      },
      defaultSubscriptionOption: null,
      defaultNonSubscriptionOption: null,
      subscriptionOptions: {},
      price: {
        currency: "USD",
        amount: 300,
        amountMicros: 3000000,
        formattedPrice: "$3.00",
      },
      period: { number: 1, unit: 1 },
      freeTrialPhase: null,
      introPricePhase: null,
    },
    webBillingProduct: {
      currentPrice: {
        currency: "USD",
        amount: 300,
        amountMicros: 3000000,
        formattedPrice: "$3.00",
      },
      displayName: "Monthly",
      title: "Monthly",
      description: null,
      identifier: "monthly",
      productType: 0,
      normalPeriodDuration: "P1M",
      presentedOfferingIdentifier: "offering_with_paywall",
      presentedOfferingContext: {
        offeringIdentifier: "offering_with_paywall",
        targetingContext: null,
        placementIdentifier: null,
      },
      defaultPurchaseOption: {
        id: "base",
        priceId: "price_1",
        base: {
          cycleCount: 1,
          periodDuration: "P1M",
          period: { number: 1, unit: 1 },
          price: {
            amount: 300,
            amountMicros: 3000000,
            currency: "USD",
            formattedPrice: "$3.00",
          },
          pricePerWeek: null,
          pricePerMonth: null,
          pricePerYear: null,
        },
        trial: null,
        introPrice: null,
      },
      defaultSubscriptionOption: null,
      defaultNonSubscriptionOption: null,
      subscriptionOptions: {},
      price: {
        currency: "USD",
        amount: 300,
        amountMicros: 3000000,
        formattedPrice: "$3.00",
      },
      period: { number: 1, unit: 1 },
      freeTrialPhase: null,
      introPricePhase: null,
    },
  };

  return {
    identifier: "offering_with_paywall",
    serverDescription: "Test offering with paywall",
    metadata: null,
    packagesById: { $rc_monthly: mockPackage },
    availablePackages: [mockPackage],
    lifetime: null,
    annual: null,
    sixMonth: null,
    threeMonth: null,
    twoMonth: null,
    monthly: mockPackage,
    weekly: null,
    paywallComponents: {
      default_locale: "en_US",
      components_localizations: { en_US: {} },
      components_config: { components: [] },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
    uiConfig: {
      app: { id: "app_1" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  };
}

describe("Purchases.presentPaywall() browser back button", () => {
  let historyPushStateSpy: ReturnType<typeof vi.spyOn>;
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    historyPushStateSpy = vi.spyOn(window.history, "pushState");
    addEventListenerSpy = vi.spyOn(window, "addEventListener");
    removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
    document.body.innerHTML = "";
  });

  afterEach(() => {
    historyPushStateSpy.mockRestore();
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
    document.body.innerHTML = "";
  });

  test("pushes history state when opening fullscreen paywall", async () => {
    const mountSpy = vi.spyOn(svelte, "mount").mockImplementation(() => {
      // Return a minimal mock component
      return {} as ReturnType<typeof svelte.mount>;
    });

    const purchases = configurePurchases();
    const offeringWithPaywall = createOfferingWithPaywall();

    // Start the paywall (don't await - we want to test the setup phase)
    const paywallPromise = purchases.presentPaywall({
      offering: offeringWithPaywall,
    });

    // Verify history.pushState was called
    await waitFor(() => {
      expect(historyPushStateSpy).toHaveBeenCalledWith(
        { paywallOpen: true },
        "",
      );
    });

    // Verify popstate listener was added
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "popstate",
      expect.any(Function),
    );

    // Cleanup: trigger popstate to close the paywall
    window.dispatchEvent(new PopStateEvent("popstate"));

    await expect(paywallPromise).rejects.toHaveProperty(
      "errorCode",
      ErrorCode.UserCancelledError,
    );

    mountSpy.mockRestore();
  });

  test("closes paywall and removes listener when back button is pressed", async () => {
    const unmountSpy = vi.spyOn(svelte, "unmount").mockImplementation(() => {
      return Promise.resolve();
    });
    const mountSpy = vi.spyOn(svelte, "mount").mockImplementation(() => {
      return {} as ReturnType<typeof svelte.mount>;
    });

    const purchases = configurePurchases();
    const offeringWithPaywall = createOfferingWithPaywall();

    const paywallPromise = purchases.presentPaywall({
      offering: offeringWithPaywall,
    });

    // Wait for the paywall to be set up
    await waitFor(() => {
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "popstate",
        expect.any(Function),
      );
    });

    // Simulate browser back button
    window.dispatchEvent(new PopStateEvent("popstate"));

    // Wait for the promise to reject
    await expect(paywallPromise).rejects.toMatchObject({
      errorCode: ErrorCode.UserCancelledError,
    });

    // Verify the popstate listener was removed
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "popstate",
      expect.any(Function),
    );

    // Verify unmount was called
    expect(unmountSpy).toHaveBeenCalled();

    mountSpy.mockRestore();
    unmountSpy.mockRestore();
  });

  test("does not push history state when paywall is embedded in element", async () => {
    const mountSpy = vi.spyOn(svelte, "mount").mockImplementation(() => {
      return {} as ReturnType<typeof svelte.mount>;
    });

    const purchases = configurePurchases();
    const offeringWithPaywall = createOfferingWithPaywall();

    // Create a target element (embedded mode)
    const targetElement = document.createElement("div");
    document.body.appendChild(targetElement);

    // Start the paywall with a target element
    purchases.presentPaywall({
      offering: offeringWithPaywall,
      htmlTarget: targetElement,
    });

    // Wait a tick to ensure setup is complete
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Verify history.pushState was NOT called
    expect(historyPushStateSpy).not.toHaveBeenCalled();

    // Verify popstate listener was NOT added (for embedded mode)
    const popstateListenerCalls = addEventListenerSpy.mock.calls.filter(
      (call) => call[0] === "popstate",
    );
    expect(popstateListenerCalls).toHaveLength(0);

    mountSpy.mockRestore();
    document.body.innerHTML = "";
  });

  test("calls custom onBack callback when back button is pressed", async () => {
    const onBackMock = vi.fn();
    const mountSpy = vi.spyOn(svelte, "mount").mockImplementation(() => {
      return {} as ReturnType<typeof svelte.mount>;
    });

    const purchases = configurePurchases();
    const offeringWithPaywall = createOfferingWithPaywall();

    purchases.presentPaywall({
      offering: offeringWithPaywall,
      onBack: onBackMock,
    });

    // Wait for the paywall to be set up
    await waitFor(() => {
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "popstate",
        expect.any(Function),
      );
    });

    // Simulate browser back button
    window.dispatchEvent(new PopStateEvent("popstate"));

    // Wait a tick
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Verify the custom onBack was called
    expect(onBackMock).toHaveBeenCalled();

    mountSpy.mockRestore();
  });
});
