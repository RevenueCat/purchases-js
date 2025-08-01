import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { purchaseTestStoreProduct } from "../../helpers/test-store-purchase-helper";
import { PurchasesError } from "../../entities/errors";
import type { PurchaseParams } from "../../entities/purchase-params";
import type { Backend } from "../../networking/backend";
import { mount, unmount } from "svelte";
import { createMonthlyPackageWithTrialAndIntroPriceMock } from "../mocks/offering-mock-provider";
import { postTestStoreReceipt } from "../../helpers/test-store-post-receipt-helper";

vi.mock("svelte", () => ({
  mount: vi.fn(),
  unmount: vi.fn(),
}));

vi.mock("../../helpers/test-store-post-receipt-helper", () => ({
  postTestStoreReceipt: vi.fn(),
}));

const mockBackend: Backend = {
  postReceipt: vi.fn(),
} as never;

const mockPackage = createMonthlyPackageWithTrialAndIntroPriceMock();
const mockPurchaseParams: PurchaseParams = {
  rcPackage: mockPackage,
};

describe("purchaseTestStoreProduct", () => {
  let mockComponent: Record<string, unknown>;

  beforeEach(() => {
    mockComponent = {
      destroy: vi.fn(),
    };
    vi.mocked(mount).mockReturnValue(mockComponent);
    vi.mocked(unmount).mockImplementation(async () => {});
    vi.mocked(postTestStoreReceipt).mockResolvedValue({
      customerInfo: {} as never,
      redemptionInfo: null,
      operationSessionId: "test_store_operation_session_test-uuid-123",
      storeTransaction: {
        storeTransactionId: "test_123_test-uuid-123",
        productIdentifier: "monthly_trial_intro",
        purchaseDate: new Date(),
      },
    });

    document.body.innerHTML = "";
  });

  afterEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  test("creates modal with correct props", async () => {
    const promise = purchaseTestStoreProduct(
      mockPurchaseParams,
      mockBackend,
      "test-user-id",
    );

    expect(mount).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        target: expect.any(HTMLElement),
        props: expect.objectContaining({
          productIdentifier: "monthly_trial_intro",
          productType: "subscription",
          basePrice: "$14.99",
          freeTrialPeriod: "1 week",
          introPriceFormatted: "$4.99",
          onValidPurchase: expect.any(Function),
          onFailedPurchase: expect.any(Function),
          onCancel: expect.any(Function),
        }),
      }),
    );

    const container = document.body.lastElementChild;
    expect(container).toBeInstanceOf(HTMLDivElement);

    const mountCall = vi.mocked(mount).mock.calls[0];
    const props = mountCall[1].props;
    props?.onCancel();

    await expect(promise).rejects.toThrow(PurchasesError);
  });

  test("resolves with purchase result on valid purchase", async () => {
    const promise = purchaseTestStoreProduct(
      mockPurchaseParams,
      mockBackend,
      "test-user-id",
    );

    const mountCall = vi.mocked(mount).mock.calls[0];
    const props = mountCall[1].props;

    await props?.onValidPurchase();
    const result = await promise;

    expect(postTestStoreReceipt).toHaveBeenCalledWith(
      mockPurchaseParams.rcPackage.webBillingProduct,
      mockBackend,
      "test-user-id",
    );

    expect(result).toEqual({
      customerInfo: expect.any(Object),
      redemptionInfo: null,
      operationSessionId: "test_store_operation_session_test-uuid-123",
      storeTransaction: {
        storeTransactionId: "test_123_test-uuid-123",
        productIdentifier: "monthly_trial_intro",
        purchaseDate: expect.any(Date),
      },
    });
  });

  test("rejects with error on failed purchase", async () => {
    const promise = purchaseTestStoreProduct(
      mockPurchaseParams,
      mockBackend,
      "test-user-id",
    );

    const mountCall = vi.mocked(mount).mock.calls[0];
    const props = mountCall[1].props;

    props?.onFailedPurchase();

    await expect(promise).rejects.toThrow(PurchasesError);
    await expect(promise).rejects.toThrow("Simulated test purchase failure");
  });

  test("rejects with user cancelled error on cancel", async () => {
    const promise = purchaseTestStoreProduct(
      mockPurchaseParams,
      mockBackend,
      "test-user-id",
    );

    const mountCall = vi.mocked(mount).mock.calls[0];
    const props = mountCall[1].props;

    props?.onCancel();

    await expect(promise).rejects.toThrowError(PurchasesError);
  });

  test("handles backend error during purchase", async () => {
    const backendError = new Error("Network error");
    vi.mocked(postTestStoreReceipt).mockRejectedValue(backendError);

    const promise = purchaseTestStoreProduct(
      mockPurchaseParams,
      mockBackend,
      "test-user-id",
    );

    const mountCall = vi.mocked(mount).mock.calls[0];
    const props = mountCall[1].props;

    props?.onValidPurchase();

    await expect(promise).rejects.toThrow("Network error");
  });

  test("cleans up DOM and component on successful purchase", async () => {
    const promise = purchaseTestStoreProduct(
      mockPurchaseParams,
      mockBackend,
      "test-user-id",
    );

    const mountCall = vi.mocked(mount).mock.calls[0];
    const props = mountCall[1].props;

    await props?.onValidPurchase();
    await promise;

    expect(unmount).toHaveBeenCalledWith(mockComponent);
  });

  test("cleans up DOM and component on failed purchase", async () => {
    const promise = purchaseTestStoreProduct(
      mockPurchaseParams,
      mockBackend,
      "test-user-id",
    );

    const mountCall = vi.mocked(mount).mock.calls[0];
    const props = mountCall[1].props;

    props?.onFailedPurchase();

    try {
      await promise;
      expect(false).toBe(true); // Should not reach here
    } catch {
      // Expected error
    }

    expect(unmount).toHaveBeenCalledWith(mockComponent);
  });

  test("cleans up DOM and component on cancel", async () => {
    const promise = purchaseTestStoreProduct(
      mockPurchaseParams,
      mockBackend,
      "test-user-id",
    );

    const mountCall = vi.mocked(mount).mock.calls[0];
    const props = mountCall[1].props;

    props?.onCancel();

    try {
      await promise;
      expect(false).toBe(true); // Should not reach here
    } catch {
      // Expected error
    }

    expect(unmount).toHaveBeenCalledWith(mockComponent);
  });
});
