import { describe, expect, test } from "vitest";
import { getInitialPriceFromPurchaseOption } from "../../helpers/purchase-option-price-helper";
import type {
  Product,
  SubscriptionOption,
  NonSubscriptionOption,
  Price,
} from "../../entities/offerings";
import { ProductType } from "../../entities/offerings";
import { PeriodUnit } from "../../helpers/duration-helper";

describe("getInitialPriceFromPurchaseOption", () => {
  const mockPrice: Price = {
    amount: 999,
    amountMicros: 9990000,
    currency: "USD",
    formattedPrice: "$9.99",
  };

  const mockIntroPrice: Price = {
    amount: 199,
    amountMicros: 1990000,
    currency: "USD",
    formattedPrice: "$1.99",
  };

  const mockBasePrice: Price = {
    amount: 1499,
    amountMicros: 14990000,
    currency: "USD",
    formattedPrice: "$14.99",
  };

  const mockSubscriptionProduct: Product = {
    identifier: "test_subscription",
    displayName: "Test Subscription",
    title: "Test Subscription",
    description: "A test subscription product",
    productType: ProductType.Subscription,
    currentPrice: mockBasePrice,
    normalPeriodDuration: "P1M",
    presentedOfferingIdentifier: "test_offering",
    presentedOfferingContext: {
      offeringIdentifier: "test_offering",
      targetingContext: null,
      placementIdentifier: null,
    },
    defaultPurchaseOption: {} as SubscriptionOption,
    defaultSubscriptionOption: {} as SubscriptionOption,
    subscriptionOptions: {},
    defaultNonSubscriptionOption: null,
  };

  const mockNonSubscriptionProduct: Product = {
    identifier: "test_consumable",
    displayName: "Test Consumable",
    title: "Test Consumable",
    description: "A test consumable product",
    productType: ProductType.Consumable,
    currentPrice: mockBasePrice,
    normalPeriodDuration: null,
    presentedOfferingIdentifier: "test_offering",
    presentedOfferingContext: {
      offeringIdentifier: "test_offering",
      targetingContext: null,
      placementIdentifier: null,
    },
    defaultPurchaseOption: {} as NonSubscriptionOption,
    defaultSubscriptionOption: null,
    subscriptionOptions: {},
    defaultNonSubscriptionOption: {} as NonSubscriptionOption,
  };

  describe("subscription products", () => {
    test("returns intro price when available", () => {
      const subscriptionOption: SubscriptionOption = {
        id: "test_option",
        priceId: "test_price_id",
        base: {
          periodDuration: "P1M",
          period: { number: 1, unit: PeriodUnit.Month },
          cycleCount: 1,
          price: mockBasePrice,
          pricePerWeek: null,
          pricePerMonth: null,
          pricePerYear: null,
        },
        trial: null,
        introPrice: {
          periodDuration: "P1M",
          period: { number: 1, unit: PeriodUnit.Month },
          cycleCount: 3,
          price: mockIntroPrice,
          pricePerWeek: null,
          pricePerMonth: null,
          pricePerYear: null,
        },
      };

      const result = getInitialPriceFromPurchaseOption(
        mockSubscriptionProduct,
        subscriptionOption,
      );

      expect(result).toEqual(mockIntroPrice);
    });

    test("returns base price when intro price is not available", () => {
      const subscriptionOption: SubscriptionOption = {
        id: "test_option",
        priceId: "test_price_id",
        base: {
          periodDuration: "P1M",
          period: { number: 1, unit: PeriodUnit.Month },
          cycleCount: 1,
          price: mockBasePrice,
          pricePerWeek: null,
          pricePerMonth: null,
          pricePerYear: null,
        },
        trial: null,
        introPrice: null,
      };

      const result = getInitialPriceFromPurchaseOption(
        mockSubscriptionProduct,
        subscriptionOption,
      );

      expect(result).toEqual(mockBasePrice);
    });

    test("falls back to product current price when intro price exists but has null price", () => {
      const subscriptionOption: SubscriptionOption = {
        id: "test_option",
        priceId: "test_price_id",
        base: {
          periodDuration: "P1M",
          period: { number: 1, unit: PeriodUnit.Month },
          cycleCount: 1,
          price: mockBasePrice,
          pricePerWeek: null,
          pricePerMonth: null,
          pricePerYear: null,
        },
        trial: null,
        introPrice: {
          periodDuration: "P1M",
          period: { number: 1, unit: PeriodUnit.Month },
          cycleCount: 3,
          price: null,
          pricePerWeek: null,
          pricePerMonth: null,
          pricePerYear: null,
        },
      };

      const result = getInitialPriceFromPurchaseOption(
        mockSubscriptionProduct,
        subscriptionOption,
      );

      // When intro price exists but the price is null, should fall back to product current price
      expect(result).toEqual(mockBasePrice);
    });

    test("falls back to product current price when both intro and base prices are null", () => {
      const subscriptionOption: SubscriptionOption = {
        id: "test_option",
        priceId: "test_price_id",
        base: {
          periodDuration: "P1M",
          period: { number: 1, unit: PeriodUnit.Month },
          cycleCount: 1,
          price: null,
          pricePerWeek: null,
          pricePerMonth: null,
          pricePerYear: null,
        },
        trial: null,
        introPrice: null,
      };

      const result = getInitialPriceFromPurchaseOption(
        mockSubscriptionProduct,
        subscriptionOption,
      );

      expect(result).toEqual(mockBasePrice);
    });

    test("prefers intro price over base price when both are available", () => {
      const subscriptionOption: SubscriptionOption = {
        id: "test_option",
        priceId: "test_price_id",
        base: {
          periodDuration: "P1M",
          period: { number: 1, unit: PeriodUnit.Month },
          cycleCount: 1,
          price: mockBasePrice,
          pricePerWeek: null,
          pricePerMonth: null,
          pricePerYear: null,
        },
        trial: {
          periodDuration: "P1W",
          period: { number: 1, unit: PeriodUnit.Week },
          cycleCount: 1,
          price: null,
          pricePerWeek: null,
          pricePerMonth: null,
          pricePerYear: null,
        },
        introPrice: {
          periodDuration: "P1M",
          period: { number: 1, unit: PeriodUnit.Month },
          cycleCount: 6,
          price: mockIntroPrice,
          pricePerWeek: null,
          pricePerMonth: null,
          pricePerYear: null,
        },
      };

      const result = getInitialPriceFromPurchaseOption(
        mockSubscriptionProduct,
        subscriptionOption,
      );

      expect(result).toEqual(mockIntroPrice);
    });
  });

  describe("non-subscription products", () => {
    test("returns base price for consumable products", () => {
      const nonSubscriptionOption: NonSubscriptionOption = {
        id: "test_option",
        priceId: "test_price_id",
        basePrice: mockPrice,
      };

      const result = getInitialPriceFromPurchaseOption(
        mockNonSubscriptionProduct,
        nonSubscriptionOption,
      );

      expect(result).toEqual(mockPrice);
    });

    test("returns base price for non-consumable products", () => {
      const nonConsumableProduct: Product = {
        ...mockNonSubscriptionProduct,
        productType: ProductType.NonConsumable,
      };

      const nonSubscriptionOption: NonSubscriptionOption = {
        id: "test_option",
        priceId: "test_price_id",
        basePrice: mockPrice,
      };

      const result = getInitialPriceFromPurchaseOption(
        nonConsumableProduct,
        nonSubscriptionOption,
      );

      expect(result).toEqual(mockPrice);
    });
  });

  describe("edge cases", () => {
    test("handles subscription product with unknown product type gracefully", () => {
      const unknownProduct: Product = {
        ...mockSubscriptionProduct,
        productType: "unknown" as ProductType,
      };

      const nonSubscriptionOption: NonSubscriptionOption = {
        id: "test_option",
        priceId: "test_price_id",
        basePrice: mockPrice,
      };

      const result = getInitialPriceFromPurchaseOption(
        unknownProduct,
        nonSubscriptionOption,
      );

      expect(result).toEqual(mockPrice);
    });
  });
});
