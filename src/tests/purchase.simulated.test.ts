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
      expect.objectContaining({ app_name: "Test Company name" }),
    );

    expect(InMemoryCache.prototype.invalidateAllCaches).toHaveBeenCalledOnce();
    expect(result).toEqual(mockPurchaseResult);
  });

  test("includes customerEmail on the purchase result when provided", async () => {
    const purchases = configurePurchases(
      "someAppUserId",
      "embedded",
      "test_store_api_key",
    );

    const mockPurchaseResult = {
      customerInfo: { originalAppUserId: "test-user" } as CustomerInfo,
      redemptionInfo: null,
      operationSessionId: "test-session-id",
      customerEmail: "test@example.com",
      storeTransaction: {
        storeTransactionId: "test-transaction-id",
        productIdentifier: "test-product",
        purchaseDate: new Date(),
      },
    };

    vi.mocked(purchaseSimulatedStoreProduct).mockImplementation(
      async (params) => ({
        ...mockPurchaseResult,
        customerEmail: params.customerEmail,
      }),
    );

    const offerings = await purchases.getOfferings();
    const packageToBuy = offerings.current?.availablePackages[0];
    expect(packageToBuy).not.toBeNull();

    const result = await purchases.purchase({
      rcPackage: packageToBuy!,
      customerEmail: "test@example.com",
    });

    expect(purchaseSimulatedStoreProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        rcPackage: packageToBuy,
        customerEmail: "test@example.com",
      }),
      expect.any(Object),
      "someAppUserId",
      expect.objectContaining({ app_name: "Test Company name" }),
    );
    expect(result.customerEmail).toEqual("test@example.com");
  });

  test("forwards funnel context from PurchaseParams to the simulated store purchase", async () => {
    const purchases = configurePurchases(
      "someAppUserId",
      "embedded",
      "test_store_api_key",
    );

    vi.mocked(purchaseSimulatedStoreProduct).mockResolvedValue({
      customerInfo: { originalAppUserId: "test-user" } as CustomerInfo,
      redemptionInfo: null,
      operationSessionId: "test-session-id",
      storeTransaction: {
        storeTransactionId: "test-transaction-id",
        productIdentifier: "test-product",
        purchaseDate: new Date(),
      },
    });

    const offerings = await purchases.getOfferings();
    const packageToBuy = offerings.current?.availablePackages[0];
    expect(packageToBuy).not.toBeNull();

    await purchases.purchase({
      rcPackage: packageToBuy!,
      workflowPurchaseContext: { stepId: "step_123" },
      metadata: { utm_campaign: "spring_sale" },
      externalPurchaseTokenId: "ext_token_123",
    });

    expect(purchaseSimulatedStoreProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        rcPackage: packageToBuy,
        workflowPurchaseContext: { stepId: "step_123" },
        metadata: { utm_campaign: "spring_sale" },
        externalPurchaseTokenId: "ext_token_123",
      }),
      expect.any(Object),
      "someAppUserId",
      expect.objectContaining({ app_name: "Test Company name" }),
    );
  });
});
