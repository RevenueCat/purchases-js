import { describe, expect, test, vi } from "vitest";
import { configurePurchases } from "./base.purchases_test";
import { purchaseSimulatedStoreProduct } from "../helpers/simulated-store-purchase-helper";
import { InMemoryCache } from "../helpers/in-memory-cache";
import type { CustomerInfo } from "../entities/customer-info";

vi.mock("../helpers/simulated-store-purchase-helper");
vi.mock("../helpers/in-memory-cache");

describe("simulated purchase", () => {
  test("invalidates in-memory cache after simulated store purchase", async () => {
    // Use "embedded" rcSource to avoid popstate event listener setup that can cause timeouts in tests.
    // When rcSource is not in supportedRCSources ["app", "embedded"], the purchase flow adds a popstate
    // event listener for cleanup, but this can hang in test environments where DOM events don't fire properly.
    const purchases = configurePurchases(
      "someAppUserId",
      "embedded",
      "test_store_api_key",
    );

    const mockPurchaseResult = {
      customerInfo: { originalAppUserId: "test-user" } as CustomerInfo,
      redemptionInfo: null,
      operationSessionId: "test-session-id",
      storeTransaction: {
        storeTransactionId: "test-transaction-id",
        productIdentifier: "test-product",
        purchaseDate: new Date(),
      },
    };

    vi.mocked(purchaseSimulatedStoreProduct).mockResolvedValue(
      mockPurchaseResult,
    );

    const offerings = await purchases.getOfferings();
    const packageToBuy = offerings.current?.availablePackages[0];
    expect(packageToBuy).not.toBeNull();

    const result = await purchases.purchase({
      rcPackage: packageToBuy!,
    });

    expect(purchaseSimulatedStoreProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        rcPackage: packageToBuy,
      }),
      expect.any(Object),
      "someAppUserId",
    );

    expect(InMemoryCache.prototype.invalidateAllCaches).toHaveBeenCalledOnce();
    expect(result).toEqual(mockPurchaseResult);
  });
});
