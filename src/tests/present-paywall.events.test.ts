import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { mount } from "svelte";
import { configurePurchases } from "./base.purchases_test";
import { createMonthlyPackageMock } from "./mocks/offering-mock-provider";
import { ErrorCode, PurchasesError } from "../main";
import type { Offering } from "../entities/offerings";
import type { CompleteWorkflowNavigateArgs } from "../entities/present-paywall-params";
import * as browserGlobals from "../helpers/browser-globals";
import { Logger } from "../helpers/logger";

vi.mock("svelte", () => ({
  mount: vi.fn(),
  unmount: vi.fn(),
}));

type PaywallMountProps = {
  onPurchaseClicked: (selectedPackageId: string) => void;
  onBackClicked: () => void;
  onCompleteWorkflowNavigate: (
    args: CompleteWorkflowNavigateArgs,
  ) => void | Promise<void>;
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

describe("Purchases.presentPaywall() complete workflow navigation", () => {
  let paywallProps: PaywallMountProps | undefined;
  let assignMock: ReturnType<typeof vi.fn>;
  let openMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    paywallProps = undefined;
    assignMock = vi.fn();
    openMock = vi.fn().mockReturnValue({ focus: vi.fn() });
    vi.spyOn(browserGlobals, "getWindow").mockReturnValue({
      open: openMock,
      location: { assign: assignMock },
      matchMedia: vi.fn().mockReturnValue({ matches: false }),
    } as unknown as Window);

    vi.mocked(mount).mockImplementation((_component, options) => {
      paywallProps = options.props as PaywallMountProps;
      (options.target as Element).innerHTML =
        "<div data-testid='paywall-root'></div>";
      return {} as ReturnType<typeof mount>;
    });
  });

  afterEach(() => {
    vi.mocked(browserGlobals.getWindow).mockRestore();
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  test("default external_browser opens a new tab for https URLs", async () => {
    const purchases = configurePurchases();
    const offering = createOfferingWithPaywall();

    void purchases.presentPaywall({ offering });

    expect(paywallProps).toBeDefined();
    await paywallProps!.onCompleteWorkflowNavigate({
      url: "https://example.com/exit",
      method: "external_browser",
    });

    expect(openMock).toHaveBeenCalledWith(
      "https://example.com/exit",
      "_blank",
      "noopener,noreferrer",
    );
    expect(assignMock).not.toHaveBeenCalled();
  });

  test("default in_app_browser navigates in the same tab", async () => {
    const purchases = configurePurchases();
    const offering = createOfferingWithPaywall();

    void purchases.presentPaywall({ offering });

    await paywallProps!.onCompleteWorkflowNavigate({
      url: "https://example.com/in-app",
      method: "in_app_browser",
    });

    expect(assignMock).toHaveBeenCalledWith("https://example.com/in-app");
    expect(openMock).not.toHaveBeenCalled();
  });

  test("default deep_link allows non-http(s) schemes", async () => {
    const purchases = configurePurchases();
    const offering = createOfferingWithPaywall();

    void purchases.presentPaywall({ offering });

    await paywallProps!.onCompleteWorkflowNavigate({
      url: "myapp://complete",
      method: "deep_link",
    });

    expect(assignMock).toHaveBeenCalledWith("myapp://complete");
    expect(openMock).not.toHaveBeenCalled();
  });

  test("custom onCompleteWorkflowNavigate runs instead of default navigation", async () => {
    const custom = vi.fn().mockResolvedValue(undefined);
    const purchases = configurePurchases();
    const offering = createOfferingWithPaywall();

    void purchases.presentPaywall({
      offering,
      onCompleteWorkflowNavigate: custom,
    });

    await paywallProps!.onCompleteWorkflowNavigate({
      url: "https://example.com",
      method: "external_browser",
    });

    expect(custom).toHaveBeenCalledWith({
      url: "https://example.com",
      method: "external_browser",
    });
    expect(openMock).not.toHaveBeenCalled();
    expect(assignMock).not.toHaveBeenCalled();
  });

  test("default navigation blocks disallowed URLs", async () => {
    const purchases = configurePurchases();
    const offering = createOfferingWithPaywall();
    const warnSpy = vi.spyOn(Logger, "warnLog").mockImplementation(() => {});

    void purchases.presentPaywall({ offering });

    await paywallProps!.onCompleteWorkflowNavigate({
      url: "javascript:void(0)",
      method: "in_app_browser",
    });

    expect(warnSpy).toHaveBeenCalled();
    expect(openMock).not.toHaveBeenCalled();
    expect(assignMock).not.toHaveBeenCalled();
  });
});
