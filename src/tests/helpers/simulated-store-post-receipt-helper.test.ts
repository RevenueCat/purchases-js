import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { postSimulatedStoreReceipt } from "../../helpers/simulated-store-post-receipt-helper";
import type { Backend } from "../../networking/backend";
import type { Product } from "../../entities/offerings";
import {
  createMonthlyPackageWithTrialAndIntroPriceMock,
  createConsumablePackageMock,
} from "../mocks/offering-mock-provider";

vi.mock("../../helpers/uuid-helper", () => ({
  generateUUID: vi.fn(() => "test-uuid-123"),
}));

vi.mock("../../entities/customer-info", () => ({
  toCustomerInfo: vi.fn(() => ({
    originalAppUserId: "test-user",
    entitlements: {},
    nonSubscriptionTransactions: [],
    originalApplicationVersion: "1.0.0",
    originalPurchaseDate: null,
    requestDate: new Date(),
    firstSeen: new Date(),
    activeSubscriptions: [],
    allPurchasedProductIdentifiers: [],
    allExpirationDatesByProduct: {},
    allPurchaseDatesByProduct: {},
    url: null,
  })),
}));

const mockBackend: Backend = {
  postReceipt: vi.fn(),
} as never;

describe("postSimulatedStoreReceipt", () => {
  let mockProduct: Product;

  beforeEach(() => {
    const mockPackage = createMonthlyPackageWithTrialAndIntroPriceMock();
    mockProduct = mockPackage.webBillingProduct;

    vi.mocked(mockBackend.postReceipt).mockResolvedValue({
      subscriber: {
        original_app_user_id: "test-user",
        entitlements: {},
        non_subscriptions: {},
        subscriptions: {},
        other_purchases: {},
        original_application_version: "1.0.0",
        original_purchase_date: null,
        first_seen: new Date().toISOString(),
        last_seen: new Date().toISOString(),
        management_url: null,
      },
      request_date: new Date().toISOString(),
      request_date_ms: Date.now(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("creates receipt with correct product identifier", async () => {
    const result = await postSimulatedStoreReceipt(
      mockProduct,
      mockBackend,
      "test-user-id",
    );

    expect(mockBackend.postReceipt).toHaveBeenCalledWith(
      "test-user-id",
      "monthly_trial_intro",
      expect.stringMatching(/^test_.*test-uuid-123$/),
      mockProduct.presentedOfferingContext,
      "purchase",
    );

    expect(result.storeTransaction.productIdentifier).toBe(
      "monthly_trial_intro",
    );
  });

  test("returns purchase result with correct structure", async () => {
    const result = await postSimulatedStoreReceipt(
      mockProduct,
      mockBackend,
      "test-user-id",
    );

    expect(result).toEqual({
      customerInfo: expect.any(Object),
      redemptionInfo: null,
      operationSessionId: "test_store_operation_session_test-uuid-123",
      storeTransaction: {
        storeTransactionId: expect.stringMatching(/^test_.*test-uuid-123$/),
        productIdentifier: "monthly_trial_intro",
        purchaseDate: expect.any(Date),
      },
    });
  });

  test("handles consumable products", async () => {
    const consumablePackage = createConsumablePackageMock();
    const consumableProduct = consumablePackage.webBillingProduct;

    const result = await postSimulatedStoreReceipt(
      consumableProduct,
      mockBackend,
      "test-user-id",
    );

    expect(mockBackend.postReceipt).toHaveBeenCalledWith(
      "test-user-id",
      "test-consumable-product",
      expect.stringMatching(/^test_.*test-uuid-123$/),
      consumableProduct.presentedOfferingContext,
      "purchase",
    );

    expect(result.storeTransaction.productIdentifier).toBe(
      "test-consumable-product",
    );
  });

  test("handles backend errors", async () => {
    const backendError = new Error("Network error");
    vi.mocked(mockBackend.postReceipt).mockRejectedValue(backendError);

    await expect(
      postSimulatedStoreReceipt(mockProduct, mockBackend, "test-user-id"),
    ).rejects.toThrow("Network error");
  });
});
