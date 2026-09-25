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

  test("rejects paywall presentation without loading resources or modifying the target", async () => {
    const purchases = Purchases.configure({
      apiKey: "amzn_valid_key",
      appUserId: testUserId,
    });
    const htmlTarget = document.createElement("div");
    htmlTarget.textContent = "Existing app content";
    const getOfferings = vi.spyOn(purchases, "getOfferings");
    const preload = vi.spyOn(purchases, "preload");

    await expect(purchases.presentPaywall({ htmlTarget })).rejects.toThrow(
      "Paywalls are not currently available for Amazon apps.",
    );

    expect(htmlTarget.textContent).toBe("Existing app content");
    expect(getOfferings).not.toHaveBeenCalled();
    expect(preload).not.toHaveBeenCalled();
  });

  test("rejects paywall presentation with the Amazon error when no document is available", async () => {
    const purchases = Purchases.configure({
      apiKey: "amzn_valid_key",
      appUserId: testUserId,
    });
    vi.stubGlobal("document", undefined);

    try {
      await expect(purchases.presentPaywall({})).rejects.toThrow(
        "Paywalls are not currently available for Amazon apps.",
      );
    } finally {
      vi.unstubAllGlobals();
    }
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
