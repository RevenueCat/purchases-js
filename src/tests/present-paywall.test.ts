import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { mount } from "svelte";
import { http, HttpResponse } from "msw";
import type { PaymentRequest, Stripe } from "@stripe/stripe-js";
import type { Offering } from "../entities/offerings";
import type { PurchaseResult } from "../entities/purchase-result";
import type { PaywallListener } from "../entities/paywall-listener";
import type { PaywallInteractionEvent } from "../entities/paywall-interaction-event";
import type { ComponentInteractionData } from "@revenuecat/purchases-ui-js";
import type { StripeBillingApplePayCheckoutStartResponse } from "../networking/responses/checkout-start-response";
import { BackendErrorCode } from "../entities/errors";
import { StripeService } from "../stripe/stripe-service";
import { ErrorCode, Purchases } from "../main";
import { configurePurchases, server, testUserId } from "./base.purchases_test";
import { createMonthlyPackageMock } from "./mocks/offering-mock-provider";

vi.mock("svelte", () => ({
  mount: vi.fn(),
  unmount: vi.fn(),
}));

type PaywallMountProps = {
  onPurchaseClicked: (selectedPackageId: string) => void;
  onBackClicked: () => void;
  onComponentInteraction: (data: ComponentInteractionData) => void;
  prepareWalletPurchase?: (selectedPackageId: string) => Promise<boolean>;
  onWalletPurchaseClicked?: (selectedPackageId: string) => Promise<void>;
};

const applePayStartResponse =
  (): StripeBillingApplePayCheckoutStartResponse => ({
    operation_session_id: "prepared-operation-session",
    gateway_params: null,
    stripe_billing_params: null,
    stripe_billing_apple_pay_params: {
      publishable_api_key: "pk_test_123",
      stripe_account_id: "acct_123",
      account_country: "US",
      amount_in_micros: 9_990_000,
      currency: "USD",
      expires_at: new Date(Date.now() + 60_000).toISOString(),
    },
    management_url: "https://pay.revenuecat.com/manage/session",
    paddle_billing_params: null,
    checkout_mode: "purchase",
  });

const mockAvailableApplePay = () => {
  const paymentRequest = {
    canMakePayment: vi.fn().mockResolvedValue({ applePay: true }),
    on: vi.fn(),
    off: vi.fn(),
    show: vi.fn(),
  } as unknown as PaymentRequest;
  const stripe = {
    paymentRequest: vi.fn(() => paymentRequest),
  } as unknown as Stripe;
  vi.spyOn(StripeService, "getStripeClient").mockResolvedValue({ stripe });
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

  test("passes prepareWalletPurchase and onWalletPurchaseClicked to the Paywall mount", async () => {
    const purchases = configurePurchases();
    const offering = createOfferingWithPaywall();

    void purchases.presentPaywall({ offering });

    await vi.waitFor(() => expect(paywallProps).toBeDefined());
    expect(paywallProps?.prepareWalletPurchase).toBeInstanceOf(Function);
    expect(paywallProps?.onWalletPurchaseClicked).toBeInstanceOf(Function);
  });

  test("prepareWalletPurchase resolves false on a non-Stripe API key without calling the backend", async () => {
    const purchases = configurePurchases();
    const offering = createOfferingWithPaywall();
    const packageId = offering.availablePackages[0]!.identifier;
    const prepareSpy = vi.spyOn(purchases, "prepareForQuickPurchases");

    void purchases.presentPaywall({ offering });

    await vi.waitFor(() => expect(paywallProps).toBeDefined());
    await expect(paywallProps!.prepareWalletPurchase!(packageId)).resolves.toBe(
      false,
    );
    expect(prepareSpy).not.toHaveBeenCalled();
  });

  test("prepareWalletPurchase resolves the prepared applePayAvailable value on a Stripe key", async () => {
    server.use(
      http.post("http://localhost:8000/rcbilling/v1/checkout/start", () => {
        return HttpResponse.json(applePayStartResponse());
      }),
    );
    mockAvailableApplePay();
    const purchases = configurePurchases(
      testUserId,
      "rcSource",
      "strp_test_api_key",
    );
    const offering = createOfferingWithPaywall();
    const packageId = offering.availablePackages[0]!.identifier;

    void purchases.presentPaywall({ offering });

    await vi.waitFor(() => expect(paywallProps).toBeDefined());
    await expect(paywallProps!.prepareWalletPurchase!(packageId)).resolves.toBe(
      true,
    );
  });

  test("prepareWalletPurchase resolves false when preparation throws", async () => {
    server.use(
      http.post("http://localhost:8000/rcbilling/v1/checkout/start", () => {
        return HttpResponse.json(
          {
            code: BackendErrorCode.BackendInvalidAPIKey,
            message: "API key was wrong",
          },
          { status: 401 },
        );
      }),
    );
    const purchases = configurePurchases(
      testUserId,
      "rcSource",
      "strp_test_api_key",
    );
    const offering = createOfferingWithPaywall();
    const packageId = offering.availablePackages[0]!.identifier;

    void purchases.presentPaywall({ offering });

    await vi.waitFor(() => expect(paywallProps).toBeDefined());
    await expect(paywallProps!.prepareWalletPurchase!(packageId)).resolves.toBe(
      false,
    );
  });

  test("onWalletPurchaseClicked calls purchase with tryWithApplePay: true and the normal click's rcPackage", async () => {
    const offering = createOfferingWithPaywall();
    const packageId = offering.availablePackages[0]!.identifier;

    const normalPurchases = configurePurchases(
      testUserId,
      "rcSource",
      "strp_test_api_key",
    );
    const normalSpy = vi
      .spyOn(normalPurchases, "purchase")
      .mockResolvedValue({} as PurchaseResult);
    void normalPurchases.presentPaywall({ offering });
    await vi.waitFor(() => expect(paywallProps).toBeDefined());
    paywallProps!.onPurchaseClicked(packageId);
    await vi.waitFor(() => expect(normalSpy).toHaveBeenCalledTimes(1));
    const normalArgs = normalSpy.mock.calls[0][0];

    paywallProps = undefined;
    const walletPurchases = configurePurchases(
      testUserId,
      "rcSource",
      "strp_test_api_key",
    );
    const walletSpy = vi
      .spyOn(walletPurchases, "purchase")
      .mockResolvedValue({} as PurchaseResult);
    void walletPurchases.presentPaywall({ offering });
    await vi.waitFor(() => expect(paywallProps).toBeDefined());
    await paywallProps!.onWalletPurchaseClicked!(packageId);

    expect(walletSpy).toHaveBeenCalledTimes(1);
    const walletArgs = walletSpy.mock.calls[0][0];
    expect(walletArgs).toMatchObject({
      rcPackage: normalArgs.rcPackage,
      tryWithApplePay: true,
    });
    expect(normalArgs.tryWithApplePay).toBeFalsy();
  });

  test("a second onWalletPurchaseClicked call while a purchase is in flight is a no-op", async () => {
    const purchases = configurePurchases(
      testUserId,
      "rcSource",
      "strp_test_api_key",
    );
    const offering = createOfferingWithPaywall();
    const packageId = offering.availablePackages[0]!.identifier;
    let resolvePurchase: (value: PurchaseResult) => void = () => {};
    const purchaseSpy = vi.spyOn(purchases, "purchase").mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePurchase = resolve;
        }),
    );

    void purchases.presentPaywall({ offering });
    await vi.waitFor(() => expect(paywallProps).toBeDefined());

    void paywallProps!.onWalletPurchaseClicked!(packageId);
    void paywallProps!.onWalletPurchaseClicked!(packageId);

    expect(purchaseSpy).toHaveBeenCalledTimes(1);
    resolvePurchase({} as PurchaseResult);
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
