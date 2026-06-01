import { describe, expect, test } from "vitest";
import { getInitialPriceFromPurchaseOption } from "../../helpers/purchase-option-price-helper";
import type {
  Product,
  SubscriptionOption,
  NonSubscriptionOption,
} from "../../entities/offerings";
import { ProductType } from "../../entities/offerings";
import { PeriodUnit } from "../../helpers/duration-helper";
import {
  discountPhaseOneTimeConsumable,
  discountPhaseTimeWindow,
  trialPhaseP1W,
  pricePhaseP1M1499,
  introPhaseP1M199,
} from "../fixtures/price-phases";
import { toPrice } from "../utils/fixtures-utils";

describe("getInitialPriceFromPurchaseOption", () => {
  const mockPrice = toPrice(9990000, "USD");
  const mockIntroPrice = introPhaseP1M199.price!;
  const mockBasePrice = pricePhaseP1M1499.price!;

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
    price: mockBasePrice,
    period: { number: 1, unit: PeriodUnit.Month },
    freeTrialPhase: null,
    introPricePhase: null,
    discountPhase: null,
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
    price: mockBasePrice,
    period: null,
    freeTrialPhase: null,
    introPricePhase: null,
    discountPhase: null,
  };

  describe("subscription products", () => {
    test("returns intro price when available", () => {
      const subscriptionOption: SubscriptionOption = {
        id: "test_option",
        priceId: "test_price_id",
        base: pricePhaseP1M1499,
        trial: null,
        discount: null,
        introPrice: introPhaseP1M199,
      };

      const result = getInitialPriceFromPurchaseOption(
        mockSubscriptionProduct,
        subscriptionOption,
      );

      expect(result).toEqual(mockIntroPrice);
    });

    test("returns discount price when available", () => {
      const subscriptionOption: SubscriptionOption = {
        id: "test_option",
        priceId: "test_price_id",
        base: pricePhaseP1M1499,
        trial: null,
        introPrice: null,
        discount: discountPhaseTimeWindow,
      };

      const result = getInitialPriceFromPurchaseOption(
        mockSubscriptionProduct,
        subscriptionOption,
      );

      expect(result).toEqual({
        amount: 1200,
        amountMicros: 12000000,
        currency: "USD",
        formattedPrice: "$12.00",
      });
    });

    test("returns base price when intro price and discount price are not available", () => {
      const subscriptionOption: SubscriptionOption = {
        id: "test_option",
        priceId: "test_price_id",
        base: pricePhaseP1M1499,
        trial: null,
        discount: null,
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
        base: pricePhaseP1M1499,
        trial: null,
        discount: null,
        introPrice: {
          ...introPhaseP1M199,
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
        base: pricePhaseP1M1499,
        trial: null,
        discount: null,
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
        base: pricePhaseP1M1499,
        trial: trialPhaseP1W,
        discount: null,
        introPrice: introPhaseP1M199,
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
        discount: null,
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
        discount: null,
      };

      const result = getInitialPriceFromPurchaseOption(
        nonConsumableProduct,
        nonSubscriptionOption,
      );

      expect(result).toEqual(mockPrice);
    });

    test("returns discount price when available for non-subscription products", () => {
      const nonSubscriptionOption: NonSubscriptionOption = {
        id: "test_option",
        priceId: "test_price_id",
        basePrice: mockPrice,
        discount: discountPhaseOneTimeConsumable,
      };

      const result = getInitialPriceFromPurchaseOption(
        mockNonSubscriptionProduct,
        nonSubscriptionOption,
      );

      expect(result).toEqual({
        amount: 1100,
        amountMicros: 11000000,
        currency: "USD",
        formattedPrice: "$11.00",
      });
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
        discount: null,
      };

      const result = getInitialPriceFromPurchaseOption(
        unknownProduct,
        nonSubscriptionOption,
      );

      expect(result).toEqual(mockPrice);
    });
  });
});
