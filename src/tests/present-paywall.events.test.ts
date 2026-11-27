import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { mount } from "svelte";
import { configurePurchases, server, testUserId } from "./base.purchases_test";
import { http, HttpResponse } from "msw";
import { createMonthlyPackageMock } from "./mocks/offering-mock-provider";
import {
  CustomVariableValue,
  ErrorCode,
  FLOW_EVENT_KEYS,
  FLOW_EVENT_TYPES,
  type FlowEvent,
  type PaywallListener,
  type Purchases,
  PurchasesError,
} from "../main";
import type { Offering, Package } from "../entities/offerings";
import type { CompleteWorkflowNavigateArgs } from "../entities/present-paywall-params";
import type { PurchaseResult } from "../entities/purchase-result";
import type {
  ComponentInteractionData,
  WorkflowData,
  WorkflowStepChangeEvent,
} from "@revenuecat/purchases-ui-js";
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
  onCustomWebCheckout?: (url: string) => void;
};

const createOfferingWithPaywall = (
  availablePackages: Package[] = [createMonthlyPackageMock()],
): Offering => {
  const monthlyPackage =
    availablePackages.find((pkg) => pkg.identifier === "$rc_monthly") ??
    availablePackages[0];
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
    product: {
      ...monthlyPackage.product,
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

  test("passes an appearance override to the purchase started from the paywall", async () => {
    const purchases = configurePurchases();
    const offering = createOfferingWithPaywall();
    const packageId = offering.availablePackages[0].identifier;
    const purchaseSpy = vi
      .spyOn(purchases, "purchase")
      .mockResolvedValue({} as PurchaseResult);

    void purchases.presentPaywall({
      offering,
      brandingAppearanceOverride: {
        color_buttons_primary: "#ffffff",
        color_page_bg: "#101010",
      },
    });

    await vi.waitFor(() => {
      expect(paywallProps).toBeDefined();
    });
    paywallProps!.onPurchaseClicked(packageId);

    await vi.waitFor(() => {
      expect(purchaseSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          brandingAppearanceOverride: {
            color_buttons_primary: "#ffffff",
            color_page_bg: "#101010",
          },
        }),
      );
    });
  });

  test("fires paywall_cancel and paywall_close when purchase is cancelled and paywall is dismissed", async () => {
    const purchases = configurePurchases();
    const offering = createOfferingWithPaywall();
    const packageId = offering.availablePackages[0].identifier;
    const trackPaywallEventSpy = vi.spyOn(
      purchases["eventsTracker"],
      "trackPaywallEvent",
    );
    vi.spyOn(purchases, "purchase").mockRejectedValue(
      new PurchasesError(ErrorCode.UserCancelledError),
    );

    const paywallPromise = purchases.presentPaywall({ offering });

    await vi.waitFor(() => {
      expect(paywallProps).toBeDefined();
    });
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
        async () =>
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

    await vi.waitFor(() => {
      expect(paywallProps).toBeDefined();
    });
    paywallProps!.onPurchaseClicked(offering.availablePackages[0].identifier);
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
    const packageId = offering.availablePackages[0].identifier;
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

    await vi.waitFor(() => {
      expect(paywallProps).toBeDefined();
    });
    paywallProps!.onPurchaseClicked(packageId);

    await vi.waitFor(() => {
      expect(trackPaywallEventSpy).toHaveBeenCalledTimes(1);
    });
    expect(
      trackPaywallEventSpy.mock.calls.map(([event]) => event.type),
    ).toEqual(["paywall_impression"]);
  });

  test("ignores rapid package clicks while a purchase is already in flight", async () => {
    const purchases = configurePurchases();
    const offering = createOfferingWithPaywall();
    const packageId = offering.availablePackages[0].identifier;
    let resolvePurchase: ((value: PurchaseResult) => void) | undefined;
    const purchaseSpy = vi.spyOn(purchases, "purchase").mockImplementation(
      async () =>
        new Promise<PurchaseResult>((resolve) => {
          resolvePurchase = resolve;
        }),
    );
    const onPurchaseStarted = vi.fn();

    void purchases.presentPaywall({
      offering,
      listener: { onPurchaseStarted },
    });

    await vi.waitFor(() => {
      expect(paywallProps).toBeDefined();
    });
    paywallProps!.onPurchaseClicked(packageId);
    paywallProps!.onPurchaseClicked(packageId);
    paywallProps!.onPurchaseClicked(packageId);

    await vi.waitFor(() => {
      expect(purchaseSpy).toHaveBeenCalledTimes(1);
    });
    expect(onPurchaseStarted).toHaveBeenCalledTimes(1);

    resolvePurchase?.({
      customerInfo: {} as PurchaseResult["customerInfo"],
      redemptionInfo: null,
      operationSessionId: "opsess",
      storeTransaction: {
        storeTransactionId: "opsess",
        productIdentifier: "monthly",
        purchaseDate: new Date(),
      },
    });
  });

  test("allows another package click after the previous purchase attempt finishes", async () => {
    const purchases = configurePurchases();
    const offering = createOfferingWithPaywall();
    const packageId = offering.availablePackages[0].identifier;
    const purchaseSpy = vi
      .spyOn(purchases, "purchase")
      .mockRejectedValue(new PurchasesError(ErrorCode.NetworkError));

    void purchases.presentPaywall({
      offering,
      onPurchaseError: () => {},
    });

    await vi.waitFor(() => {
      expect(paywallProps).toBeDefined();
    });
    paywallProps!.onPurchaseClicked(packageId);

    await vi.waitFor(() => {
      expect(purchaseSpy).toHaveBeenCalledTimes(1);
    });

    // Wait until the in-flight guard clears after the failed attempt.
    await vi.waitFor(() => {
      paywallProps!.onPurchaseClicked(packageId);
      expect(purchaseSpy).toHaveBeenCalledTimes(2);
    });
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

    await vi.waitFor(() => {
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
  });

  test("fires paywall_close when external code clears the paywall container", async () => {
    const purchases = configurePurchases();
    const offering = createOfferingWithPaywall();
    const packageId = offering.availablePackages[0].identifier;
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

    await vi.waitFor(() => {
      expect(paywallProps).toBeDefined();
    });
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

    await vi.waitFor(() => {
      expect(paywallProps).toBeDefined();
    });
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

  test("notifies listener.onInteraction with the documented interaction event", async () => {
    const purchases = configurePurchases();
    const offering = createOfferingWithPaywall();
    const onInteraction = vi.fn();

    const paywallPromise = purchases.presentPaywall({
      offering,
      listener: { onInteraction },
    });
    void paywallPromise.catch(() => undefined);

    await vi.waitFor(() => {
      expect(paywallProps).toBeDefined();
    });
    paywallProps!.onComponentInteraction({
      componentType: "package",
      componentName: "Monthly",
      componentValue: "$rc_monthly",
      originPackageId: "$rc_monthly",
      destinationPackageId: "$rc_monthly",
    });

    await vi.waitFor(() => {
      expect(onInteraction).toHaveBeenCalledTimes(1);
    });
    expect(onInteraction).toHaveBeenCalledWith({
      timestamp: expect.any(Number),
      session_id: expect.any(String),
      offering_id: "paywall-offering-id",
      paywall_id: "paywall-public-id",
      paywall_revision: expect.any(Number),
      display_mode: "full_screen",
      dark_mode: expect.any(Boolean),
      locale: expect.any(String),
      component_type: "package",
      component_name: "Monthly",
      component_value: "$rc_monthly",
      origin_package_id: "$rc_monthly",
      destination_package_id: "$rc_monthly",
      origin_product_id: "monthly",
      destination_product_id: "monthly",
    });

    paywallProps!.onBackClicked();
    await expect(paywallPromise).rejects.toHaveProperty(
      "errorCode",
      ErrorCode.UserCancelledError,
    );
  });

  test("notifies listener.onInteraction when analytics collection is disabled", async () => {
    const purchases = configurePurchases(undefined, undefined, undefined, {
      collectAnalyticsEvents: false,
    });
    const offering = createOfferingWithPaywall();
    const onInteraction = vi.fn();

    const paywallPromise = purchases.presentPaywall({
      offering,
      listener: { onInteraction },
    });
    void paywallPromise.catch(() => undefined);

    await vi.waitFor(() => {
      expect(paywallProps).toBeDefined();
    });
    paywallProps!.onComponentInteraction({
      componentType: "button",
      componentValue: "restore_purchases",
    });

    await vi.waitFor(() => {
      expect(onInteraction).toHaveBeenCalledTimes(1);
    });
    expect(onInteraction.mock.calls[0][0]).toMatchObject({
      component_type: "button",
      component_value: "restore_purchases",
    });

    paywallProps!.onBackClicked();
    await expect(paywallPromise).rejects.toHaveProperty(
      "errorCode",
      ErrorCode.UserCancelledError,
    );
  });

  test("does not notify listener.onInteraction after the paywall closed", async () => {
    const purchases = configurePurchases();
    const offering = createOfferingWithPaywall();
    const onInteraction = vi.fn();

    const paywallPromise = purchases.presentPaywall({
      offering,
      listener: { onInteraction },
    });
    void paywallPromise.catch(() => undefined);

    await vi.waitFor(() => {
      expect(paywallProps).toBeDefined();
    });
    paywallProps!.onBackClicked();
    await expect(paywallPromise).rejects.toHaveProperty(
      "errorCode",
      ErrorCode.UserCancelledError,
    );

    paywallProps!.onComponentInteraction({
      componentType: "button",
      componentValue: "restore_purchases",
    });

    expect(onInteraction).not.toHaveBeenCalled();
  });

  test("still tracks the interaction when listener.onInteraction throws", async () => {
    const purchases = configurePurchases();
    const offering = createOfferingWithPaywall();
    const trackPaywallEventSpy = vi.spyOn(
      purchases["eventsTracker"],
      "trackPaywallEvent",
    );
    const errorLogSpy = vi
      .spyOn(Logger, "errorLog")
      .mockImplementation(() => {});
    const onInteraction = vi.fn(() => {
      throw new Error("developer bug");
    });

    const paywallPromise = purchases.presentPaywall({
      offering,
      listener: { onInteraction },
    });
    void paywallPromise.catch(() => undefined);

    await vi.waitFor(() => {
      expect(paywallProps).toBeDefined();
    });
    paywallProps!.onComponentInteraction({
      componentType: "button",
      componentValue: "restore_purchases",
    });

    await vi.waitFor(() => {
      expect(onInteraction).toHaveBeenCalledTimes(1);
    });
    expect(trackPaywallEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "paywall_component_interacted" }),
    );
    expect(errorLogSpy).toHaveBeenCalledWith(
      expect.stringContaining("Error in listener.onInteraction"),
    );

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

    await vi.waitFor(() => {
      expect(paywallProps).toBeDefined();
    });
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

    await vi.waitFor(() => {
      expect(paywallProps).toBeDefined();
    });
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

    await vi.waitFor(() => {
      expect(paywallProps).toBeDefined();
    });
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

    await vi.waitFor(() => {
      expect(paywallProps).toBeDefined();
    });
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

    await vi.waitFor(() => {
      expect(paywallProps).toBeDefined();
    });
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

    await vi.waitFor(() => {
      expect(paywallProps).toBeDefined();
    });
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

    await vi.waitFor(() => {
      expect(paywallProps).toBeDefined();
    });
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

    await vi.waitFor(() => {
      expect(paywallProps).toBeDefined();
    });
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

    await vi.waitFor(() => {
      expect(paywallProps).toBeDefined();
    });
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

    await vi.waitFor(() => {
      expect(paywallProps).toBeDefined();
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

    await vi.waitFor(() => {
      expect(paywallProps).toBeDefined();
    });
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

  test("passes customVariables to the Paywall mount", async () => {
    const purchases = configurePurchases();
    const offering = createOfferingWithPaywall();
    const customVariables = {
      player_name: CustomVariableValue.string("Ada"),
      level: CustomVariableValue.number(42),
      is_premium: CustomVariableValue.boolean(true),
    };

    void purchases.presentPaywall({ offering, customVariables });

    await vi.waitFor(() => {
      expect(mountedProps).toBeDefined();
    });
    expect(mountedProps?.customVariables).toEqual(customVariables);
  });

  test("passes undefined customVariables when not provided", async () => {
    const purchases = configurePurchases();
    const offering = createOfferingWithPaywall();

    void purchases.presentPaywall({ offering });

    await vi.waitFor(() => {
      expect(mountedProps).toBeDefined();
    });
    expect(mountedProps?.customVariables).toBeUndefined();
  });
});

describe("Purchases.presentPaywall() custom checkout", () => {
  let paywallProps: PaywallMountProps | undefined;
  let assignMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    paywallProps = undefined;
    assignMock = vi.fn();
    vi.spyOn(browserGlobals, "getWindow").mockReturnValue({
      open: vi.fn().mockReturnValue({ focus: vi.fn() }),
      location: { assign: assignMock },
      matchMedia: vi.fn().mockReturnValue({ matches: false }),
    } as unknown as Window);

    vi.mocked(mount).mockImplementation((_component, options) => {
      paywallProps = options.props as PaywallMountProps;
      if (!(options.target instanceof Element)) {
        expect.fail("mount target is not an element");
      }
      options.target.innerHTML = "<div data-testid='paywall-root'></div>";
      return {};
    });
  });

  afterEach(() => {
    vi.mocked(browserGlobals.getWindow).mockRestore();
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  const configureWithOfferingsFlag = async (
    customWebCheckoutEnabled: boolean | undefined,
  ) => {
    server.use(
      http.get(
        `http://localhost:8000/v1/subscribers/${testUserId}/offerings`,
        () =>
          HttpResponse.json({
            current_offering_id: null,
            offerings: [],
            ...(customWebCheckoutEnabled === undefined
              ? {}
              : { custom_web_checkout_enabled: customWebCheckoutEnabled }),
          }),
      ),
    );
    const purchases = configurePurchases();
    await purchases.getOfferings();
    return purchases;
  };

  const presentAndGetMountProps = async (purchases: Purchases) => {
    void purchases.presentPaywall({ offering: createOfferingWithPaywall() });
    return vi.waitFor(() => paywallProps ?? expect.fail("paywall not mounted"));
  };

  const presentAndGetHandoff = async (purchases: Purchases) => {
    const props = await presentAndGetMountProps(purchases);
    return props.onCustomWebCheckout ?? expect.fail("custom checkout disabled");
  };

  test.each([
    { name: "enabled", flag: true, expected: "function" },
    { name: "disabled", flag: false, expected: "undefined" },
    { name: "missing", flag: undefined, expected: "undefined" },
  ])(
    "hands custom checkout to the paywall only when the project flag is $name",
    async ({ flag, expected }) => {
      const purchases = await configureWithOfferingsFlag(flag);

      const props = await presentAndGetMountProps(purchases);

      expect(typeof props.onCustomWebCheckout).toBe(expected);
    },
  );

  test.each([
    {
      name: "a web URL",
      url: "https://auth.example.com/register?rc_package=monthly",
    },
    { name: "a native deep link", url: "uchad://paywall/stripe_checkout" },
  ])(
    "flushes events and navigates to $name in the same tab",
    async ({ url }) => {
      const purchases = await configureWithOfferingsFlag(true);
      const flushAllEventsSpy = vi.spyOn(
        purchases["eventsTracker"],
        "flushAllEvents",
      );

      const onCustomWebCheckout = await presentAndGetHandoff(purchases);

      onCustomWebCheckout(url);

      expect(flushAllEventsSpy).toHaveBeenCalledOnce();
      expect(assignMock).toHaveBeenCalledExactlyOnceWith(url);
    },
  );

  test.each([
    { name: "a script URL", url: "javascript:alert(1)" },
    { name: "a data URL", url: "data:text/html,hi" },
  ])("blocks $name", async ({ url }) => {
    const purchases = await configureWithOfferingsFlag(true);
    const warnSpy = vi.spyOn(Logger, "warnLog").mockImplementation(() => {});

    const onCustomWebCheckout = await presentAndGetHandoff(purchases);

    onCustomWebCheckout(url);

    expect(assignMock).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
  });
});

const step = (id: string, screenType: string[] | undefined) => ({
  id,
  type: "screen",
  screen_id: `screen_${id}`,
  param_values: {},
  trigger_actions: {},
  triggers: [],
  outputs: {},
  metadata: screenType ? { screen_type: screenType } : null,
});

const screen = (name: string) => ({
  name,
  default_locale: "en_US",
  components_localizations: { en_US: {} },
});

describe("Purchases.presentPaywall() flow events", () => {
  type WorkflowMountProps = {
    onStepChanged: (event: WorkflowStepChangeEvent) => void;
    onClose: () => void;
    onPurchaseClicked: (selectedPackageId: string) => void;
  };

  let workflowProps: WorkflowMountProps | undefined;

  const workflowData = {
    id: "wf_1",
    display_name: "Onboarding",
    initial_step_id: "intro",
    steps: {
      intro: step("intro", ["intro"]),
      offer: step("offer", ["paywall"]),
    },
    screens: {
      screen_intro: screen("Intro"),
      screen_offer: screen("Offer"),
    },
    ui_config: {},
    content_max_width: null,
  } as unknown as WorkflowData;

  const presentWorkflow = (
    purchases: Purchases,
    listener: PaywallListener = {},
    workflow: WorkflowData = workflowData,
    sharedTarget?: HTMLElement,
  ) => {
    const offering = createOfferingWithPaywall();
    vi.spyOn(purchases["backend"], "getWorkflows").mockResolvedValue({
      workflows: [
        {
          id: "wf_1",
          display_name: "Onboarding",
          offering_id: offering.identifier,
          prefetch: false,
        },
      ],
      ui_config: {},
    });
    vi.spyOn(purchases["backend"], "getWorkflowById").mockResolvedValue(
      workflow,
    );
    const paywallPromise = purchases.presentPaywall({
      offering,
      listener,
      htmlTarget: sharedTarget,
      purchaseHtmlTarget: sharedTarget,
    });
    void paywallPromise.catch(() => undefined);
    return { offering, paywallPromise };
  };

  const walkIntroToOffer = (props: WorkflowMountProps) => {
    props.onStepChanged({
      workflowId: "wf_1",
      stepId: "intro",
      fromStepId: undefined,
      toStepId: undefined,
      reason: "start",
      isFirstStep: true,
      isLastStep: false,
    });
    props.onStepChanged({
      workflowId: "wf_1",
      stepId: "intro",
      fromStepId: undefined,
      toStepId: "offer",
      reason: "completed",
      isFirstStep: true,
      isLastStep: false,
    });
    props.onStepChanged({
      workflowId: "wf_1",
      stepId: "offer",
      fromStepId: "intro",
      toStepId: undefined,
      reason: "forward",
      isFirstStep: false,
      isLastStep: false,
    });
  };

  beforeEach(() => {
    workflowProps = undefined;
    vi.mocked(mount).mockImplementation((_component, options) => {
      workflowProps = options.props as unknown as WorkflowMountProps;
      (options.target as Element).innerHTML =
        "<div data-testid='paywall-root'></div>";
      return {} as ReturnType<typeof mount>;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  test("attributes a purchase on the paywall step to its impression session", async () => {
    const purchases = configurePurchases();
    const purchaseSpy = vi
      .spyOn(purchases, "purchase")
      .mockResolvedValue({} as PurchaseResult);
    const trackPaywallEventSpy = vi.spyOn(
      purchases["eventsTracker"],
      "trackPaywallEvent",
    );
    const { offering, paywallPromise } = presentWorkflow(purchases);

    await vi.waitFor(() => {
      expect(workflowProps).toBeDefined();
    });
    walkIntroToOffer(workflowProps!);
    const [[impression]] = trackPaywallEventSpy.mock.calls;
    expect(impression.sessionId).toEqual(expect.any(String));

    workflowProps!.onPurchaseClicked(offering.availablePackages[0].identifier);
    await expect(paywallPromise).resolves.toBeDefined();

    expect(purchaseSpy).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ paywallSessionId: impression.sessionId }),
    );
    expect(
      trackPaywallEventSpy.mock.calls.map(([event]) => event.type),
    ).toEqual(["paywall_impression", "paywall_close"]);
  });

  test("does not attribute a purchase to a paywall step the user left", async () => {
    const purchases = configurePurchases();
    const purchaseSpy = vi
      .spyOn(purchases, "purchase")
      .mockResolvedValue({} as PurchaseResult);
    const trackPaywallEventSpy = vi.spyOn(
      purchases["eventsTracker"],
      "trackPaywallEvent",
    );
    const { offering, paywallPromise } = presentWorkflow(purchases);

    await vi.waitFor(() => {
      expect(workflowProps).toBeDefined();
    });
    walkIntroToOffer(workflowProps!);
    workflowProps!.onStepChanged({
      workflowId: "wf_1",
      stepId: "intro",
      fromStepId: "offer",
      toStepId: undefined,
      reason: "back",
      isFirstStep: true,
      isLastStep: false,
    });

    workflowProps!.onPurchaseClicked(offering.availablePackages[0].identifier);
    await expect(paywallPromise).resolves.toBeDefined();

    expect(purchaseSpy).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ paywallSessionId: undefined }),
    );
    expect(
      trackPaywallEventSpy.mock.calls.map(([event]) => event.type),
    ).toEqual(["paywall_impression"]);
  });

  test("gates impressions by screen_type and reports every flow event to onFlowEvent", async () => {
    const purchases = configurePurchases();
    const onFlowEvent = vi.fn<(event: FlowEvent) => void>();
    const trackPaywallEventSpy = vi.spyOn(
      purchases["eventsTracker"],
      "trackPaywallEvent",
    );
    const trackSDKEventSpy = vi.spyOn(
      purchases["eventsTracker"],
      "trackSDKEvent",
    );
    const { offering, paywallPromise } = presentWorkflow(purchases, {
      onFlowEvent,
    });

    await vi.waitFor(() => {
      expect(workflowProps).toBeDefined();
    });
    walkIntroToOffer(workflowProps!);
    workflowProps!.onClose();

    await expect(paywallPromise).rejects.toHaveProperty(
      "errorCode",
      ErrorCode.UserCancelledError,
    );
    expect(
      trackPaywallEventSpy.mock.calls.map(([event]) => event.type),
    ).toEqual(["paywall_impression", "paywall_close"]);
    expect(trackSDKEventSpy).toHaveBeenCalledWith({
      eventName: "workflow_close",
      properties: {
        workflow_id: "wf_1",
        step_id: "offer",
        is_first_step: false,
        is_last_step: false,
      },
    });
    expect(
      onFlowEvent.mock.calls.map(
        ([event]) => event[FLOW_EVENT_KEYS.EVENT_TYPE],
      ),
    ).toEqual([
      FLOW_EVENT_TYPES.FLOW_STEP_STARTED,
      FLOW_EVENT_TYPES.FLOW_STEP_COMPLETED,
      FLOW_EVENT_TYPES.FLOW_STEP_STARTED,
      FLOW_EVENT_TYPES.PAYWALL_IMPRESSION,
      FLOW_EVENT_TYPES.FLOW_CLOSE,
      FLOW_EVENT_TYPES.PAYWALL_CLOSE,
    ]);
    expect(onFlowEvent.mock.calls[2][0]).toEqual({
      event_type: "flow_step_started",
      timestamp: expect.any(Number),
      trace_id: purchases["eventsTracker"].getTraceId(),
      flow_id: "wf_1",
      flow_name: "Onboarding",
      step_id: "offer",
      step_type: "screen",
      screen_type: ["paywall"],
      screen_name: "Offer",
      locale: "en_US",
      from_step_id: "intro",
      entry_reason: "forward",
      is_first_step: false,
      is_last_step: false,
    });
    const impression = onFlowEvent.mock.calls[3][0];
    const close = onFlowEvent.mock.calls[5][0];
    expect(impression).toMatchObject({
      flow_id: "wf_1",
      step_id: "offer",
      flow_name: "Onboarding",
      screen_name: "Offer",
      paywall_id: "paywall-public-id",
      offering_id: offering.identifier,
      session_id: trackPaywallEventSpy.mock.calls[0][0].sessionId,
      locale: "en_US",
    });
    expect(close).toMatchObject({
      flow_name: "Onboarding",
      screen_name: "Offer",
      session_id: impression.session_id,
    });
  });

  test("does not report a flow close after a purchase completes", async () => {
    const purchases = configurePurchases();
    const onFlowEvent = vi.fn();
    const trackSDKEventSpy = vi.spyOn(
      purchases["eventsTracker"],
      "trackSDKEvent",
    );
    vi.spyOn(purchases, "purchase").mockResolvedValue({} as PurchaseResult);
    const { offering, paywallPromise } = presentWorkflow(purchases, {
      onFlowEvent,
    });

    await vi.waitFor(() => {
      expect(workflowProps).toBeDefined();
    });
    walkIntroToOffer(workflowProps!);
    workflowProps!.onPurchaseClicked(offering.availablePackages[0].identifier);

    await expect(paywallPromise).resolves.toBeDefined();
    expect(
      trackSDKEventSpy.mock.calls.map(([event]) => event.eventName),
    ).not.toContain("workflow_close");
    expect(
      onFlowEvent.mock.calls.map(([event]) => event.event_type),
    ).not.toContain(FLOW_EVENT_TYPES.FLOW_CLOSE);
  });

  test.each([
    {
      failure: "throws",
      onFlowEvent: () => {
        throw new Error("listener failure");
      },
    },
    {
      failure: "rejects",
      onFlowEvent: vi
        .fn<(event: FlowEvent) => void>()
        .mockRejectedValue(new Error("listener failure")),
    },
  ])(
    "still tracks flow events when listener.onFlowEvent $failure",
    async ({ onFlowEvent }) => {
      const purchases = configurePurchases();
      const errorLogSpy = vi.spyOn(Logger, "errorLog");
      const trackPaywallEventSpy = vi.spyOn(
        purchases["eventsTracker"],
        "trackPaywallEvent",
      );
      const { paywallPromise } = presentWorkflow(purchases, { onFlowEvent });

      await vi.waitFor(() => {
        expect(workflowProps).toBeDefined();
      });
      walkIntroToOffer(workflowProps!);
      workflowProps!.onClose();

      await expect(paywallPromise).rejects.toBeDefined();
      expect(
        trackPaywallEventSpy.mock.calls.map(([event]) => event.type),
      ).toEqual(["paywall_impression", "paywall_close"]);
      await vi.waitFor(() => {
        expect(errorLogSpy).toHaveBeenCalledWith(
          expect.stringContaining("Error in listener.onFlowEvent"),
        );
      });
    },
  );

  test("reports paywall impression and close without flow keys for a standard paywall", async () => {
    const purchases = configurePurchases();
    const onFlowEvent = vi.fn<(event: FlowEvent) => void>();
    const offering = createOfferingWithPaywall();
    const paywallPromise = purchases.presentPaywall({
      offering,
      listener: { onFlowEvent },
    });

    await vi.waitFor(() => {
      expect(workflowProps).toBeDefined();
    });
    (workflowProps as unknown as PaywallMountProps).onBackClicked();

    await expect(paywallPromise).rejects.toBeDefined();
    expect(onFlowEvent.mock.calls.map(([event]) => event.event_type)).toEqual([
      FLOW_EVENT_TYPES.PAYWALL_IMPRESSION,
      FLOW_EVENT_TYPES.PAYWALL_CLOSE,
    ]);
    for (const [event] of onFlowEvent.mock.calls) {
      expect(event).toMatchObject({
        offering_id: offering.identifier,
        paywall_id: "paywall-public-id",
        trace_id: purchases["eventsTracker"].getTraceId(),
      });
      expect(event).not.toHaveProperty("flow_id");
      expect(event).not.toHaveProperty("step_id");
      expect(event).not.toHaveProperty("flow_name");
      expect(event).not.toHaveProperty("screen_name");
    }
  });

  test.each(["succeeds", "is cancelled"] as const)(
    "waits to track workflow_close when checkout clears a shared target and %s",
    async (outcome) => {
      const purchases = configurePurchases();
      const target = document.createElement("div");
      document.body.appendChild(target);
      const trackSDKEventSpy = vi.spyOn(
        purchases["eventsTracker"],
        "trackSDKEvent",
      );
      const trackPaywallEventSpy = vi.spyOn(
        purchases["eventsTracker"],
        "trackPaywallEvent",
      );
      let finishCheckout!: () => void;
      const checkoutPending = new Promise<void>((resolve) => {
        finishCheckout = resolve;
      });
      vi.spyOn(purchases, "purchase").mockImplementation(async () => {
        target.innerHTML = "";
        await checkoutPending;
        if (outcome === "is cancelled") {
          throw new PurchasesError(ErrorCode.UserCancelledError);
        }
        return {} as PurchaseResult;
      });
      const { offering, paywallPromise } = presentWorkflow(
        purchases,
        {},
        workflowData,
        target,
      );
      const paywallEventTypes = () =>
        trackPaywallEventSpy.mock.calls.map(([event]) => event.type);
      const flowCloses = () =>
        trackSDKEventSpy.mock.calls.filter(
          ([event]) => event.eventName === "workflow_close",
        );

      await vi.waitFor(() => {
        expect(workflowProps).toBeDefined();
      });
      walkIntroToOffer(workflowProps!);
      workflowProps!.onPurchaseClicked(
        offering.availablePackages[0].identifier,
      );

      await vi.waitFor(() => {
        expect(paywallEventTypes()).toEqual([
          "paywall_impression",
          "paywall_close",
        ]);
      });
      expect(flowCloses()).toHaveLength(0);
      finishCheckout();

      if (outcome === "succeeds") {
        await expect(paywallPromise).resolves.toBeDefined();
        expect(flowCloses()).toHaveLength(0);
        expect(paywallEventTypes()).toEqual([
          "paywall_impression",
          "paywall_close",
        ]);
      } else {
        await vi.waitFor(() => {
          expect(flowCloses()).toHaveLength(1);
        });
        workflowProps!.onClose();
        await expect(paywallPromise).rejects.toHaveProperty(
          "errorCode",
          ErrorCode.UserCancelledError,
        );
        expect(flowCloses()).toHaveLength(1);
        expect(paywallEventTypes()).toEqual([
          "paywall_impression",
          "paywall_close",
          "paywall_cancel",
        ]);
      }
    },
  );

  test("falls back to is_last_step for untagged steps and opens a new session on re-entry", async () => {
    const purchases = configurePurchases();
    const onFlowEvent = vi.fn<(event: FlowEvent) => void>();
    const trackPaywallEventSpy = vi.spyOn(
      purchases["eventsTracker"],
      "trackPaywallEvent",
    );
    const { paywallPromise } = presentWorkflow(
      purchases,
      { onFlowEvent },
      {
        ...workflowData,
        steps: {
          intro: step("intro", undefined),
          offer: step("offer", undefined),
        },
      },
    );

    await vi.waitFor(() => {
      expect(workflowProps).toBeDefined();
    });
    const enter = (
      stepId: string,
      reason: "start" | "forward" | "back",
      isLastStep: boolean,
    ) => {
      workflowProps!.onStepChanged({
        workflowId: "wf_1",
        stepId,
        fromStepId: undefined,
        toStepId: undefined,
        reason,
        isFirstStep: stepId === "intro",
        isLastStep,
      });
    };
    enter("intro", "start", false);
    enter("offer", "forward", true);
    enter("intro", "back", false);
    enter("offer", "forward", true);
    workflowProps!.onClose();

    await expect(paywallPromise).rejects.toBeDefined();
    const paywallEvents = trackPaywallEventSpy.mock.calls.map(
      ([event]) => event,
    );
    expect(paywallEvents.map((event) => event.type)).toEqual([
      "paywall_impression",
      "paywall_impression",
      "paywall_close",
    ]);
    expect(paywallEvents[1].sessionId).not.toEqual(paywallEvents[0].sessionId);
    expect(paywallEvents[2].sessionId).toEqual(paywallEvents[1].sessionId);
    const stepStarted = onFlowEvent.mock.calls
      .map(([event]) => event)
      .filter(
        (event) => event.event_type === FLOW_EVENT_TYPES.FLOW_STEP_STARTED,
      );
    for (const event of stepStarted) {
      expect(event).not.toHaveProperty("screen_type");
    }
  });
});
