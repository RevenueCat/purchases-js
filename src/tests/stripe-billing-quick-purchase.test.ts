import type { PaymentRequest, Stripe } from "@stripe/stripe-js";
import { http, HttpResponse } from "msw";
import { describe, expect, test, vi } from "vitest";

import { BackendErrorCode } from "../entities/errors";
import { ErrorCode, type PurchaseParams, type PurchaseResult } from "../main";
import type { StripeBillingApplePayCheckoutStartResponse } from "../networking/responses/checkout-start-response";
import { StripeService } from "../stripe/stripe-service";
import { configurePurchases, server, testUserId } from "./base.purchases_test";
import { createMonthlyPackageMock } from "./mocks/offering-mock-provider";

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

describe("Purchases Stripe Billing quick purchases", () => {
  test("uses normal checkout when quick purchase is unavailable", async () => {
    server.use(
      http.post("http://localhost:8000/rcbilling/v1/checkout/start", () => {
        return HttpResponse.json(
          {
            code: BackendErrorCode.BackendQuickPurchaseUnavailable,
            message: "Quick purchase is unavailable for this purchase.",
          },
          { status: 422 },
        );
      }),
    );
    const purchases = configurePurchases(
      testUserId,
      "rcSource",
      "strp_test_api_key",
    );
    const params = { rcPackage: createMonthlyPackageMock() };

    await expect(purchases.prepareForQuickPurchases(params)).resolves.toEqual({
      applePayAvailable: false,
    });

    const fallbackResult = {} as PurchaseResult;
    const internal = purchases as unknown as {
      purchaseAfterLoadingResources: (
        params: PurchaseParams,
      ) => Promise<PurchaseResult>;
    };
    const fallback = vi
      .spyOn(internal, "purchaseAfterLoadingResources")
      .mockResolvedValue(fallbackResult);

    await expect(
      purchases.purchase({ ...params, tryWithApplePay: true }),
    ).resolves.toBe(fallbackResult);
    expect(fallback).toHaveBeenCalledOnce();
  });

  test("does not hide other quick purchase preparation errors", async () => {
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

    await expect(
      purchases.prepareForQuickPurchases({
        rcPackage: createMonthlyPackageMock(),
      }),
    ).rejects.toHaveProperty(
      "extra.backendErrorCode",
      BackendErrorCode.BackendInvalidAPIKey,
    );
  });

  test("shares exact preparation and shows Apple Pay synchronously once", async () => {
    const startRequests: Record<string, unknown>[] = [];
    server.use(
      http.post(
        "http://localhost:8000/rcbilling/v1/checkout/start",
        async ({ request }) => {
          startRequests.push((await request.json()) as Record<string, unknown>);
          return HttpResponse.json(applePayStartResponse());
        },
      ),
    );
    const handlers: { cancel?: () => void } = {};
    const paymentRequest = {
      canMakePayment: vi.fn().mockResolvedValue({ applePay: true }),
      on: vi.fn((eventName: string, handler: () => void) => {
        if (eventName === "cancel") handlers.cancel = handler;
      }),
      off: vi.fn(),
      show: vi.fn(() => queueMicrotask(() => handlers.cancel?.())),
    } as unknown as PaymentRequest;
    const stripe = {
      paymentRequest: vi.fn(() => paymentRequest),
    } as unknown as Stripe;
    vi.spyOn(StripeService, "getStripeClient").mockResolvedValue({ stripe });
    const purchases = configurePurchases(
      testUserId,
      "rcSource",
      "strp_test_api_key",
    );
    const params = { rcPackage: createMonthlyPackageMock() };

    const [first, second] = await Promise.all([
      purchases.prepareForQuickPurchases(params),
      purchases.prepareForQuickPurchases(params),
    ]);

    expect(first).toEqual({ applePayAvailable: true });
    expect(second).toEqual(first);
    expect(startRequests).toHaveLength(1);
    expect(startRequests[0]).toEqual(
      expect.objectContaining({ purchase_flow: "apple_pay" }),
    );

    const purchase = purchases.purchase({ ...params, tryWithApplePay: true });
    expect(paymentRequest.show).toHaveBeenCalledOnce();
    await expect(purchase).rejects.toHaveProperty(
      "errorCode",
      ErrorCode.UserCancelledError,
    );

    const fallbackResult = {} as PurchaseResult;
    const internal = purchases as unknown as {
      purchaseAfterLoadingResources: (
        params: PurchaseParams,
      ) => Promise<PurchaseResult>;
    };
    const fallback = vi
      .spyOn(internal, "purchaseAfterLoadingResources")
      .mockResolvedValue(fallbackResult);
    await expect(
      purchases.purchase({ ...params, tryWithApplePay: true }),
    ).resolves.toBe(fallbackResult);
    expect(fallback).toHaveBeenCalledOnce();
    expect(paymentRequest.show).toHaveBeenCalledOnce();
  });

  test("uses normal checkout when the prepared package does not match", async () => {
    server.use(
      http.post("http://localhost:8000/rcbilling/v1/checkout/start", () => {
        return HttpResponse.json(applePayStartResponse());
      }),
    );
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
    const purchases = configurePurchases(
      testUserId,
      "rcSource",
      "strp_test_api_key",
    );
    const preparedPackage = createMonthlyPackageMock();
    await purchases.prepareForQuickPurchases({ rcPackage: preparedPackage });
    const fallbackResult = {} as PurchaseResult;
    const internal = purchases as unknown as {
      purchaseAfterLoadingResources: (
        params: PurchaseParams,
      ) => Promise<PurchaseResult>;
    };
    vi.spyOn(internal, "purchaseAfterLoadingResources").mockResolvedValue(
      fallbackResult,
    );

    const differentPackage = {
      ...preparedPackage,
      identifier: "different-package",
    };
    await expect(
      purchases.purchase({
        rcPackage: differentPackage,
        tryWithApplePay: true,
      }),
    ).resolves.toBe(fallbackResult);
    expect(paymentRequest.show).not.toHaveBeenCalled();
  });

  test("returns unavailable without starting when checkout consent is required", async () => {
    let startCount = 0;
    server.use(
      http.get("http://localhost:8000/rcbilling/v1/branding", () => {
        return HttpResponse.json({
          require_checkout_consent: true,
          terms_and_conditions_url: "https://example.com/terms",
        });
      }),
      http.post("http://localhost:8000/rcbilling/v1/checkout/start", () => {
        startCount += 1;
        return HttpResponse.json(applePayStartResponse());
      }),
    );
    const purchases = configurePurchases(
      testUserId,
      "rcSource",
      "strp_test_api_key",
    );

    await expect(
      purchases.prepareForQuickPurchases({
        rcPackage: createMonthlyPackageMock(),
      }),
    ).resolves.toEqual({ applePayAvailable: false });
    expect(startCount).toBe(0);
  });
});
