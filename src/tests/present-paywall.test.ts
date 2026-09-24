import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { mount } from "svelte";
import type { Offering } from "../entities/offerings";
import type { ProductResponse } from "../networking/responses/products-response";
import type { PurchaseResult } from "../entities/purchase-result";
import type { PaywallListener } from "../entities/paywall-listener";
import type { PaywallInteractionEvent } from "../entities/paywall-interaction-event";
import type { ComponentInteractionData } from "@revenuecat/purchases-ui-js";
import { ErrorCode, Purchases } from "../main";
import { configurePurchases, server } from "./base.purchases_test";
import { createMonthlyPackageMock } from "./mocks/offering-mock-provider";
import { APIGetRequest } from "./test-responses";

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

const createOfferingWithTwoPackages = (): Offering => {
  const offering = createOfferingWithPaywall();
  const monthlyPackage = offering.monthly!;
  const additionalProduct = {
    ...monthlyPackage.webBillingProduct,
    identifier: "additional_product",
  };
  const additionalPackage = {
    ...monthlyPackage,
    identifier: "additional_package",
    rcBillingProduct: additionalProduct,
    webBillingProduct: additionalProduct,
  };

  return {
    ...offering,
    packagesById: {
      ...offering.packagesById,
      [additionalPackage.identifier]: additionalPackage,
    },
    availablePackages: [monthlyPackage, additionalPackage],
  };
};

const discountedPurchaseOptionId = "discnt_test_discount;dc=SAVE50";

const discountedMonthlyProductResponse: ProductResponse = {
  identifier: "monthly",
  product_type: "subscription",
  title: "Monthly test",
  description: null,
  default_purchase_option_id: discountedPurchaseOptionId,
  purchase_options: {
    [discountedPurchaseOptionId]: {
      id: discountedPurchaseOptionId,
      price_id: "test_price_id",
      base: {
        period_duration: "P1M",
        cycle_count: 1,
        price: {
          amount_micros: 3000000,
          currency: "USD",
        },
      },
      trial: null,
      intro_price: null,
      discount: {
        duration_mode: "one_time",
        time_window: null,
        discount_type: "percentage",
        percentage: 50,
        fixed_amount_micros: null,
        amount_micros: 1500000,
        currency: "USD",
        name: "Half off",
      },
    },
  },
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

  test("fetches discounted products before rendering a supplied offering", async () => {
    const purchases = configurePurchases();
    const offering = createOfferingWithPaywall();
    const getWalletButtonRenderSpy = vi.spyOn(
      purchases,
      "getWalletButtonRender",
    );
    const purchaseSpy = vi
      .spyOn(purchases, "purchase")
      .mockResolvedValue({} as PurchaseResult);
    const productsUrl =
      "http://localhost:8000/rcbilling/v1/subscribers/someAppUserId/products";
    server.use(
      http.get(productsUrl, ({ request }) => {
        APIGetRequest({ url: request.url });
        return HttpResponse.json({
          product_details: [discountedMonthlyProductResponse],
        });
      }),
    );

    void purchases.presentPaywall({ offering, discountCode: "SAVE50" });

    await vi.waitFor(() => expect(mountedProps).toBeDefined());
    expect(APIGetRequest).toHaveBeenCalledWith({
      url: `${productsUrl}?id=monthly&currency=USD&discount_code=SAVE50`,
    });
    expect(APIGetRequest).not.toHaveBeenCalledWith({
      url: "http://localhost:8000/v1/subscribers/someAppUserId/offerings",
    });
    expect(mountedProps?.infoPerPackage).toEqual({
      $rc_monthly: {
        hasTrial: false,
        hasIntroOffer: false,
        hasPromoOffer: true,
      },
    });
    expect(mountedProps?.variablesPerPackage).toMatchObject({
      $rc_monthly: {
        "product.price": "$3.00",
        "product.offer_price": "$1.50",
      },
    });
    const walletOffering = getWalletButtonRenderSpy.mock.calls[0]?.[0];
    expect(
      walletOffering?.monthly?.webBillingProduct.defaultPurchaseOption.id,
    ).toBe(discountedPurchaseOptionId);
    (mountedProps?.onPurchaseClicked as (selectedPackageId: string) => void)(
      "$rc_monthly",
    );
    await vi.waitFor(() => {
      expect(purchaseSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          discountCode: "SAVE50",
          rcPackage: expect.objectContaining({
            webBillingProduct: expect.objectContaining({
              discountPhase: expect.objectContaining({ percentage: 50 }),
              defaultPurchaseOption: expect.objectContaining({
                id: discountedPurchaseOptionId,
              }),
              presentedOfferingContext:
                offering.monthly?.webBillingProduct.presentedOfferingContext,
            }),
          }),
        }),
      );
    });
  });

  test("renders the supplied offering when fetching discounted products fails", async () => {
    const purchases = configurePurchases();
    const offering = createOfferingWithPaywall();
    const getWalletButtonRenderSpy = vi.spyOn(
      purchases,
      "getWalletButtonRender",
    );
    const productsUrl =
      "http://localhost:8000/rcbilling/v1/subscribers/someAppUserId/products";
    server.use(http.get(productsUrl, () => HttpResponse.error()));

    void purchases.presentPaywall({ offering, discountCode: "SAVE50" });

    await vi.waitFor(() => expect(mountedProps).toBeDefined());
    expect(getWalletButtonRenderSpy.mock.calls[0]?.[0]).toBe(offering);
  });

  test("retains supplied products when the discounted response is empty", async () => {
    const purchases = configurePurchases();
    const offering = createOfferingWithPaywall();
    const getWalletButtonRenderSpy = vi.spyOn(
      purchases,
      "getWalletButtonRender",
    );
    const productsUrl =
      "http://localhost:8000/rcbilling/v1/subscribers/someAppUserId/products";
    server.use(
      http.get(productsUrl, () => HttpResponse.json({ product_details: [] })),
    );

    void purchases.presentPaywall({ offering, discountCode: "SAVE50" });

    await vi.waitFor(() => expect(mountedProps).toBeDefined());
    const walletOffering = getWalletButtonRenderSpy.mock.calls[0]?.[0];
    expect(walletOffering?.availablePackages).toEqual(
      offering.availablePackages,
    );
    expect(walletOffering?.monthly).toBe(offering.monthly);
  });

  test("retains products missing from a partial discounted response", async () => {
    const purchases = configurePurchases();
    const offering = createOfferingWithTwoPackages();
    const getWalletButtonRenderSpy = vi.spyOn(
      purchases,
      "getWalletButtonRender",
    );
    const productsUrl =
      "http://localhost:8000/rcbilling/v1/subscribers/someAppUserId/products";
    server.use(
      http.get(productsUrl, () =>
        HttpResponse.json({
          product_details: [discountedMonthlyProductResponse],
        }),
      ),
    );

    void purchases.presentPaywall({ offering, discountCode: "SAVE50" });

    await vi.waitFor(() => expect(mountedProps).toBeDefined());
    const walletOffering = getWalletButtonRenderSpy.mock.calls[0]?.[0];
    expect(walletOffering?.availablePackages).toHaveLength(2);
    expect(
      walletOffering?.monthly?.webBillingProduct.defaultPurchaseOption.id,
    ).toBe(discountedPurchaseOptionId);
    expect(
      walletOffering?.packagesById.additional_package?.webBillingProduct,
    ).toBe(offering.packagesById.additional_package?.webBillingProduct);
  });

  test("includes the discount code in initial offering resolution", async () => {
    const purchases = configurePurchases();
    const offering = createOfferingWithPaywall();
    const getOfferingsSpy = vi
      .spyOn(purchases, "getOfferings")
      .mockResolvedValue({
        all: { [offering.identifier]: offering },
        current: offering,
      });

    void purchases.presentPaywall({ discountCode: "SAVE50" });

    await vi.waitFor(() => expect(mountedProps).toBeDefined());
    expect(getOfferingsSpy).toHaveBeenCalledExactlyOnceWith({
      offeringIdentifier: "current",
      discountCode: "SAVE50",
    });
  });

  test("passes the app user ID and environment for custom checkout URLs", async () => {
    const purchases = configurePurchases();
    const offering = createOfferingWithPaywall();

    void purchases.presentPaywall({ offering });

    await vi.waitFor(() => expect(mountedProps).toBeDefined());
    expect(mountedProps).toMatchObject({
      appUserId: purchases.getAppUserId(),
      isSandbox: purchases.isSandbox(),
    });
  });
});
