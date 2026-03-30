import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { mount } from "svelte";
import { configurePurchases } from "./base.purchases_test";
import { createMonthlyPackageMock } from "./mocks/offering-mock-provider";
import { ErrorCode, PurchasesError } from "../main";
import type { Offering } from "../entities/offerings";

vi.mock("svelte", () => ({
  mount: vi.fn(),
  unmount: vi.fn(),
}));

type PaywallMountProps = {
  onPurchaseClicked: (selectedPackageId: string) => void;
  onBackClicked: () => void;
};

const createOfferingWithPaywall = (): Offering => {
  const monthlyPackage = createMonthlyPackageMock();
  return {
    identifier: "paywall-offering-id",
    serverDescription: "paywall offering",
    metadata: null,
    packagesById: {
      [monthlyPackage.identifier]: monthlyPackage,
    },
    availablePackages: [monthlyPackage],
    lifetime: null,
    annual: null,
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
});
