import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { mount } from "svelte";
import { configurePurchases } from "./base.purchases_test";
import { createMonthlyPackageMock } from "./mocks/offering-mock-provider";
import { CustomVariableValue, ErrorCode, PurchasesError } from "../main";
import type { Offering, Package } from "../entities/offerings";
import type { CompleteWorkflowNavigateArgs } from "../entities/present-paywall-params";
import type { ComponentInteractionData } from "@revenuecat/purchases-ui-js";
import * as browserGlobals from "../helpers/browser-globals";
import { Logger } from "../helpers/logger";

vi.mock("svelte", () => ({
  mount: vi.fn(),
  unmount: vi.fn(),
}));

type PaywallMountProps = {
  onPurchaseClicked: (selectedPackageId: string) => void;
  onBackClicked: () => void;
  onComponentInteraction: (data: ComponentInteractionData) => void;
  onCompleteWorkflowNavigate: (
    args: CompleteWorkflowNavigateArgs,
  ) => void | Promise<void>;
  onNavigateToUrlClicked: (url: string) => void;
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
    hasPaywall: true,
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

  test("threads the same paywall session id into the purchase call", async () => {
    const purchases = configurePurchases();
    const offering = createOfferingWithPaywall();
    const packageId = offering.availablePackages[0]!.identifier;
    const trackPaywallEventSpy = vi.spyOn(
      purchases["eventsTracker"],
      "trackPaywallEvent",
    );
    const purchaseSpy = vi
      .spyOn(purchases, "purchase")
      .mockRejectedValue(new PurchasesError(ErrorCode.UserCancelledError));

    const paywallPromise = purchases.presentPaywall({ offering });
    void paywallPromise.catch(() => undefined);

    expect(paywallProps).toBeDefined();
    paywallProps!.onPurchaseClicked(packageId);

    await vi.waitFor(() => {
      expect(purchaseSpy).toHaveBeenCalledTimes(1);
    });

    const impressionEvent = trackPaywallEventSpy.mock.calls
      .map(([event]) => event)
      .find((event) => event.type === "paywall_impression");
    const purchaseParams = purchaseSpy.mock.calls[0]![0];

    expect(purchaseParams.paywallSessionId).toBeDefined();
    expect(purchaseParams.paywallSessionId).toBe(impressionEvent!.sessionId);
  });

  test("passes presentedOfferingContext to paywall events", async () => {
    const purchases = configurePurchases();
    const offering = createOfferingWithPaywall();
    const trackPaywallEventSpy = vi.spyOn(
      purchases["eventsTracker"],
      "trackPaywallEvent",
    );

    const paywallPromise = purchases.presentPaywall({ offering });
    void paywallPromise.catch(() => undefined);

    expect(trackPaywallEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "paywall_impression",
        presentedOfferingContext: {
          offeringIdentifier: "offering_1",
          targetingContext: { ruleId: "test_rule_id", revision: 123 },
          placementIdentifier: null,
        },
      }),
    );
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

  test("does not open a second tab for text link callbacks when ui-js keeps native navigation", async () => {
    const purchases = configurePurchases();
    const offering = createOfferingWithPaywall();
    const htmlTarget = document.createElement("div");
    document.body.appendChild(htmlTarget);
    const openSpy = vi.spyOn(window, "open").mockReturnValue({
      focus: vi.fn(),
    } as unknown as Window);

    const paywallPromise = purchases.presentPaywall({ offering, htmlTarget });
    void paywallPromise.catch(() => undefined);

    expect(paywallProps).toBeDefined();
    const link = document.createElement("a");
    link.setAttribute("href", "#details");
    htmlTarget.appendChild(link);
    link.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );

    paywallProps!.onComponentInteraction({
      componentType: "text",
      componentName: "Legal Text",
      componentValue: "navigate_to_url",
      componentURL: "#details",
    });
    paywallProps!.onNavigateToUrlClicked("#details");
    await Promise.resolve();

    expect(openSpy).not.toHaveBeenCalled();

    paywallProps!.onBackClicked();
    await expect(paywallPromise).rejects.toHaveProperty(
      "errorCode",
      ErrorCode.UserCancelledError,
    );
  });

  test("still opens a new tab for text link callbacks when ui-js prevents default", async () => {
    const purchases = configurePurchases();
    const offering = createOfferingWithPaywall();
    const htmlTarget = document.createElement("div");
    document.body.appendChild(htmlTarget);
    const focus = vi.fn();
    const openSpy = vi.spyOn(window, "open").mockReturnValue({
      focus,
    } as unknown as Window);

    const paywallPromise = purchases.presentPaywall({ offering, htmlTarget });
    void paywallPromise.catch(() => undefined);

    expect(paywallProps).toBeDefined();
    const link = document.createElement("a");
    link.setAttribute("href", "#details");
    link.addEventListener("click", (event) => {
      event.preventDefault();
    });
    htmlTarget.appendChild(link);
    link.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );

    paywallProps!.onComponentInteraction({
      componentType: "text",
      componentName: "Legal Text",
      componentValue: "navigate_to_url",
      componentURL: "#details",
    });
    paywallProps!.onNavigateToUrlClicked("#details");
    await Promise.resolve();

    expect(openSpy).toHaveBeenCalledWith("#details", "_blank");
    expect(focus).toHaveBeenCalled();

    paywallProps!.onBackClicked();
    await expect(paywallPromise).rejects.toHaveProperty(
      "errorCode",
      ErrorCode.UserCancelledError,
    );
  });

  test("still opens a new tab for button URL callbacks", async () => {
    const purchases = configurePurchases();
    const offering = createOfferingWithPaywall();
    const focus = vi.fn();
    const openSpy = vi.spyOn(window, "open").mockReturnValue({
      focus,
    } as unknown as Window);

    const paywallPromise = purchases.presentPaywall({ offering });
    void paywallPromise.catch(() => undefined);

    expect(paywallProps).toBeDefined();
    paywallProps!.onComponentInteraction({
      componentType: "button",
      componentName: "Terms Button",
      componentValue: "navigate_to_terms",
      componentURL: "https://example.com/terms",
    });
    paywallProps!.onNavigateToUrlClicked("https://example.com/terms");

    expect(openSpy).toHaveBeenCalledWith("https://example.com/terms", "_blank");
    expect(focus).toHaveBeenCalled();

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
      originPackageId: monthlyPackage.identifier,
      destinationPackageId: annualPackage.identifier,
      defaultPackageId: monthlyPackage.identifier,
    });

    await vi.waitFor(() => {
      expect(trackPaywallEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "paywall_component_interacted",
          componentType: "package",
          originPackageId: monthlyPackage.identifier,
          destinationPackageId: annualPackage.identifier,
          defaultPackageId: monthlyPackage.identifier,
          originProductId: "monthly",
          destinationProductId: "annual",
          defaultProductId: "monthly",
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

describe("Purchases.presentPaywall() custom variables", () => {
  let mountedProps: Record<string, unknown> | undefined;

  beforeEach(() => {
    mountedProps = undefined;
    vi.mocked(mount).mockImplementation((_component, options) => {
      mountedProps = options.props as Record<string, unknown>;
      (options.target as Element).innerHTML =
        "<div data-testid='paywall-root'></div>";
      return {} as ReturnType<typeof mount>;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  test("passes customVariables to the Paywall mount", () => {
    const purchases = configurePurchases();
    const offering = createOfferingWithPaywall();
    const customVariables = {
      player_name: CustomVariableValue.string("Ada"),
      level: CustomVariableValue.number(42),
      is_premium: CustomVariableValue.boolean(true),
    };

    void purchases.presentPaywall({ offering, customVariables });

    expect(mountedProps?.customVariables).toEqual(customVariables);
  });

  test("passes undefined customVariables when not provided", () => {
    const purchases = configurePurchases();
    const offering = createOfferingWithPaywall();

    void purchases.presentPaywall({ offering });

    expect(mountedProps?.customVariables).toBeUndefined();
  });
});
