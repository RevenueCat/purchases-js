import { describe, expect, test } from "vitest";
import { ProductType } from "../../entities/offerings";
import { getActiveCheckoutPurchaseOption } from "../../helpers/checkout-session-purchase-option-helper";
import { product, subscriptionOption } from "../../stories/fixtures";
import type { CheckoutPricingResponse } from "../../networking/responses/checkout-pricing-response";
import {
  StripeElementsMode,
  StripeElementsSetupFutureUsage,
} from "../../networking/responses/stripe-elements";

const createCheckoutSessionState = (
  overrides: Partial<CheckoutPricingResponse> = {},
): CheckoutPricingResponse => ({
  operation_session_id: "op_session",
  currency: "USD",
  total_amount_in_micros: 2990000,
  tax_amount_in_micros: 0,
  total_excluding_tax_in_micros: 2990000,
  tax_inclusive: false,
  tax_breakdown: [],
  gateway_params: {
    elements_configuration: {
      amount: 299,
      currency: "usd",
      mode: StripeElementsMode.Payment,
      payment_method_types: ["card"],
      setup_future_usage: StripeElementsSetupFutureUsage.OffSession,
    },
  },
  selected_purchase_option: {
    id: "session_option",
    price_id: "session_price",
    base: {
      cycle_count: 1,
      period_duration: "P1M",
      price: {
        amount_micros: 2990000,
        currency: "USD",
      },
    },
    trial: {
      cycle_count: 1,
      period_duration: "P1W",
      price: null,
    },
    intro_price: null,
    discount: null,
  },
  ...overrides,
});

describe("getActiveCheckoutPurchaseOption", () => {
  test("falls back to the /products purchase option before session purchase options exist", () => {
    const activePurchaseOption = getActiveCheckoutPurchaseOption(
      product,
      subscriptionOption,
      null,
    );

    expect(activePurchaseOption).toBe(subscriptionOption);
  });

  test("returns the operation-session purchase option when session selection data exists", () => {
    const activePurchaseOption = getActiveCheckoutPurchaseOption(
      product,
      subscriptionOption,
      createCheckoutSessionState(),
    );

    expect(activePurchaseOption.id).toBe("session_option");
    expect(activePurchaseOption).toMatchObject({
      id: "session_option",
      trial: expect.objectContaining({
        periodDuration: "P1W",
      }),
    });
  });

  test("falls back when the session selection cannot be resolved", () => {
    const activePurchaseOption = getActiveCheckoutPurchaseOption(
      {
        ...product,
        productType: ProductType.Subscription,
      },
      subscriptionOption,
      createCheckoutSessionState({
        selected_purchase_option: null,
      }),
    );

    expect(activePurchaseOption).toBe(subscriptionOption);
  });
});
