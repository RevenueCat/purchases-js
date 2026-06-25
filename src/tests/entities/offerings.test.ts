import { afterEach, describe, expect, test, vi } from "vitest";
import {
  ProductType,
  toPurchaseOptionForProductType,
} from "../../entities/offerings";
import type {
  NonSubscriptionOptionResponse,
  SubscriptionOptionResponse,
} from "../../networking/responses/products-response";

const subscriptionOptionResponse: SubscriptionOptionResponse = {
  id: "sub_option",
  price_id: "sub_price",
  base: {
    cycle_count: 1,
    period_duration: "P1M",
    price: {
      amount_micros: 9990000,
      currency: "USD",
    },
  },
  trial: null,
  intro_price: null,
  discount: null,
};

const nonSubscriptionOptionResponse: NonSubscriptionOptionResponse = {
  id: "nonsub_option",
  price_id: "nonsub_price",
  base_price: {
    amount_micros: 4990000,
    currency: "USD",
  },
  discount: null,
};

describe("toPurchaseOptionForProductType", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("returns a subscription option when a subscription option is used for a subscription product", () => {
    const result = toPurchaseOptionForProductType(
      ProductType.Subscription,
      subscriptionOptionResponse,
    );

    expect(result).toMatchObject({
      id: "sub_option",
      priceId: "sub_price",
      base: {
        cycleCount: 1,
        periodDuration: "P1M",
        price: expect.objectContaining({
          amountMicros: 9990000,
          currency: "USD",
        }),
      },
    });
  });

  test("returns null when a subscription option is missing its base phase", () => {
    const result = toPurchaseOptionForProductType(ProductType.Subscription, {
      ...subscriptionOptionResponse,
      base: null,
    });

    expect(result).toBeNull();
  });

  test("returns null when a non-subscription option is used for a subscription product", () => {
    const result = toPurchaseOptionForProductType(
      ProductType.Subscription,
      nonSubscriptionOptionResponse,
    );

    expect(result).toBeNull();
  });

  test("returns null when a subscription option is used for a non-subscription product", () => {
    const result = toPurchaseOptionForProductType(
      ProductType.NonConsumable,
      subscriptionOptionResponse,
    );

    expect(result).toBeNull();
  });
});
