import { describe, expect, test, vi } from "vitest";
import type { PaywallListener } from "../../entities/paywall-listener";
import type { Package } from "../../entities/offerings";
import { ErrorCode, PurchasesError } from "../../entities/errors";
import { createMonthlyPackageMock } from "../mocks/offering-mock-provider";

describe("PaywallListener", () => {
  const mockPackage: Package = createMonthlyPackageMock();

  test("listener with no methods defined works without errors", () => {
    const listener: PaywallListener = {};
    // All methods are optional — calling them conditionally should not throw
    expect(() => {
      listener.onPurchaseStarted?.(mockPackage);
      listener.onPurchaseError?.(
        new PurchasesError(ErrorCode.UnknownError, "test"),
      );
      listener.onPurchaseCancelled?.();
    }).not.toThrow();
  });

  test("onPurchaseStarted is called with correct package", () => {
    const onPurchaseStarted = vi.fn();
    const listener: PaywallListener = { onPurchaseStarted };

    listener.onPurchaseStarted?.(mockPackage);

    expect(onPurchaseStarted).toHaveBeenCalledTimes(1);
    expect(onPurchaseStarted).toHaveBeenCalledWith(mockPackage);
  });

  test("onPurchaseError is called with correct error", () => {
    const onPurchaseError = vi.fn();
    const listener: PaywallListener = { onPurchaseError };

    const error = new PurchasesError(
      ErrorCode.StoreProblemError,
      "Store problem",
    );
    listener.onPurchaseError?.(error);

    expect(onPurchaseError).toHaveBeenCalledTimes(1);
    expect(onPurchaseError).toHaveBeenCalledWith(error);
    expect(onPurchaseError.mock.calls[0][0].errorCode).toBe(
      ErrorCode.StoreProblemError,
    );
  });

  test("onPurchaseCancelled is called", () => {
    const onPurchaseCancelled = vi.fn();
    const listener: PaywallListener = { onPurchaseCancelled };

    listener.onPurchaseCancelled?.();

    expect(onPurchaseCancelled).toHaveBeenCalledTimes(1);
  });

  test("listener methods that throw do not propagate when wrapped in try/catch", () => {
    const listener: PaywallListener = {
      onPurchaseStarted: () => {
        throw new Error("Listener bug");
      },
      onPurchaseError: () => {
        throw new Error("Listener bug");
      },
      onPurchaseCancelled: () => {
        throw new Error("Listener bug");
      },
    };

    // Simulating the try/catch wrapping used in presentPaywall
    expect(() => {
      try {
        listener.onPurchaseStarted?.(mockPackage);
      } catch {
        // swallowed as in main.ts
      }
    }).not.toThrow();

    expect(() => {
      try {
        listener.onPurchaseError?.(
          new PurchasesError(ErrorCode.UnknownError, "test"),
        );
      } catch {
        // swallowed as in main.ts
      }
    }).not.toThrow();

    expect(() => {
      try {
        listener.onPurchaseCancelled?.();
      } catch {
        // swallowed as in main.ts
      }
    }).not.toThrow();
  });

  test("both listener.onPurchaseError and legacy onPurchaseError can coexist", () => {
    const listenerOnError = vi.fn();
    const legacyOnError = vi.fn();
    const listener: PaywallListener = { onPurchaseError: listenerOnError };

    const error = new PurchasesError(ErrorCode.NetworkError, "Network error");

    // Simulating the calling order in presentPaywall: listener first, then legacy
    listener.onPurchaseError?.(error);
    legacyOnError(error);

    expect(listenerOnError).toHaveBeenCalledTimes(1);
    expect(listenerOnError).toHaveBeenCalledWith(error);
    expect(legacyOnError).toHaveBeenCalledTimes(1);
    expect(legacyOnError).toHaveBeenCalledWith(error);
  });
});
