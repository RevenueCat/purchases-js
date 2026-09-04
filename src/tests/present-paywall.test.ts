import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { mount } from "svelte";
import type { Offering } from "../entities/offerings";
import type { PurchaseResult } from "../entities/purchase-result";
import type { PaywallListener } from "../entities/paywall-listener";
import type { PaywallInteractionEvent } from "../entities/paywall-interaction-event";
import type { ComponentInteractionData } from "@revenuecat/purchases-ui-js";
import { ErrorCode, Purchases } from "../main";
import { configurePurchases } from "./base.purchases_test";
import { createMonthlyPackageMock } from "./mocks/offering-mock-provider";

vi.mock("svelte", () => ({
  mount: vi.fn(),
  unmount: vi.fn(),
}));

type PaywallMountProps = {
  onPurchaseClicked: (selectedPackageId: string) => void;
  onBackClicked: () => void;
  onComponentInteraction: (data: ComponentInteractionData) => void;
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

describe("Purchases.presentPaywall()", () => {
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

  test("forwards an external purchase token ID to purchases started from the paywall", async () => {
    const purchases = configurePurchases();
    const offering = createOfferingWithPaywall();
    const packageId = offering.availablePackages[0]!.identifier;
    const purchaseSpy = vi
      .spyOn(purchases, "purchase")
      .mockResolvedValue({} as PurchaseResult);

    void purchases.presentPaywall({
      offering,
      externalPurchaseTokenId: "rcat_external_purchase_token_123",
    });

    await vi.waitFor(() => expect(paywallProps).toBeDefined());
    paywallProps!.onPurchaseClicked(packageId);

    await vi.waitFor(() => {
      expect(purchaseSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          externalPurchaseTokenId: "rcat_external_purchase_token_123",
        }),
      );
    });
  });

  test("forwards an external purchase token ID to paywall express checkout", async () => {
    const purchases = configurePurchases();
    const offering = createOfferingWithPaywall();
    const getWalletButtonRenderSpy = vi.spyOn(
      purchases,
      "getWalletButtonRender",
    );

    void purchases.presentPaywall({
      offering,
      externalPurchaseTokenId: "rcat_external_purchase_token_123",
    });

    await vi.waitFor(() => {
      expect(getWalletButtonRenderSpy).toHaveBeenCalledWith(
        offering,
        expect.any(Function),
        undefined,
        expect.any(Function),
        undefined,
        undefined,
        "rcat_external_purchase_token_123",
      );
    });
  });

  test("calls listener.onInteraction with the listener as receiver", async () => {
    const purchases = configurePurchases();
    const offering = createOfferingWithPaywall();
    class AnalyticsListener implements PaywallListener {
      received: PaywallInteractionEvent[] = [];
      onInteraction(event: PaywallInteractionEvent) {
        this.received.push(event);
      }
    }
    const listener = new AnalyticsListener();

    const paywallPromise = purchases.presentPaywall({ offering, listener });
    void paywallPromise.catch(() => undefined);

    await vi.waitFor(() => expect(paywallProps).toBeDefined());
    paywallProps!.onComponentInteraction({
      componentType: "button",
      componentName: "Terms",
      componentValue: "navigate_to_terms",
    });

    await vi.waitFor(() => expect(listener.received).toHaveLength(1));
    expect(listener.received[0].component_value).toBe("navigate_to_terms");

    paywallProps!.onBackClicked();
    await expect(paywallPromise).rejects.toHaveProperty(
      "errorCode",
      ErrorCode.UserCancelledError,
    );
  });
});

describe("Purchases.presentPaywall() paywall context", () => {
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

  test("passes offering, packages, and isPreview on the Paywall mount", async () => {
    const purchases = configurePurchases();
    const offering = createOfferingWithPaywall();

    void purchases.presentPaywall({ offering });

    await vi.waitFor(() => expect(mountedProps).toBeDefined());
    expect(mountedProps?.offering).toEqual({
      identifier: offering.identifier,
      display_name: offering.serverDescription,
    });
    expect(mountedProps?.packages).toEqual(
      Purchases.buildPaywallContextPackages(offering),
    );
    expect(mountedProps?.isPreview).toBe(false);
    expect(mountedProps).not.toHaveProperty("workflow");
  });
});
