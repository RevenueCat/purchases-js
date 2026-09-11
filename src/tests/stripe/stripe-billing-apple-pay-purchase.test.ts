import type {
  PaymentRequest,
  PaymentRequestPaymentMethodEvent,
  Stripe,
} from "@stripe/stripe-js";
import { afterEach, describe, expect, test, vi } from "vitest";

import type { PurchaseOperationHelper } from "../../helpers/purchase-operation-helper";
import type { StripeBillingApplePayCheckoutStartResponse } from "../../networking/responses/checkout-start-response";
import {
  prepareStripeBillingApplePayPurchase,
  presentStripeBillingApplePayPurchase,
} from "../../stripe/stripe-billing-apple-pay-purchase";
import { StripeService } from "../../stripe/stripe-service";
import {
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
  purchaseDate: new Date("2026-09-04T00:00:00Z"),
};

const startResponse = (
  accountCountry: string | null = "US",
  expiresAt = "2026-09-04T01:00:00Z",
): StripeBillingApplePayCheckoutStartResponse => ({
  operation_session_id: "operation-session-id",
  gateway_params: null,
  stripe_billing_params: null,
  stripe_billing_apple_pay_params: {
    publishable_api_key: "pk_test_123",
    stripe_account_id: "acct_123",
    account_country: accountCountry,
    amount_in_micros: 9_990_000,
    currency: "USD",
    expires_at: expiresAt,
  },
  management_url: "https://pay.revenuecat.com/manage/session",
  paddle_billing_params: null,
  checkout_mode: "purchase",
});

const createPurchaseOperationHelper = (order: string[] = []) =>
  ({
    checkoutRefreshPricing: vi.fn(async () => {
      order.push("pricing");
      return checkoutPricingResponse;
    }),
    checkoutComplete: vi.fn(async () => {
      order.push("complete");
      return {
        operation_session_id: "operation-session-id",
        gateway_params: {
          client_secret: "pi_secret",
          intent_type: "payment_intent",
        },
        checkout_mode: "purchase",
      };
    }),
    pollCurrentPurchaseForCompletion: vi.fn(async () => {
      order.push("poll");
      return operationResult;
    }),
  }) as unknown as PurchaseOperationHelper;

const createStripeMocks = ({
  canMakePayment = { applePay: true },
  onShow,
  order = [],
}: {
  canMakePayment?: { applePay: boolean } | null;
  onShow?: (handlers: PaymentRequestHandlers) => void;
  order?: string[];
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
    show: vi.fn(() => {
      order.push("show");
      onShow?.(handlers);
    }),
  } as unknown as PaymentRequest;
  const stripe = {
    paymentRequest: vi.fn(() => paymentRequest),
    confirmCardPayment: vi.fn(async () => {
      order.push("confirm");
      return { paymentIntent: { status: "succeeded" } };
    }),
    confirmCardSetup: vi.fn(async () => {
      order.push("confirm_setup");
      return { setupIntent: { status: "succeeded" } };
    }),
  } as unknown as Stripe;

  return { handlers, paymentRequest, stripe };
};

const paymentMethodEvent = (): PaymentRequestPaymentMethodEvent =>
  ({
    payerEmail: "wallet@example.com",
    payerName: "Wallet Customer",
    paymentMethod: {
      id: "pm_apple_pay",
      billing_details: {
        name: "Billing Customer",
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

const prepare = async (
  purchaseOperationHelper: PurchaseOperationHelper,
  accountCountry: string | null = "US",
  expiresAt?: string,
) =>
  await prepareStripeBillingApplePayPurchase({
    startResponse: startResponse(accountCountry, expiresAt),
    product: rcPackage.webBillingProduct,
    purchaseOption: subscriptionOption,
    brandingInfo: null,
    translator: new Translator(),
    purchaseOperationHelper,
  });

describe("Stripe Billing Apple Pay purchase", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("does not load Stripe without a connected account country", async () => {
    const getStripeClient = vi.spyOn(StripeService, "getStripeClient");

    await expect(
      prepare(createPurchaseOperationHelper(), null),
    ).resolves.toBeNull();
    expect(getStripeClient).not.toHaveBeenCalled();
  });

  test("prepares the package-specific Payment Request and checks Apple Pay", async () => {
    const { paymentRequest, stripe } = createStripeMocks();
    vi.spyOn(StripeService, "getStripeClient").mockResolvedValue({ stripe });

    const prepared = await prepare(createPurchaseOperationHelper());

    expect(prepared).not.toBeNull();
    expect(paymentRequest.canMakePayment).toHaveBeenCalledOnce();
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
  });

  test("interprets an expiration without an offset as UTC", async () => {
    const { stripe } = createStripeMocks();
    vi.spyOn(StripeService, "getStripeClient").mockResolvedValue({ stripe });

    const prepared = await prepare(
      createPurchaseOperationHelper(),
      "US",
      "2026-09-04T01:00:00",
    );

    expect(prepared?.expiresAt).toBe(Date.parse("2026-09-04T01:00:00Z"));
  });

  test("returns null when Apple Pay is unavailable", async () => {
    const { stripe } = createStripeMocks({ canMakePayment: null });
    vi.spyOn(StripeService, "getStripeClient").mockResolvedValue({ stripe });

    await expect(prepare(createPurchaseOperationHelper())).resolves.toBeNull();
  });

  test("presents synchronously and reports cancellation", async () => {
    const { handlers, paymentRequest, stripe } = createStripeMocks();
    vi.mocked(paymentRequest.show).mockImplementation(() => {
      queueMicrotask(() => handlers.cancel?.());
    });
    vi.spyOn(StripeService, "getStripeClient").mockResolvedValue({ stripe });
    const prepared = await prepare(createPurchaseOperationHelper());
    expect(prepared).not.toBeNull();
    if (!prepared) return;

    const result = presentStripeBillingApplePayPurchase({
      preparedPurchase: prepared,
      translator: new Translator(),
      eventsTracker: createEventsTrackerMock(),
    });

    expect(paymentRequest.show).toHaveBeenCalledOnce();
    await expect(result).resolves.toEqual({ status: "cancelled" });
  });

  test("falls back when the prepared request cannot be shown", async () => {
    const { paymentRequest, stripe } = createStripeMocks();
    vi.mocked(paymentRequest.show).mockImplementation(() => {
      throw new Error("User activation unavailable");
    });
    vi.spyOn(StripeService, "getStripeClient").mockResolvedValue({ stripe });
    const prepared = await prepare(createPurchaseOperationHelper());
    expect(prepared).not.toBeNull();
    if (!prepared) return;

    await expect(
      presentStripeBillingApplePayPurchase({
        preparedPurchase: prepared,
        translator: new Translator(),
        eventsTracker: createEventsTrackerMock(),
      }),
    ).resolves.toEqual({ status: "unavailable" });
  });

  test("calculates tax before creating and confirming the PaymentIntent", async () => {
    const order: string[] = [];
    const event = paymentMethodEvent();
    const { stripe } = createStripeMocks({
      order,
      onShow: (handlers) => {
        queueMicrotask(() => handlers.paymentmethod?.(event));
      },
    });
    vi.spyOn(StripeService, "getStripeClient").mockResolvedValue({ stripe });
    const helper = createPurchaseOperationHelper(order);
    const prepared = await prepare(helper);
    expect(prepared).not.toBeNull();
    if (!prepared) return;

    await expect(
      presentStripeBillingApplePayPurchase({
        preparedPurchase: prepared,
        translator: new Translator(),
        eventsTracker: createEventsTrackerMock(),
      }),
    ).resolves.toEqual({ status: "finished", operationResult });

    expect(order).toEqual(["show", "pricing", "complete", "confirm", "poll"]);
    expect(helper.checkoutRefreshPricing).toHaveBeenCalledWith({
      countryCode: "US",
      postalCode: "94107",
      state: "CA",
      city: "San Francisco",
      addressLine1: "123 Main Street",
      addressLine2: undefined,
    });
    expect(helper.checkoutComplete).toHaveBeenCalledWith({
      email: "wallet@example.com",
      locale: "en",
      billingName: "Billing Customer",
      billingAddress: expect.objectContaining({ countryCode: "US" }),
    });
    expect(stripe.confirmCardPayment).toHaveBeenCalledWith(
      "pi_secret",
      { payment_method: "pm_apple_pay" },
      { handleActions: false },
    );
    expect(event.complete).toHaveBeenCalledWith("success");
  });

  test("confirms a SetupIntent for a free trial", async () => {
    const event = paymentMethodEvent();
    const { stripe } = createStripeMocks({
      onShow: (handlers) => {
        queueMicrotask(() => handlers.paymentmethod?.(event));
      },
    });
    vi.spyOn(StripeService, "getStripeClient").mockResolvedValue({ stripe });
    const helper = createPurchaseOperationHelper();
    vi.mocked(helper.checkoutComplete).mockResolvedValue({
      operation_session_id: "operation-session-id",
      gateway_params: {
        client_secret: "seti_secret",
        intent_type: "setup_intent",
      },
      checkout_mode: "purchase",
    });
    const prepared = await prepare(helper);
    expect(prepared).not.toBeNull();
    if (!prepared) return;

    await presentStripeBillingApplePayPurchase({
      preparedPurchase: prepared,
      translator: new Translator(),
      eventsTracker: createEventsTrackerMock(),
    });

    expect(stripe.confirmCardSetup).toHaveBeenCalledWith(
      "seti_secret",
      { payment_method: "pm_apple_pay" },
      { handleActions: false },
    );
    expect(stripe.confirmCardPayment).not.toHaveBeenCalled();
  });
});
