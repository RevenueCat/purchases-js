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

  test.each([
    {
      periodDuration: "P7D",
      amountMicros: 7_000_000,
      expectedAmountMicros: {
        week: 7_000_000,
        month: 30_000_000,
        year: 365_000_000,
      },
    },
    {
      periodDuration: "P2W",
      amountMicros: 20_000_000,
      expectedAmountMicros: {
        week: 10_000_000,
        month: 43_450_000,
        year: 521_420_000,
      },
    },
    {
      periodDuration: "P3M",
      amountMicros: 44_970_000,
      expectedAmountMicros: {
        week: 3_440_000,
        month: 14_990_000,
        year: 179_880_000,
      },
    },
    {
      periodDuration: "P1Y",
      amountMicros: 119_990_000,
      expectedAmountMicros: {
        week: 2_300_000,
        month: 9_990_000,
        year: 119_990_000,
      },
    },
    {
      periodDuration: "P2Y",
      amountMicros: 239_980_000,
      expectedAmountMicros: {
        week: 2_300_000,
        month: 9_990_000,
        year: 119_990_000,
      },
    },
  ])(
    "normalizes a $periodDuration subscription price",
    ({ periodDuration, amountMicros, expectedAmountMicros }) => {
      const result = toPurchaseOptionForProductType(ProductType.Subscription, {
        ...subscriptionOptionResponse,
        base: {
          cycle_count: 1,
          period_duration: periodDuration,
          price: {
            amount_micros: amountMicros,
            currency: "USD",
          },
        },
      });

      expect(result).toMatchObject({
        base: {
          pricePerWeek: { amountMicros: expectedAmountMicros.week },
          pricePerMonth: { amountMicros: expectedAmountMicros.month },
          pricePerYear: { amountMicros: expectedAmountMicros.year },
        },
      });
    },
  );

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
