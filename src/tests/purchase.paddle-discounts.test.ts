import { describe, expect, test, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { StatusCodes } from "http-status-codes";
import { initializePaddle as initPaddle } from "@paddle/paddle-js";
import type { Paddle } from "@paddle/paddle-js";
import { configurePurchases, server } from "./base.purchases_test";
import { Purchases } from "../main";
import { createMonthlyPackageMock } from "./mocks/offering-mock-provider";
import { buildOffering } from "./utils/fixtures-utils";

vi.mock("@paddle/paddle-js", () => ({
  initializePaddle: vi.fn(),
  CheckoutEventNames: {
    CHECKOUT_LOADED: "checkout.loaded",
    CHECKOUT_UPDATED: "checkout.updated",
    CHECKOUT_COMPLETED: "checkout.completed",
    CHECKOUT_CLOSED: "checkout.closed",
  },
}));

const paddleApiKey = "pdl_test_api_key";
const checkoutPrepareEndpoint =
  "http://localhost:8000/rcbilling/v1/checkout/prepare";

const pricePreviewResponse = {
  data: {
    currencyCode: "USD",
    discountId: "dsc_01test",
    details: {
      lineItems: [
        {
          price: { billingCycle: { interval: "month", frequency: 1 } },
          totals: { subtotal: "300", discount: "60", tax: "0", total: "240" },
          discounts: [
            {
              discount: {
                id: "dsc_01test",
                description: "Launch promo",
                type: "percentage",
                amount: "20",
                currencyCode: null,
                recur: false,
                maximumRecurringIntervals: null,
              },
              total: "60",
              formattedTotal: "$0.60",
            },
          ],
        },
      ],
    },
  },
};

function mockPaddle(
  pricePreview = vi.fn().mockResolvedValue(pricePreviewResponse),
) {
  const instance = {
    Initialized: true,
    Update: vi.fn(),
    Checkout: { open: vi.fn(), close: vi.fn() },
    PricePreview: pricePreview,
  } as unknown as Paddle;
  vi.mocked(initPaddle).mockResolvedValue(instance);
  server.use(
    http.post(checkoutPrepareEndpoint, () =>
      HttpResponse.json(
        {
          stripe_gateway_params: null,
          paypal_gateway_params: null,
          paddle_billing_params: {
            client_side_token: "test-preview-token",
            is_sandbox: true,
          },
        },
        { status: StatusCodes.OK },
      ),
    ),
  );
  return { instance, pricePreview };
}

describe("Purchases.applyPaddleDiscountsToOffering", () => {
  const offering = buildOffering([createMonthlyPackageMock()]);

  test("returns the offering untouched for non-Paddle api keys", async () => {
    const purchases = configurePurchases();

    const result = await purchases.applyPaddleDiscountsToOffering(offering, {
      $rc_monthly: "dsc_01test",
    });

    expect(result).toBe(offering);
    expect(initPaddle).not.toHaveBeenCalled();
  });

  test("returns the offering untouched when there is nothing to apply", async () => {
    const purchases = configurePurchases(undefined, undefined, paddleApiKey);

    expect(await purchases.applyPaddleDiscountsToOffering(offering, {})).toBe(
      offering,
    );
    expect(
      await purchases.applyPaddleDiscountsToOffering(offering, {
        unknown_package: "dsc_01test",
      }),
    ).toBe(offering);
    expect(initPaddle).not.toHaveBeenCalled();
  });

  test("applies the previewed discount to the matching package", async () => {
    const { pricePreview } = mockPaddle();
    const purchases = configurePurchases(undefined, undefined, paddleApiKey);

    const result = await purchases.applyPaddleDiscountsToOffering(offering, {
      $rc_monthly: "dsc_01test",
    });

    expect(initPaddle).toHaveBeenCalledWith({
      token: "test-preview-token",
      version: "v1",
      environment: "sandbox",
    });
    expect(pricePreview).toHaveBeenCalledWith({
      items: [{ priceId: "monthly", quantity: 1 }],
      discountId: "dsc_01test",
      currencyCode: "USD",
    });

    const product = result.packagesById["$rc_monthly"].webBillingProduct;
    expect(product.discountPhase?.price.formattedPrice).toBe("$2.40");
    expect(product.defaultSubscriptionOption?.discount?.percentage).toBe(20);

    const variables = Purchases.buildVariablesPerPackage(result);
    expect(variables["$rc_monthly"]["product.offer_price"]).toBe("$2.40");
    expect(variables["$rc_monthly"]["product.price"]).toBe("$3.00");
  });

  test("leaves the package untouched when the preview fails", async () => {
    mockPaddle(vi.fn().mockRejectedValue(new Error("boom")));
    const purchases = configurePurchases(undefined, undefined, paddleApiKey);

    const result = await purchases.applyPaddleDiscountsToOffering(offering, {
      $rc_monthly: "dsc_01test",
    });

    expect(
      result.packagesById["$rc_monthly"].webBillingProduct.discountPhase,
    ).toBeNull();
  });

  test("returns the offering untouched when Paddle cannot be initialized", async () => {
    server.use(
      http.post(checkoutPrepareEndpoint, () =>
        HttpResponse.json({}, { status: StatusCodes.INTERNAL_SERVER_ERROR }),
      ),
    );
    const purchases = configurePurchases(undefined, undefined, paddleApiKey);

    const result = await purchases.applyPaddleDiscountsToOffering(offering, {
      $rc_monthly: "dsc_01test",
    });

    expect(result).toBe(offering);
  });
});
