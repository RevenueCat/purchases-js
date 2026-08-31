import type {
  PaymentRequest,
  PaymentRequestPaymentMethodEvent,
  Stripe,
} from "@stripe/stripe-js";
import { afterEach, describe, expect, test, vi } from "vitest";

import type { PurchaseOperationHelper } from "../../helpers/purchase-operation-helper";
import { StripeService } from "../../stripe/stripe-service";
import {
  prepareApplePayPurchase,
  prepareApplePayPurchaseForLater,
  presentPreparedApplePayPurchase,
  tryApplePayPurchase,
  updatePreparedApplePayPurchase,
} from "../../stripe/apple-pay-purchase";
import {
  brandingInfo,
  checkoutPricingResponse,
  rcPackage,
  subscriptionOption,
} from "../../stories/fixtures";
import { Translator } from "../../ui/localization/translator";
import { createEventsTrackerMock } from "../mocks/events-tracker-mock-provider";

type PaymentRequestHandlers = {
  cancel?: () => void;
  paymentmethod?: (event: PaymentRequestPaymentMethodEvent) => void;
};

const operationResult = {
  redemptionInfo: null,
  operationSessionId: "operation-session-id",
  storeTransactionIdentifier: "transaction-id",
  productIdentifier: "product-id",
  purchaseDate: new Date("2026-08-31T00:00:00Z"),
};

const createPurchaseOperationHelper = () =>
  ({
    checkoutComplete: vi.fn().mockResolvedValue({
      operation_session_id: "operation-session-id",
      gateway_params: { client_secret: "pi_secret" },
      checkout_mode: "purchase",
    }),
    checkoutRefreshPricing: vi.fn().mockResolvedValue(checkoutPricingResponse),
    pollCurrentPurchaseForCompletion: vi
      .fn()
      .mockResolvedValue(operationResult),
  }) as unknown as PurchaseOperationHelper;

const createStripeMocks = ({
  canMakePayment = { applePay: true },
  onShow,
}: {
  canMakePayment?: { applePay: boolean } | null;
  onShow?: (handlers: PaymentRequestHandlers) => void;
} = {}) => {
  const handlers: PaymentRequestHandlers = {};
  const paymentRequest = {
    canMakePayment: vi.fn().mockResolvedValue(canMakePayment),
    on: vi.fn(
      (
        eventName: keyof PaymentRequestHandlers,
        handler: PaymentRequestHandlers[typeof eventName],
      ) => {
        handlers[eventName] = handler as never;
      },
    ),
    off: vi.fn(),
    update: vi.fn(),
    show: vi.fn(() => onShow?.(handlers)),
    abort: vi.fn(),
  } as unknown as PaymentRequest;
  const stripe = {
    paymentRequest: vi.fn(() => paymentRequest),
    confirmCardPayment: vi.fn().mockResolvedValue({
      paymentIntent: { status: "succeeded" },
    }),
    confirmCardSetup: vi.fn(),
  } as unknown as Stripe;

  return { handlers, paymentRequest, stripe };
};

const createPaymentMethodEvent = (): PaymentRequestPaymentMethodEvent =>
  ({
    payerEmail: "wallet@example.com",
    paymentMethod: {
      id: "pm_apple_pay",
      billing_details: {
        email: "billing@example.com",
        address: {
          country: "US",
          postal_code: "94107",
          state: "CA",
          city: "San Francisco",
          line1: "123 Main Street",
          line2: null,
        },
      },
    },
    complete: vi.fn(),
  }) as unknown as PaymentRequestPaymentMethodEvent;

const createParams = (
  purchaseOperationHelper: PurchaseOperationHelper,
  accountCountry: string | null = "US",
) => ({
  gatewayParams: {
    stripe_account_id: "acct_123",
    publishable_api_key: "pk_test_123",
    account_country: accountCountry,
  },
  managementUrl: "https://pay.revenuecat.com/manage/session",
  product: rcPackage.webBillingProduct,
  purchaseOption: subscriptionOption,
  priceBreakdown: {
    currency: checkoutPricingResponse.currency,
    totalAmountInMicros: checkoutPricingResponse.total_amount_in_micros,
    totalExcludingTaxInMicros:
      checkoutPricingResponse.total_excluding_tax_in_micros,
    taxCalculationStatus: "disabled" as const,
    taxAmountInMicros: null,
    taxBreakdown: null,
  },
  brandingInfo: null,
  translator: new Translator(),
  customerEmail: undefined,
  purchaseOperationHelper,
  eventsTracker: createEventsTrackerMock(),
});

describe("tryApplePayPurchase", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("falls back before loading Stripe when the account country is missing", async () => {
    const getStripeClientSpy = vi.spyOn(StripeService, "getStripeClient");

    const result = await tryApplePayPurchase(
      createParams(createPurchaseOperationHelper(), null),
    );

    expect(result).toEqual({ status: "unavailable" });
    expect(getStripeClientSpy).not.toHaveBeenCalled();
  });

  test("falls back when Apple Pay is unavailable", async () => {
    const { paymentRequest, stripe } = createStripeMocks({
      canMakePayment: null,
    });
    vi.spyOn(StripeService, "getStripeClient").mockResolvedValue({ stripe });

    const result = await tryApplePayPurchase(
      createParams(createPurchaseOperationHelper()),
    );

    expect(result).toEqual({ status: "unavailable" });
    expect(paymentRequest.show).not.toHaveBeenCalled();
  });

  test("falls back when Apple Pay cannot be presented", async () => {
    const { paymentRequest, stripe } = createStripeMocks();
    vi.mocked(paymentRequest.show).mockImplementation(() => {
      throw new Error("User activation is no longer available");
    });
    vi.spyOn(StripeService, "getStripeClient").mockResolvedValue({ stripe });

    const result = await tryApplePayPurchase(
      createParams(createPurchaseOperationHelper()),
    );

    expect(result).toEqual({ status: "unavailable" });
  });

  test("returns cancellation without falling back to checkout", async () => {
    const { paymentRequest, stripe } = createStripeMocks({
      onShow: (handlers) => queueMicrotask(() => handlers.cancel?.()),
    });
    vi.spyOn(StripeService, "getStripeClient").mockResolvedValue({ stripe });

    const result = await tryApplePayPurchase(
      createParams(createPurchaseOperationHelper()),
    );

    expect(result).toEqual({ status: "cancelled" });
    expect(paymentRequest.off).toHaveBeenCalledWith(
      "cancel",
      expect.any(Function),
    );
    expect(paymentRequest.off).toHaveBeenCalledWith(
      "paymentmethod",
      expect.any(Function),
    );
  });

  test("shows the prepared payment request before starting checkout", async () => {
    const order: string[] = [];
    const { handlers, paymentRequest, stripe } = createStripeMocks();
    vi.mocked(paymentRequest.show).mockImplementation(() => {
      order.push("show");
      queueMicrotask(() => handlers.cancel?.());
    });
    vi.spyOn(StripeService, "getStripeClient").mockResolvedValue({ stripe });
    const params = createParams(createPurchaseOperationHelper());
    const preparedPurchase = await prepareApplePayPurchase(params);

    expect(preparedPurchase).not.toBeNull();
    if (!preparedPurchase) {
      return;
    }

    const resultPromise = presentPreparedApplePayPurchase({
      preparedPurchase,
      customerEmail: params.customerEmail,
      brandingInfo: params.brandingInfo,
      translator: params.translator,
      purchaseOperationHelper: params.purchaseOperationHelper,
      eventsTracker: params.eventsTracker,
      onPresented: async () => {
        order.push("start");
      },
    });

    expect(order).toEqual(["show", "start"]);
    await expect(resultPromise).resolves.toEqual({ status: "cancelled" });
  });

  test("completes the checkout with the Apple Pay payment method", async () => {
    const paymentMethodEvent = createPaymentMethodEvent();
    const { paymentRequest, stripe } = createStripeMocks({
      onShow: (handlers) =>
        queueMicrotask(() => handlers.paymentmethod?.(paymentMethodEvent)),
    });
    vi.spyOn(StripeService, "getStripeClient").mockResolvedValue({ stripe });
    const purchaseOperationHelper = createPurchaseOperationHelper();

    const result = await tryApplePayPurchase(
      createParams(purchaseOperationHelper),
    );

    expect(result).toEqual({ status: "finished", operationResult });
    expect(stripe.paymentRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        country: "US",
        currency: "usd",
        disableWallets: ["googlePay", "link", "browserCard"],
        applePay: expect.objectContaining({
          recurringPaymentRequest: expect.objectContaining({
            managementURL: "https://pay.revenuecat.com/manage/session",
          }),
        }),
      }),
    );
    expect(purchaseOperationHelper.checkoutComplete).toHaveBeenCalledWith({
      email: "wallet@example.com",
      locale: "en",
    });
    expect(stripe.confirmCardPayment).toHaveBeenCalledWith(
      "pi_secret",
      { payment_method: "pm_apple_pay" },
      { handleActions: false },
    );
    expect(paymentMethodEvent.complete).toHaveBeenCalledOnce();
    expect(paymentMethodEvent.complete).toHaveBeenCalledWith("success");
    expect(paymentRequest.on).toHaveBeenCalledWith(
      "paymentmethod",
      expect.any(Function),
    );
    expect(
      purchaseOperationHelper.pollCurrentPurchaseForCompletion,
    ).toHaveBeenCalledOnce();
  });

  test("refreshes taxes with the Apple Pay billing address", async () => {
    const paymentMethodEvent = createPaymentMethodEvent();
    const { stripe } = createStripeMocks({
      onShow: (handlers) =>
        queueMicrotask(() => handlers.paymentmethod?.(paymentMethodEvent)),
    });
    vi.spyOn(StripeService, "getStripeClient").mockResolvedValue({ stripe });
    const purchaseOperationHelper = createPurchaseOperationHelper();
    const params = createParams(purchaseOperationHelper);

    await tryApplePayPurchase({
      ...params,
      brandingInfo: {
        ...brandingInfo,
        gateway_tax_collection_enabled: true,
      },
    });

    expect(purchaseOperationHelper.checkoutRefreshPricing).toHaveBeenCalledWith(
      {
        countryCode: "US",
        postalCode: "94107",
        state: "CA",
        city: "San Francisco",
        addressLine1: "123 Main Street",
        addressLine2: undefined,
      },
    );
  });
});

describe("prepareApplePayPurchaseForLater", () => {
  test("checks availability before updating and presenting the same request", async () => {
    const { paymentRequest, stripe } = createStripeMocks();
    const preparedPurchase = await prepareApplePayPurchaseForLater({
      stripe,
      accountCountry: "US",
      managementUrl: "https://pay.revenuecat.com/manage/session",
    });

    expect(preparedPurchase).not.toBeNull();
    expect(paymentRequest.canMakePayment).toHaveBeenCalledOnce();
    expect(stripe.paymentRequest).toHaveBeenCalledWith({
      country: "US",
      currency: "usd",
      total: {
        label: "RevenueCat",
        amount: 1,
      },
      requestPayerName: true,
      requestPayerEmail: true,
      disableWallets: ["googlePay", "link", "browserCard"],
    });

    if (!preparedPurchase) {
      return;
    }
    updatePreparedApplePayPurchase({
      preparedPurchase,
      product: rcPackage.webBillingProduct,
      purchaseOption: subscriptionOption,
      priceBreakdown: createParams(createPurchaseOperationHelper())
        .priceBreakdown,
      brandingInfo: null,
      translator: new Translator(),
    });

    expect(stripe.paymentRequest).toHaveBeenCalledOnce();
    expect(paymentRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        currency: "usd",
        total: expect.objectContaining({
          amount: expect.any(Number),
        }),
      }),
    );
  });

  test("returns null when Apple Pay is unavailable", async () => {
    const { stripe } = createStripeMocks({ canMakePayment: null });

    await expect(
      prepareApplePayPurchaseForLater({
        stripe,
        accountCountry: "US",
        managementUrl: "https://pay.revenuecat.com/manage/session",
      }),
    ).resolves.toBeNull();
  });
});
