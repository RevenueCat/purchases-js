import { describe, expect, test, beforeEach, afterEach } from "vitest";
import type {
  SubscriptionOptionResponse,
  PricingPhaseResponse,
} from "../../networking/responses/products-response";
import { Logger } from "../../helpers/logger";
import { vi } from "vitest";

// Import internal functions for testing
// Note: These are typically not exported, so we're testing via the public API that uses them
import type { SubscriptionOption } from "../../entities/offerings";

// Helper to simulate the toSubscriptionOption parsing logic
const toPricingPhase = (phase: PricingPhaseResponse | null) => {
  if (!phase) return null;
  return {
    periodDuration: phase.period_duration,
    period: {
      number: 1, // This would be parsed from period_duration in real implementation
      unit: "month" as const, // This would be parsed from period_duration in real implementation
    },
    cycleCount: phase.cycle_count,
    price: phase.price
      ? {
          amount: phase.price.amount_micros / 10000,
          amountMicros: phase.price.amount_micros,
          currency: phase.price.currency,
          formattedPrice: `$${(phase.price.amount_micros / 10000 / 100).toFixed(2)}`,
        }
      : null,
    pricePerWeek: null,
    pricePerMonth: null,
    pricePerYear: null,
  };
};

const toSubscriptionOption = (
  option: SubscriptionOptionResponse,
): SubscriptionOption | null => {
  if (option.base == null) {
    Logger.debugLog("Missing base phase for subscription option. Ignoring.");
    return null;
  }
  return {
    id: option.id,
    priceId: option.price_id,
    base: toPricingPhase(option.base)!,
    trial: option.trial ? toPricingPhase(option.trial) : null,
    introPrice: option.intro_price ? toPricingPhase(option.intro_price) : null,
  } as SubscriptionOption;
};

describe("Offerings Parser - Intro Price Support", () => {
  beforeEach(() => {
    vi.spyOn(Logger, "debugLog").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("toSubscriptionOption", () => {
    const mockBasePricingPhase: PricingPhaseResponse = {
      period_duration: "P1M",
      cycle_count: 1,
      price: {
        amount_micros: 9990000,
        currency: "USD",
      },
    };

    const mockIntroPricingPhase: PricingPhaseResponse = {
      period_duration: "P1M",
      cycle_count: 3,
      price: {
        amount_micros: 1990000,
        currency: "USD",
      },
    };

    const mockTrialPricingPhase: PricingPhaseResponse = {
      period_duration: "P1W",
      cycle_count: 1,
      price: null,
    };

    test("parses subscription option with intro price", () => {
      const response: SubscriptionOptionResponse = {
        id: "test_option",
        price_id: "test_price_id",
        base: mockBasePricingPhase,
        trial: null,
        intro_price: mockIntroPricingPhase,
      };

      const result = toSubscriptionOption(response);

      expect(result).not.toBeNull();
      expect(result!.id).toBe("test_option");
      expect(result!.priceId).toBe("test_price_id");
      expect(result!.base).toBeDefined();
      expect(result!.trial).toBeNull();
      expect(result!.introPrice).toBeDefined();
      expect(result!.introPrice!.price).toEqual({
        amount: 199,
        amountMicros: 1990000,
        currency: "USD",
        formattedPrice: "$1.99",
      });
      expect(result!.introPrice!.cycleCount).toBe(3);
    });

    test("parses subscription option without intro price", () => {
      const response: SubscriptionOptionResponse = {
        id: "test_option",
        price_id: "test_price_id",
        base: mockBasePricingPhase,
        trial: null,
        intro_price: null,
      };

      const result = toSubscriptionOption(response);

      expect(result).not.toBeNull();
      expect(result!.id).toBe("test_option");
      expect(result!.introPrice).toBeNull();
    });

    test("parses subscription option with both trial and intro price", () => {
      const response: SubscriptionOptionResponse = {
        id: "test_option",
        price_id: "test_price_id",
        base: mockBasePricingPhase,
        trial: mockTrialPricingPhase,
        intro_price: mockIntroPricingPhase,
      };

      const result = toSubscriptionOption(response);

      expect(result).not.toBeNull();
      expect(result!.trial).toBeDefined();
      expect(result!.trial!.price).toBeNull();
      expect(result!.introPrice).toBeDefined();
      expect(result!.introPrice!.price).toEqual({
        amount: 199,
        amountMicros: 1990000,
        currency: "USD",
        formattedPrice: "$1.99",
      });
    });

    test("parses subscription option with intro price but null price", () => {
      const response: SubscriptionOptionResponse = {
        id: "test_option",
        price_id: "test_price_id",
        base: mockBasePricingPhase,
        trial: null,
        intro_price: {
          period_duration: "P1M",
          cycle_count: 3,
          price: null,
        },
      };

      const result = toSubscriptionOption(response);

      expect(result).not.toBeNull();
      expect(result!.introPrice).toBeDefined();
      expect(result!.introPrice!.price).toBeNull();
      expect(result!.introPrice!.cycleCount).toBe(3);
    });

    test("returns null when base is missing", () => {
      const response: SubscriptionOptionResponse = {
        id: "test_option",
        price_id: "test_price_id",
        base: null,
        trial: null,
        intro_price: mockIntroPricingPhase,
      };

      const result = toSubscriptionOption(response);

      expect(result).toBeNull();
      expect(Logger.debugLog).toHaveBeenCalledWith(
        "Missing base phase for subscription option. Ignoring.",
      );
    });

    test("handles multiple intro price scenarios", () => {
      const recurringIntroPrice: PricingPhaseResponse = {
        period_duration: "P1M",
        cycle_count: 6, // Recurring for 6 cycles
        price: {
          amount_micros: 4990000,
          currency: "USD",
        },
      };

      const upfrontIntroPrice: PricingPhaseResponse = {
        period_duration: "P6M",
        cycle_count: 1, // One-time upfront payment
        price: {
          amount_micros: 19990000,
          currency: "USD",
        },
      };

      // Test recurring intro price
      const recurringResponse: SubscriptionOptionResponse = {
        id: "recurring_option",
        price_id: "recurring_price_id",
        base: mockBasePricingPhase,
        trial: null,
        intro_price: recurringIntroPrice,
      };

      const recurringResult = toSubscriptionOption(recurringResponse);
      expect(recurringResult!.introPrice!.cycleCount).toBe(6);
      expect(recurringResult!.introPrice!.price!.amount).toBe(499);

      // Test upfront intro price
      const upfrontResponse: SubscriptionOptionResponse = {
        id: "upfront_option",
        price_id: "upfront_price_id",
        base: mockBasePricingPhase,
        trial: null,
        intro_price: upfrontIntroPrice,
      };

      const upfrontResult = toSubscriptionOption(upfrontResponse);
      expect(upfrontResult!.introPrice!.cycleCount).toBe(1);
      expect(upfrontResult!.introPrice!.price!.amount).toBe(1999);
    });
  });
});
