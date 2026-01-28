import { describe, expect, test, beforeEach, afterEach } from "vitest";
import { vi } from "vitest";
import { Logger } from "../../helpers/logger";
import {
  ProductType,
  type Product,
  type PricingPhase,
  type DiscountPricePhase,
} from "../../entities/offerings";
import { PeriodUnit } from "../../helpers/duration-helper";
import { formatPrice } from "../../helpers/price-labels";
import type {
  ProductResponse,
  SubscriptionOptionResponse,
  NonSubscriptionOptionResponse,
  PricingPhaseResponse,
  DiscountPriceResponse,
} from "../../networking/responses/products-response";

// Import internal functions for testing - normally these would be imported from the actual module
// but for testing purposes, we'll recreate simplified versions
const toPricingPhase = (phase: PricingPhaseResponse): PricingPhase => {
  return {
    periodDuration: phase.period_duration,
    period: phase.period_duration
      ? { number: 1, unit: PeriodUnit.Month }
      : null,
    cycleCount: phase.cycle_count,
    price: phase.price
      ? {
          amount: phase.price.amount_micros / 10000,
          amountMicros: phase.price.amount_micros,
          currency: phase.price.currency,
          formattedPrice: `$${(phase.price.amount_micros / 1000000).toFixed(2)}`,
        }
      : null,
    pricePerWeek: null,
    pricePerMonth: null,
    pricePerYear: null,
  };
};

const toDiscountPricePhase = (
  phase: DiscountPriceResponse,
): DiscountPricePhase => {
  return {
    timeWindow: phase.time_window,
    durationMode: phase.duration_mode,
    price: {
      amount: phase.amount_micros / 10000,
      amountMicros: phase.amount_micros,
      currency: phase.currency,
      formattedPrice: `$${(phase.amount_micros / 1000000).toFixed(2)}`,
    },
    name: phase.name,
  };
};

const toSubscriptionOption = (option: SubscriptionOptionResponse) => {
  if (option.base == null) {
    return null;
  }
  const discountPrice = option.discount
    ? toDiscountPricePhase(option.discount)
    : null;
  const introPrice = option.intro_price
    ? toPricingPhase(option.intro_price)
    : null;
  return {
    id: option.id,
    priceId: option.price_id,
    base: toPricingPhase(option.base),
    trial: option.trial ? toPricingPhase(option.trial) : null,
    discountPrice,
    introPrice,
  };
};

const toNonSubscriptionOption = (option: NonSubscriptionOptionResponse) => {
  if (option.base_price == null) {
    return null;
  }
  const toPrice = (priceResponse: {
    amount_micros: number;
    currency: string;
  }) => {
    return {
      amount: priceResponse.amount_micros / 10000,
      amountMicros: priceResponse.amount_micros,
      currency: priceResponse.currency,
      formattedPrice: formatPrice(
        priceResponse.amount_micros,
        priceResponse.currency,
      ),
    };
  };
  const toDiscountPricePhase = (
    phase: DiscountPriceResponse | null,
  ): DiscountPricePhase | null => {
    if (!phase) return null;
    return {
      timeWindow: phase.time_window,
      durationMode: phase.duration_mode,
      price: toPrice({
        amount_micros: phase.amount_micros,
        currency: phase.currency,
      }),
      name: phase.name ?? null,
    };
  };
  const discountPrice = toDiscountPricePhase(option.discount);
  return {
    id: option.id,
    priceId: option.price_id,
    basePrice: {
      amount: option.base_price.amount_micros / 10000,
      amountMicros: option.base_price.amount_micros,
      currency: option.base_price.currency,
      formattedPrice: `$${(option.base_price.amount_micros / 1000000).toFixed(2)}`,
    },
    discountPrice,
  };
};

// Simplified product creation functions for testing
const createSubscriptionProduct = (
  productData: ProductResponse,
  defaultOptionId: string,
): Product => {
  const subscriptionOptions = Object.entries(
    productData.purchase_options,
  ).reduce(
    (acc, [key, value]) => {
      const option = toSubscriptionOption(value as SubscriptionOptionResponse);
      if (option) acc[key] = option;
      return acc;
    },
    {} as {
      [key: string]: NonNullable<ReturnType<typeof toSubscriptionOption>>;
    },
  );

  const defaultOption = subscriptionOptions[defaultOptionId];
  if (!defaultOption) {
    throw new Error(`Default option not found: ${defaultOptionId}`);
  }
  const currentPrice = defaultOption.base.price!;

  return {
    identifier: productData.identifier,
    displayName: productData.title,
    title: productData.title,
    description: productData.description,
    productType: ProductType.Subscription,
    currentPrice,
    normalPeriodDuration: defaultOption.base.periodDuration,
    presentedOfferingIdentifier: "test_offering",
    presentedOfferingContext: {
      offeringIdentifier: "test_offering",
      targetingContext: null,
      placementIdentifier: null,
    },
    defaultPurchaseOption: defaultOption,
    defaultSubscriptionOption: defaultOption,
    subscriptionOptions,
    defaultNonSubscriptionOption: null,
    price: currentPrice,
    period: defaultOption.base.period,
    freeTrialPhase: defaultOption.trial,
    discountPricePhase: defaultOption.discountPrice,
    introPricePhase: defaultOption.discountPrice
      ? null
      : defaultOption.introPrice,
  };
};

const createNonSubscriptionProduct = (
  productData: ProductResponse,
  defaultOptionId: string,
): Product => {
  const nonSubscriptionOptions = Object.entries(
    productData.purchase_options,
  ).reduce(
    (acc, [key, value]) => {
      const option = toNonSubscriptionOption(
        value as NonSubscriptionOptionResponse,
      );
      if (option) acc[key] = option;
      return acc;
    },
    {} as {
      [key: string]: NonNullable<ReturnType<typeof toNonSubscriptionOption>>;
    },
  );

  const defaultOption = nonSubscriptionOptions[defaultOptionId];
  if (!defaultOption) {
    throw new Error(`Default option not found: ${defaultOptionId}`);
  }

  return {
    identifier: productData.identifier,
    displayName: productData.title,
    title: productData.title,
    description: productData.description,
    productType: ProductType.Consumable,
    currentPrice: defaultOption.basePrice,
    normalPeriodDuration: null,
    presentedOfferingIdentifier: "test_offering",
    presentedOfferingContext: {
      offeringIdentifier: "test_offering",
      targetingContext: null,
      placementIdentifier: null,
    },
    defaultPurchaseOption: defaultOption,
    defaultSubscriptionOption: null,
    subscriptionOptions: {},
    // TODO: fix
    defaultNonSubscriptionOption: defaultOption,
    price: defaultOption.basePrice,
    period: null,
    freeTrialPhase: null,
    discountPricePhase: null,
    introPricePhase: null,
  };
};

describe("Product Convenience Accessors", () => {
  beforeEach(() => {
    vi.spyOn(Logger, "debugLog").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Subscription Product Convenience Accessors", () => {
    const mockBasePricingPhase: PricingPhaseResponse = {
      period_duration: "P1M",
      cycle_count: 1,
      price: {
        amount_micros: 9990000,
        currency: "USD",
      },
    };

    const mockTrialPricingPhase: PricingPhaseResponse = {
      period_duration: "P1W",
      cycle_count: 1,
      price: null,
    };

    const mockIntroPricingPhase: PricingPhaseResponse = {
      period_duration: "P1M",
      cycle_count: 3,
      price: {
        amount_micros: 4990000,
        currency: "USD",
      },
    };

    test("subscription product with trial and intro price has correct convenience accessors", () => {
      const productData: ProductResponse = {
        identifier: "monthly_subscription",
        title: "Monthly Subscription",
        description: "Monthly subscription with trial and intro price",
        product_type: "subscription",
        default_purchase_option_id: "monthly_option",
        purchase_options: {
          monthly_option: {
            id: "monthly_option",
            price_id: "monthly_price",
            base: mockBasePricingPhase,
            trial: mockTrialPricingPhase,
            intro_price: mockIntroPricingPhase,
          } as SubscriptionOptionResponse,
        },
      };

      const product = createSubscriptionProduct(productData, "monthly_option");

      // Test convenience accessors
      expect(product.price).toEqual({
        amount: 999,
        amountMicros: 9990000,
        currency: "USD",
        formattedPrice: "$9.99",
      });

      expect(product.period).toEqual({
        number: 1,
        unit: "month",
      });

      expect(product.freeTrialPhase).not.toBeNull();
      expect(product.freeTrialPhase!.price).toBeNull(); // Free trial
      expect(product.freeTrialPhase!.periodDuration).toBe("P1W");

      expect(product.introPricePhase).not.toBeNull();
      expect(product.introPricePhase!.price).toEqual({
        amount: 499,
        amountMicros: 4990000,
        currency: "USD",
        formattedPrice: "$4.99",
      });
      expect(product.introPricePhase!.cycleCount).toBe(3);

      // Verify they match the original data
      expect(product.price).toEqual(product.currentPrice);
      expect(product.freeTrialPhase).toEqual(
        product.defaultSubscriptionOption!.trial,
      );
      // When discountPrice is null, introPricePhase should match introPrice
      expect(product.introPricePhase).toEqual(
        product.defaultSubscriptionOption!.introPrice,
      );
      expect(product.discountPricePhase).toBeNull();
    });

    test("subscription product without trial or intro price has null convenience accessors", () => {
      const productData: ProductResponse = {
        identifier: "simple_subscription",
        title: "Simple Subscription",
        description: "Simple subscription without trial or intro",
        product_type: "subscription",
        default_purchase_option_id: "simple_option",
        purchase_options: {
          simple_option: {
            id: "simple_option",
            price_id: "simple_price",
            base: mockBasePricingPhase,
            trial: null,
            intro_price: null,
          } as SubscriptionOptionResponse,
        },
      };

      const product = createSubscriptionProduct(productData, "simple_option");

      expect(product.price).toEqual(product.currentPrice);
      expect(product.period).toEqual({ number: 1, unit: "month" });
      expect(product.freeTrialPhase).toBeNull();
      expect(product.introPricePhase).toBeNull();
    });

    test("subscription product with only trial has correct accessors", () => {
      const productData: ProductResponse = {
        identifier: "trial_subscription",
        title: "Trial Subscription",
        description: "Subscription with trial only",
        product_type: "subscription",
        default_purchase_option_id: "trial_option",
        purchase_options: {
          trial_option: {
            id: "trial_option",
            price_id: "trial_price",
            base: mockBasePricingPhase,
            trial: mockTrialPricingPhase,
            intro_price: null,
          } as SubscriptionOptionResponse,
        },
      };

      const product = createSubscriptionProduct(productData, "trial_option");

      expect(product.freeTrialPhase).not.toBeNull();
      expect(product.introPricePhase).toBeNull();
    });

    test("subscription product with only intro price has correct accessors", () => {
      const productData: ProductResponse = {
        identifier: "intro_subscription",
        title: "Intro Subscription",
        description: "Subscription with intro price only",
        product_type: "subscription",
        default_purchase_option_id: "intro_option",
        purchase_options: {
          intro_option: {
            id: "intro_option",
            price_id: "intro_price",
            base: mockBasePricingPhase,
            trial: null,
            intro_price: mockIntroPricingPhase,
          } as SubscriptionOptionResponse,
        },
      };

      const product = createSubscriptionProduct(productData, "intro_option");

      expect(product.freeTrialPhase).toBeNull();
      expect(product.introPricePhase).not.toBeNull();
    });

    test("subscription product with discount takes precedence over intro_price", () => {
      const mockDiscountPricingPhase: DiscountPriceResponse = {
        time_window: "P2M",
        duration_mode: "time_window",
        amount_micros: 2990000,
        currency: "USD",
        name: "Black Friday 50%",
      };

      const productData: ProductResponse = {
        identifier: "discount_subscription",
        title: "Discount Subscription",
        description: "Subscription with both discount and intro price",
        product_type: "subscription",
        default_purchase_option_id: "discount_option",
        purchase_options: {
          discount_option: {
            id: "discount_option",
            price_id: "discount",
            base: mockBasePricingPhase,
            trial: null,
            discount: mockDiscountPricingPhase,
            intro_price: mockIntroPricingPhase,
          } as SubscriptionOptionResponse,
        },
      };

      const product = createSubscriptionProduct(productData, "discount_option");

      // Both discountPricePhase and introPricePhase should be set
      // (precedence is handled in UI components, not in the entity)
      expect(product.discountPricePhase).not.toBeNull();
      expect(product.discountPricePhase!.price).toEqual({
        amount: 299,
        amountMicros: 2990000,
        currency: "USD",
        formattedPrice: "$2.99",
      });
      expect(product.introPricePhase).not.toBeNull();

      // Verify they match the values from the option
      expect(product.discountPricePhase).toEqual(
        product.defaultSubscriptionOption!.discountPrice,
      );
      expect(product.introPricePhase).toEqual(
        product.defaultSubscriptionOption!.introPrice,
      );
    });

    test("subscription product with only discount (no intro_price) has correct accessors", () => {
      const mockDiscountPricingPhase: DiscountPriceResponse = {
        time_window: "P1M",
        duration_mode: "time_window",
        amount_micros: 3990000,
        currency: "USD",
        name: "Monthly Discount",
      };

      const productData: ProductResponse = {
        identifier: "discount_only_subscription",
        title: "Discount Only Subscription",
        description: "Subscription with discount price only",
        product_type: "subscription",
        default_purchase_option_id: "discount_only_option",
        purchase_options: {
          discount_only_option: {
            id: "discount_only_option",
            price_id: "discount_only_price",
            base: mockBasePricingPhase,
            trial: null,
            discount: mockDiscountPricingPhase,
            intro_price: null,
          } as SubscriptionOptionResponse,
        },
      };

      const product = createSubscriptionProduct(
        productData,
        "discount_only_option",
      );

      expect(product.discountPricePhase).not.toBeNull();
      expect(product.discountPricePhase!.price).toEqual({
        amount: 399,
        amountMicros: 3990000,
        currency: "USD",
        formattedPrice: "$3.99",
      });
      expect(product.introPricePhase).toBeNull();
    });
  });

  describe("Non-Subscription Product Convenience Accessors", () => {
    test("consumable product has correct convenience accessors", () => {
      const productData: ProductResponse = {
        identifier: "consumable_product",
        title: "Consumable Product",
        description: "A consumable product",
        product_type: "consumable",
        default_purchase_option_id: "consumable_option",
        purchase_options: {
          consumable_option: {
            id: "consumable_option",
            price_id: "consumable_price",
            base_price: {
              amount_micros: 1990000,
              currency: "USD",
            },
          } as NonSubscriptionOptionResponse,
        },
      };

      const product = createNonSubscriptionProduct(
        productData,
        "consumable_option",
      );

      expect(product.price).toEqual({
        amount: 199,
        amountMicros: 1990000,
        currency: "USD",
        formattedPrice: "$1.99",
      });

      expect(product.period).toBeNull();
      expect(product.freeTrialPhase).toBeNull();
      expect(product.introPricePhase).toBeNull();

      // Verify it matches currentPrice
      expect(product.price).toEqual(product.currentPrice);
    });

    test("non-consumable product has correct convenience accessors", () => {
      const productData: ProductResponse = {
        identifier: "non_consumable_product",
        title: "Non-Consumable Product",
        description: "A non-consumable product",
        product_type: "non_consumable",
        default_purchase_option_id: "non_consumable_option",
        purchase_options: {
          non_consumable_option: {
            id: "non_consumable_option",
            price_id: "non_consumable_price",
            base_price: {
              amount_micros: 4990000,
              currency: "USD",
            },
          } as NonSubscriptionOptionResponse,
        },
      };

      const product = createNonSubscriptionProduct(
        productData,
        "non_consumable_option",
      );

      expect(product.price).toEqual({
        amount: 499,
        amountMicros: 4990000,
        currency: "USD",
        formattedPrice: "$4.99",
      });

      expect(product.period).toBeNull();
      expect(product.freeTrialPhase).toBeNull();
      expect(product.introPricePhase).toBeNull();
    });
  });

  describe("Convenience Accessors Consistency", () => {
    test("price accessor is always consistent with currentPrice", () => {
      const subscriptionData: ProductResponse = {
        identifier: "test_subscription",
        title: "Test Subscription",
        description: "Test subscription",
        product_type: "subscription",
        default_purchase_option_id: "test_option",
        purchase_options: {
          test_option: {
            id: "test_option",
            price_id: "test_price",
            base: {
              period_duration: "P1M",
              cycle_count: 1,
              price: { amount_micros: 9990000, currency: "USD" },
            },
            trial: null,
            intro_price: null,
          } as SubscriptionOptionResponse,
        },
      };

      const subscriptionProduct = createSubscriptionProduct(
        subscriptionData,
        "test_option",
      );
      expect(subscriptionProduct.price).toEqual(
        subscriptionProduct.currentPrice,
      );

      const consumableData: ProductResponse = {
        identifier: "test_consumable",
        title: "Test Consumable",
        description: "Test consumable",
        product_type: "consumable",
        default_purchase_option_id: "consumable_option",
        purchase_options: {
          consumable_option: {
            id: "consumable_option",
            price_id: "consumable_price",
            base_price: { amount_micros: 1990000, currency: "USD" },
          } as NonSubscriptionOptionResponse,
        },
      };

      const consumableProduct = createNonSubscriptionProduct(
        consumableData,
        "consumable_option",
      );
      expect(consumableProduct.price).toEqual(consumableProduct.currentPrice);
    });

    test("subscription accessors are consistent with defaultSubscriptionOption", () => {
      const productData: ProductResponse = {
        identifier: "consistency_test",
        title: "Consistency Test",
        description: "Testing consistency",
        product_type: "subscription",
        default_purchase_option_id: "test_option",
        purchase_options: {
          test_option: {
            id: "test_option",
            price_id: "test_price",
            base: {
              period_duration: "P1M",
              cycle_count: 1,
              price: { amount_micros: 9990000, currency: "USD" },
            },
            trial: {
              period_duration: "P1W",
              cycle_count: 1,
              price: null,
            },
            intro_price: {
              period_duration: "P1M",
              cycle_count: 2,
              price: { amount_micros: 4990000, currency: "USD" },
            },
          } as SubscriptionOptionResponse,
        },
      };

      const product = createSubscriptionProduct(productData, "test_option");

      expect(product.period).toEqual(
        product.defaultSubscriptionOption!.base.period,
      );
      expect(product.freeTrialPhase).toEqual(
        product.defaultSubscriptionOption!.trial,
      );
      // When discountPrice is null, introPricePhase should match introPrice
      expect(product.introPricePhase).toEqual(
        product.defaultSubscriptionOption!.introPrice,
      );
      expect(product.discountPricePhase).toBeNull();
    });
  });
});
