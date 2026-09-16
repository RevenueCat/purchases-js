import { afterEach, describe, expect, test, vi } from "vitest";

const { appState } = vi.hoisted(() => ({
  appState: { currentState: "active", addEventListener: vi.fn() },
}));

vi.mock("@amazon-devices/keplerscript-appstore-iap-lib", () => ({
  PurchasingService: {},
}));

vi.mock("@amazon-devices/kepler-file-system", () => ({
  KeplerFileSystem: {},
}));

vi.mock("@amazon-devices/kepler-compatibility", () => ({
  isPresentOnOS: vi.fn(() => true),
}));

vi.mock("react-native", () => ({
  AppState: appState,
}));

import type { CustomerInfo } from "../../../src/entities/customer-info";
import { ErrorCode, PurchasesError } from "../../../src/entities/errors";
import { testUserId } from "../../../src/tests/base.purchases_test";
import { AmazonBillingWrapper } from "../amazon/amazon-billing-wrapper";
import { Purchases } from "../index";

describe("Vega Purchases", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test.each(["syncPurchases", "restorePurchases"] as const)(
    "%s delegates to the Amazon billing wrapper",
    async (method) => {
      const expectedResult = { customerInfo: {} as CustomerInfo };
      const wrapperMethod = vi
        .spyOn(AmazonBillingWrapper.prototype, method)
        .mockResolvedValue(expectedResult);
      const purchases = Purchases.configure({
        apiKey: "amzn_valid_key",
        appUserId: testUserId,
      });

      await expect(purchases[method]()).resolves.toBe(expectedResult);
      expect(wrapperMethod).toHaveBeenCalledExactlyOnceWith(testUserId);
    },
  );

  test.each(["syncPurchases", "restorePurchases"] as const)(
    "%s propagates errors from the Amazon billing wrapper",
    async (method) => {
      const error = new PurchasesError(
        ErrorCode.StoreProblemError,
        "Amazon unavailable",
      );
      vi.spyOn(AmazonBillingWrapper.prototype, method).mockRejectedValue(error);
      const purchases = Purchases.configure({
        apiKey: "amzn_valid_key",
        appUserId: testUserId,
      });

      await expect(purchases[method]()).rejects.toBe(error);
    },
  );
});
