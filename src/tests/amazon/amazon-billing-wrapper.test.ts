import { beforeEach, describe, expect, test, vi } from "vitest";

const { getProductData, getPurchaseUpdates, notifyFulfillment, purchase } =
  vi.hoisted(() => ({
    getProductData: vi.fn(),
    getPurchaseUpdates: vi.fn(),
    notifyFulfillment: vi.fn(),
    purchase: vi.fn(),
  }));

vi.mock("@amazon-devices/keplerscript-appstore-iap-lib", () => ({
  FulfillmentResult: { FULFILLED: 1 },
  NotifyFulfillmentResponseCode: {
    SUCCESSFUL: 1,
    NOT_SUPPORTED: 2,
    FAILED: 3,
  },
  ProductDataResponseCode: {
    SUCCESSFUL: 1,
    NOT_SUPPORTED: 2,
    FAILED: 3,
  },
  PurchaseResponseCode: {
    SUCCESSFUL: 0,
    ALREADY_PURCHASED: 1,
    INVALID_SKU: 2,
    NOT_SUPPORTED: 3,
    FAILED: 4,
  },
  PurchaseUpdatesResponseCode: {
    SUCCESSFUL: 1,
    NOT_SUPPORTED: 2,
    FAILED: 3,
  },
  ProductType: {
    CONSUMABLE: 1,
    ENTITLED: 2,
    SUBSCRIPTION: 3,
  },
  PurchasingService: {
    getProductData,
    getPurchaseUpdates,
    notifyFulfillment,
    purchase,
  },
}));

import {
  FulfillmentResult,
  NotifyFulfillmentResponseCode,
  type Product,
  type ProductDataResponse,
  ProductDataResponseCode,
  type PurchaseResponse,
  PurchaseResponseCode,
  PurchaseUpdatesResponseCode,
  ProductType,
} from "@amazon-devices/keplerscript-appstore-iap-lib";
import * as AmazonVegaSdk from "@amazon-devices/keplerscript-appstore-iap-lib";
import {
  resetAmazonAppstoreIAPSDKLoader,
  setAmazonAppstoreIAPSDKLoader,
} from "../../amazon/amazon-appstore-iap-sdk-loader";
import {
  resetReactNativeAppStateLoader,
  setReactNativeAppStateLoader,
  type ReactNativeAppState,
} from "../../amazon/react-native-app-state-loader";
import { AmazonBillingWrapper } from "../../amazon/amazon-billing-wrapper";
import { VegaDeviceCache } from "../../amazon/vega-device-cache";
import { ErrorCode } from "../../entities/errors";
import type { PurchasesError } from "../../entities/errors";
import { Logger } from "../../helpers/logger";
import type { Backend } from "../../networking/backend";
import { customerInfoResponse } from "../test-responses";
import { createMonthlyPackageMock } from "../mocks/offering-mock-provider";

const amazonApiKey = "amazon-api-key";
const getNoAppUserId = () => undefined;

const responseForCode = (
  responseCode: ProductDataResponseCode,
): ProductDataResponse => ({
  productData: new Map(),
  responseCode,
  unavailableSkus: [],
});

const product = (overrides: Partial<Product> = {}): Product => ({
  coinsReward: { amount: 0 },
  description: "Product description",
  price: {
    priceStr: "$4.99",
    priceCurrencyCode: "USD",
    valueInMicros: 4_990_000n,
  },
  productType: ProductType.CONSUMABLE,
  sku: "product-id",
  smallIconUrl: "https://example.com/icon.png",
  title: "Product title",
  promotions: [],
  ...overrides,
});

const responseForProducts = (products: Product[]): ProductDataResponse => ({
  productData: new Map(products.map((item) => [item.sku, item])),
  responseCode: ProductDataResponseCode.SUCCESSFUL,
  unavailableSkus: [],
});

async function getProducts(
  response: ProductDataResponse,
  productIds = ["product-id"],
) {
  getProductData.mockResolvedValue(response);
  return await new AmazonBillingWrapper(
    {} as Backend,
    amazonApiKey,
    getNoAppUserId,
  ).getProducts("app-user-id", productIds);
}

const successfulPurchaseResponse = (): PurchaseResponse => ({
  receipt: {
    cancelDate: null as unknown as Date,
    deferredDate: null as unknown as Date,
    deferredSku: null as unknown as string,
    isCancelled: false,
    isDeferred: false,
    productType: ProductType.SUBSCRIPTION,
    purchaseDate: new Date("2026-08-12T17:00:00Z"),
    receiptId: "amazon-receipt-id",
    sku: "premium-subscription",
    termSku: "monthly",
  },
  requestId: { requestIdStr: "request-id" },
  responseCode: PurchaseResponseCode.SUCCESSFUL,
  userData: {
    lwaConsentStatus: 1,
    marketplace: "US",
    userId: "amazon-store-user-id",
    userProfileAccessConsentStatus: 1,
  },
});

const successfulPurchaseUpdatesResponse = (
  receiptId = "amazon-receipt-id",
) => ({
  receiptList: [
    {
      ...successfulPurchaseResponse().receipt,
      receiptId,
    },
  ],
  responseCode: 1,
  userData: successfulPurchaseResponse().userData,
  hasMore: false,
});

const purchaseUpdatesResponse = (
  overrides: Partial<ReturnType<typeof successfulPurchaseUpdatesResponse>> = {},
) => ({
  ...successfulPurchaseUpdatesResponse(),
  ...overrides,
});

const createBackend = () =>
  ({
    getCustomerInfo: vi.fn().mockResolvedValue(customerInfoResponse),
    postReceipt: vi.fn(),
  }) as unknown as Backend;

describe("AmazonBillingWrapper", () => {
  beforeEach(() => {
    setAmazonAppstoreIAPSDKLoader(async () => AmazonVegaSdk);
    resetReactNativeAppStateLoader();
    getProductData.mockReset();
    getPurchaseUpdates.mockReset();
    notifyFulfillment.mockReset();
    purchase.mockReset();
    vi.restoreAllMocks();
    vi.spyOn(
      VegaDeviceCache.prototype,
      "addSuccessfullyPostedReceiptId",
    ).mockResolvedValue();
  });

  test("initializes the Vega device cache with its API key", () => {
    const wrapper = new AmazonBillingWrapper(
      createBackend(),
      "amazon-api-key",
      getNoAppUserId,
    );

    const deviceCache = (wrapper as unknown as { deviceCache: VegaDeviceCache })
      .deviceCache;
    expect(deviceCache).toBeInstanceOf(VegaDeviceCache);
    expect(deviceCache as unknown as { apiKey: string }).toMatchObject({
      apiKey: "amazon-api-key",
    });
    expect(
      (
        deviceCache as unknown as {
          tokensCachePath: string;
        }
      ).tokensCachePath,
    ).toBe("/data/com.revenuecat.purchases.amazon-api-key.tokens");
  });

  test("syncs pending receipts when the Vega app returns to the foreground", async () => {
    let onAppStateChange: ((state: string) => void) | undefined;
    const subscription = { remove: vi.fn() };
    const appState: ReactNativeAppState = {
      currentState: "background",
      addEventListener: vi.fn(
        (_type: "change", listener: (state: string) => void) => {
          onAppStateChange = listener;
          return subscription;
        },
      ),
    };
    setReactNativeAppStateLoader(async () => appState);
    getPurchaseUpdates.mockResolvedValue(
      purchaseUpdatesResponse({ receiptList: [] }),
    );

    const wrapper = new AmazonBillingWrapper(
      createBackend(),
      amazonApiKey,
      () => "app-user-id",
    );

    await vi.waitFor(() => {
      expect(appState.addEventListener).toHaveBeenCalledOnce();
      expect(getPurchaseUpdates).toHaveBeenCalledOnce();
    });

    onAppStateChange?.("active");

    await vi.waitFor(() => {
      expect(getPurchaseUpdates).toHaveBeenCalledTimes(2);
    });

    wrapper.close();
    expect(subscription.remove).toHaveBeenCalledOnce();
  });

  test("reuses an in-flight pending-purchase sync", async () => {
    let onAppStateChange: ((state: string) => void) | undefined;
    setReactNativeAppStateLoader(async () => ({
      currentState: "background",
      addEventListener: vi.fn(
        (_type: "change", listener: (state: string) => void) => {
          onAppStateChange = listener;
          return { remove: vi.fn() };
        },
      ),
    }));
    let resolvePurchaseUpdates:
      | ((value: ReturnType<typeof purchaseUpdatesResponse>) => void)
      | undefined;
    getPurchaseUpdates.mockReturnValue(
      new Promise((resolve) => {
        resolvePurchaseUpdates = resolve;
      }),
    );

    const wrapper = new AmazonBillingWrapper(
      createBackend(),
      amazonApiKey,
      () => "app-user-id",
    );

    await vi.waitFor(() => {
      expect(getPurchaseUpdates).toHaveBeenCalledOnce();
    });

    onAppStateChange?.("active");
    expect(getPurchaseUpdates).toHaveBeenCalledOnce();

    resolvePurchaseUpdates?.(purchaseUpdatesResponse({ receiptList: [] }));
    await vi.waitFor(() => {
      expect(getPurchaseUpdates).toHaveBeenCalledOnce();
    });
    wrapper.close();
  });

  test("handles failures from a coalesced pending-purchase sync once", async () => {
    let onAppStateChange: ((state: string) => void) | undefined;
    setReactNativeAppStateLoader(async () => ({
      currentState: "background",
      addEventListener: vi.fn(
        (_type: "change", listener: (state: string) => void) => {
          onAppStateChange = listener;
          return { remove: vi.fn() };
        },
      ),
    }));
    let rejectPurchaseUpdates: ((reason?: unknown) => void) | undefined;
    getPurchaseUpdates.mockReturnValue(
      new Promise((_, reject) => {
        rejectPurchaseUpdates = reject;
      }),
    );
    vi.spyOn(
      VegaDeviceCache.prototype,
      "getPreviouslySentReceiptIds",
    ).mockResolvedValue(new Set());
    const warnLog = vi.spyOn(Logger, "warnLog");

    const wrapper = new AmazonBillingWrapper(
      createBackend(),
      amazonApiKey,
      () => "app-user-id",
    );

    await vi.waitFor(() => {
      expect(getPurchaseUpdates).toHaveBeenCalledOnce();
    });

    onAppStateChange?.("active");
    rejectPurchaseUpdates?.(new Error("fetch failed"));

    await vi.waitFor(() => {
      expect(warnLog).toHaveBeenCalledExactlyOnceWith(
        "Failed to sync pending Amazon purchases in the background: PurchasesError(code: StoreProblemError, message: Syncing purchases with the Amazon Store failed.)",
      );
    });
    wrapper.close();
  });

  test("does not throw when a pending-purchase sync fails", async () => {
    let rejectPurchaseUpdates: ((reason?: unknown) => void) | undefined;
    getPurchaseUpdates.mockReturnValue(
      new Promise((_, reject) => {
        rejectPurchaseUpdates = reject;
      }),
    );
    vi.spyOn(
      VegaDeviceCache.prototype,
      "getPreviouslySentReceiptIds",
    ).mockResolvedValue(new Set());

    const wrapper = new AmazonBillingWrapper(
      createBackend(),
      amazonApiKey,
      () => "app-user-id",
    );

    await vi.waitFor(() => {
      expect(getPurchaseUpdates).toHaveBeenCalledOnce();
    });

    const pendingSync = (
      wrapper as unknown as { pendingSync: Promise<void> | undefined }
    ).pendingSync;
    expect(pendingSync).toBeDefined();

    rejectPurchaseUpdates?.(new Error("fetch failed"));

    await expect(pendingSync).resolves.toBeUndefined();
    wrapper.close();
  });

  test("fails clearly when the Amazon SDK loader has not been wired up", async () => {
    resetAmazonAppstoreIAPSDKLoader();

    await expect(
      new AmazonBillingWrapper(
        createBackend(),
        amazonApiKey,
        getNoAppUserId,
      ).getProducts("user", ["monthly"]),
    ).rejects.toMatchObject({
      errorCode: ErrorCode.ConfigurationError,
      message:
        "Amazon Appstore is supported only by the @revenuecat/purchases-js/vega entry point.",
    });

    expect(getProductData).not.toHaveBeenCalled();
  });

  test("syncs, fulfills, and caches only previously unsynced receipts in the background", async () => {
    const backend = createBackend();
    const debugLog = vi.spyOn(Logger, "debugLog");
    vi.mocked(backend.postReceipt).mockResolvedValue(customerInfoResponse);
    getPurchaseUpdates.mockResolvedValue(
      purchaseUpdatesResponse({
        receiptList: [
          {
            ...successfulPurchaseResponse().receipt,
            receiptId: "already-synced",
          },
          {
            ...successfulPurchaseResponse().receipt,
            receiptId: "pending-receipt",
          },
        ],
      }),
    );
    notifyFulfillment.mockResolvedValue({
      responseCode: NotifyFulfillmentResponseCode.SUCCESSFUL,
    });
    vi.spyOn(
      VegaDeviceCache.prototype,
      "getPreviouslySentReceiptIds",
    ).mockResolvedValue(new Set(["already-synced"]));

    new AmazonBillingWrapper(backend, amazonApiKey, () => "app-user-id");

    await vi.waitFor(() => {
      expect(backend.postReceipt).toHaveBeenCalledOnce();
    });

    expect(backend.postReceipt).toHaveBeenCalledExactlyOnceWith(
      "app-user-id",
      "monthly",
      null,
      "pending-receipt",
      null,
      "unsynced_active_purchases",
      undefined,
      "amazon-store-user-id",
      false,
    );
    expect(notifyFulfillment).toHaveBeenCalledExactlyOnceWith({
      receiptId: "pending-receipt",
      fulfillmentResult: FulfillmentResult.FULFILLED,
    });
    expect(
      vi.mocked(VegaDeviceCache.prototype.addSuccessfullyPostedReceiptId),
    ).toHaveBeenCalledExactlyOnceWith("pending-receipt");
    expect(backend.getCustomerInfo).not.toHaveBeenCalled();
    expect(debugLog).toHaveBeenCalledWith("Found 1 receipts to sync");
  });

  test("reports when all Amazon receipts have already been synced", async () => {
    const backend = createBackend();
    const debugLog = vi.spyOn(Logger, "debugLog");
    getPurchaseUpdates.mockResolvedValue(successfulPurchaseUpdatesResponse());
    vi.spyOn(
      VegaDeviceCache.prototype,
      "getPreviouslySentReceiptIds",
    ).mockResolvedValue(new Set(["amazon-receipt-id"]));

    new AmazonBillingWrapper(backend, amazonApiKey, () => "app-user-id");

    await vi.waitFor(() => {
      expect(debugLog).toHaveBeenCalledWith("Found no receipts to sync");
    });

    expect(backend.postReceipt).not.toHaveBeenCalled();
    expect(debugLog).toHaveBeenCalledWith("Found no receipts to sync");
  });

  describe("product data requests", () => {
    test("loads and maps products from the Amazon IAP SDK", async () => {
      getProductData.mockResolvedValue(
        responseForProducts([
          product({
            sku: "monthly",
            productType: ProductType.SUBSCRIPTION,
            title: "Monthly",
            description: "Monthly subscription",
            subscriptionPeriod: "P1M",
            freeTrialPeriod: "P7D",
          }),
        ]),
      );

      const result = await new AmazonBillingWrapper(
        createBackend(),
        amazonApiKey,
        getNoAppUserId,
      ).getProducts("user", ["monthly"]);

      expect(getProductData).toHaveBeenCalledExactlyOnceWith({
        skus: ["monthly"],
      });
      expect(result.product_details[0]).toMatchObject({
        identifier: "monthly",
        product_type: "subscription",
        purchase_options: {
          base_option: {
            price_id: "monthly",
            trial: { period_duration: "P7D" },
          },
        },
      });
    });

    test("deduplicates product IDs before requesting product data", async () => {
      getProductData.mockResolvedValue(
        responseForProducts([product({ sku: "monthly" })]),
      );

      await new AmazonBillingWrapper(
        createBackend(),
        amazonApiKey,
        getNoAppUserId,
      ).getProducts("user", ["monthly", "yearly", "monthly", "yearly"]);

      expect(getProductData).toHaveBeenCalledExactlyOnceWith({
        skus: ["monthly", "yearly"],
      });
    });

    test("requests fewer than 100 unique product IDs in a single batch", async () => {
      const productIds = Array.from(
        { length: 99 },
        (_, index) => `product-${index}`,
      );
      getProductData.mockResolvedValue(responseForProducts([]));

      await new AmazonBillingWrapper(
        createBackend(),
        amazonApiKey,
        getNoAppUserId,
      ).getProducts("user", productIds);

      expect(getProductData).toHaveBeenCalledExactlyOnceWith({
        skus: productIds,
      });
    });

    test("requests more than 100 unique product IDs in sequential batches and combines the results", async () => {
      const productIds = Array.from(
        { length: 201 },
        (_, index) => `product-${index}`,
      );
      getProductData
        .mockResolvedValueOnce(
          responseForProducts([product({ sku: "product-0" })]),
        )
        .mockResolvedValueOnce(
          responseForProducts([product({ sku: "product-100" })]),
        )
        .mockResolvedValueOnce(
          responseForProducts([product({ sku: "product-200" })]),
        );

      const result = await new AmazonBillingWrapper(
        createBackend(),
        amazonApiKey,
        getNoAppUserId,
      ).getProducts("user", productIds);

      expect(getProductData).toHaveBeenNthCalledWith(1, {
        skus: productIds.slice(0, 100),
      });
      expect(getProductData).toHaveBeenNthCalledWith(2, {
        skus: productIds.slice(100, 200),
      });
      expect(getProductData).toHaveBeenNthCalledWith(3, {
        skus: productIds.slice(200),
      });
      expect(
        result.product_details.map(({ identifier }) => identifier),
      ).toEqual(["product-0", "product-100", "product-200"]);
    });

    test("deduplicates product IDs across batch boundaries", async () => {
      const uniqueProductIds = Array.from(
        { length: 101 },
        (_, index) => `product-${index}`,
      );
      const requestedProductIds = [
        ...uniqueProductIds.slice(0, 100),
        "product-0",
        "product-50",
        "product-100",
      ];
      getProductData
        .mockResolvedValueOnce(responseForProducts([]))
        .mockResolvedValueOnce(responseForProducts([]));

      await new AmazonBillingWrapper(
        createBackend(),
        amazonApiKey,
        getNoAppUserId,
      ).getProducts("user", requestedProductIds);

      expect(getProductData).toHaveBeenCalledTimes(2);
      expect(getProductData).toHaveBeenNthCalledWith(1, {
        skus: uniqueProductIds.slice(0, 100),
      });
      expect(getProductData).toHaveBeenNthCalledWith(2, {
        skus: ["product-100"],
      });
    });
  });

  describe("product data response errors", () => {
    test("maps an unsupported response to an unsupported error", async () => {
      await expect(
        getProducts(responseForCode(ProductDataResponseCode.NOT_SUPPORTED)),
      ).rejects.toMatchObject({
        errorCode: ErrorCode.UnsupportedError,
        message: "Couldn't fetch product data, since it is unsupported.",
      } satisfies Partial<PurchasesError>);
    });

    test("maps a failed response to a store problem error", async () => {
      await expect(
        getProducts(responseForCode(ProductDataResponseCode.FAILED)),
      ).rejects.toMatchObject({
        errorCode: ErrorCode.StoreProblemError,
        message: "An error occurred when fetching product data.",
      } satisfies Partial<PurchasesError>);
    });

    test("maps an unrecognized response to a store problem error", async () => {
      await expect(
        getProducts(responseForCode(999 as ProductDataResponseCode)),
      ).rejects.toMatchObject({
        errorCode: ErrorCode.StoreProblemError,
        message:
          "An error occurred when fetching product data. An unrecognized ProductDataResponseCode was received.",
      } satisfies Partial<PurchasesError>);
    });
  });

  describe("purchase syncing", () => {
    test.each([["syncPurchases"], ["restorePurchases"]] as const)(
      "%s requests the complete Amazon purchase history",
      async (method) => {
        const backend = createBackend();
        vi.mocked(backend.postReceipt).mockResolvedValue(customerInfoResponse);
        getPurchaseUpdates.mockResolvedValue(
          successfulPurchaseUpdatesResponse(),
        );

        await new AmazonBillingWrapper(backend, amazonApiKey, getNoAppUserId)[
          method
        ]("app-user-id");

        expect(getPurchaseUpdates).toHaveBeenCalledExactlyOnceWith({
          reset: true,
        });
      },
    );

    test("sync posts receipts on every invocation, while restore posts them and fulfills them", async () => {
      const backend = createBackend();
      vi.mocked(backend.postReceipt).mockResolvedValue(customerInfoResponse);
      getPurchaseUpdates.mockResolvedValue(successfulPurchaseUpdatesResponse());
      notifyFulfillment.mockResolvedValue({
        responseCode: NotifyFulfillmentResponseCode.SUCCESSFUL,
      });
      const getPreviouslySentReceiptIds = vi
        .spyOn(VegaDeviceCache.prototype, "getPreviouslySentReceiptIds")
        .mockResolvedValue(new Set(["amazon-receipt-id"]));
      const wrapper = new AmazonBillingWrapper(
        backend,
        amazonApiKey,
        getNoAppUserId,
      );

      await wrapper.syncPurchases("app-user-id");
      await wrapper.syncPurchases("app-user-id");
      await wrapper.restorePurchases("app-user-id");

      expect(backend.postReceipt).toHaveBeenNthCalledWith(
        1,
        "app-user-id",
        "monthly",
        null,
        "amazon-receipt-id",
        null,
        "restore",
        undefined,
        "amazon-store-user-id",
        false,
      );
      expect(backend.postReceipt).toHaveBeenNthCalledWith(
        2,
        "app-user-id",
        "monthly",
        null,
        "amazon-receipt-id",
        null,
        "restore",
        undefined,
        "amazon-store-user-id",
        false,
      );
      expect(backend.postReceipt).toHaveBeenNthCalledWith(
        3,
        "app-user-id",
        "monthly",
        null,
        "amazon-receipt-id",
        null,
        "restore",
        undefined,
        "amazon-store-user-id",
        true,
      );
      expect(notifyFulfillment).toHaveBeenCalledExactlyOnceWith({
        receiptId: "amazon-receipt-id",
        fulfillmentResult: FulfillmentResult.FULFILLED,
      });
      expect(
        vi.mocked(VegaDeviceCache.prototype.addSuccessfullyPostedReceiptId),
      ).toHaveBeenNthCalledWith(1, "amazon-receipt-id");
      expect(
        vi.mocked(VegaDeviceCache.prototype.addSuccessfullyPostedReceiptId),
      ).toHaveBeenNthCalledWith(2, "amazon-receipt-id");
      expect(backend.getCustomerInfo).toHaveBeenCalledTimes(3);
      expect(backend.getCustomerInfo).toHaveBeenNthCalledWith(1, "app-user-id");
      expect(backend.getCustomerInfo).toHaveBeenNthCalledWith(2, "app-user-id");
      expect(backend.getCustomerInfo).toHaveBeenNthCalledWith(3, "app-user-id");
      expect(getPreviouslySentReceiptIds).not.toHaveBeenCalled();
    });

    test("sync fetches customer info after posting receipts", async () => {
      const backend = createBackend();
      vi.mocked(backend.postReceipt).mockResolvedValue(customerInfoResponse);
      getPurchaseUpdates.mockResolvedValue(successfulPurchaseUpdatesResponse());

      await new AmazonBillingWrapper(
        backend,
        amazonApiKey,
        getNoAppUserId,
      ).syncPurchases("app-user-id");

      expect(backend.postReceipt).toHaveBeenCalledBefore(
        backend.getCustomerInfo as ReturnType<typeof vi.fn>,
      );
      expect(backend.getCustomerInfo).toHaveBeenCalledExactlyOnceWith(
        "app-user-id",
      );
    });

    test("sync continues when caching a successfully posted receipt fails", async () => {
      const backend = createBackend();
      vi.mocked(backend.postReceipt).mockResolvedValue(customerInfoResponse);
      vi.mocked(
        VegaDeviceCache.prototype.addSuccessfullyPostedReceiptId,
      ).mockRejectedValueOnce({
        code: "EIO",
        message: "disk unavailable",
      });
      getPurchaseUpdates.mockResolvedValue(
        purchaseUpdatesResponse({
          receiptList: [
            {
              ...successfulPurchaseResponse().receipt,
              receiptId: "first-receipt",
            },
            {
              ...successfulPurchaseResponse().receipt,
              receiptId: "second-receipt",
            },
          ],
        }),
      );

      await new AmazonBillingWrapper(
        backend,
        amazonApiKey,
        getNoAppUserId,
      ).syncPurchases("app-user-id");

      expect(backend.postReceipt).toHaveBeenCalledTimes(2);
      expect(backend.postReceipt).toHaveBeenNthCalledWith(
        2,
        "app-user-id",
        "monthly",
        null,
        "second-receipt",
        null,
        "restore",
        undefined,
        "amazon-store-user-id",
        false,
      );
      expect(backend.getCustomerInfo).toHaveBeenCalledExactlyOnceWith(
        "app-user-id",
      );
    });

    test("restore logs a cache warning when fulfillment succeeds but caching fails", async () => {
      const backend = createBackend();
      const warningLog = vi
        .spyOn(Logger, "warnLog")
        .mockImplementation(() => {});
      vi.mocked(backend.postReceipt).mockResolvedValue(customerInfoResponse);
      notifyFulfillment.mockResolvedValue({
        responseCode: NotifyFulfillmentResponseCode.SUCCESSFUL,
      });
      vi.mocked(
        VegaDeviceCache.prototype.addSuccessfullyPostedReceiptId,
      ).mockRejectedValueOnce({
        code: "EIO",
        message: "disk unavailable",
      });
      getPurchaseUpdates.mockResolvedValue(successfulPurchaseUpdatesResponse());

      await new AmazonBillingWrapper(
        backend,
        amazonApiKey,
        getNoAppUserId,
      ).restorePurchases("app-user-id");

      expect(notifyFulfillment).toHaveBeenCalledOnce();
      expect(warningLog).toHaveBeenCalledWith(
        "Failed to cache successfully posted receipt ID amazon-receipt-id: EIO: disk unavailable",
      );
    });

    test.each([
      ["syncPurchases", false],
      ["restorePurchases", true],
    ] as const)(
      "%s posts every receipt across paginated responses",
      async (method, isRestore) => {
        const backend = createBackend();
        vi.mocked(backend.postReceipt).mockResolvedValue(customerInfoResponse);
        getPurchaseUpdates
          .mockResolvedValueOnce(
            purchaseUpdatesResponse({
              hasMore: true,
              receiptList: [
                {
                  ...successfulPurchaseResponse().receipt,
                  receiptId: "first-receipt",
                  productType: ProductType.SUBSCRIPTION,
                  termSku: "monthly",
                },
              ],
            }),
          )
          .mockResolvedValueOnce(
            purchaseUpdatesResponse({
              hasMore: false,
              receiptList: [
                {
                  ...successfulPurchaseResponse().receipt,
                  receiptId: "second-receipt",
                  productType: ProductType.CONSUMABLE,
                  sku: "coin-pack",
                  termSku: "unused-term-sku",
                },
              ],
            }),
          );

        await new AmazonBillingWrapper(backend, amazonApiKey, getNoAppUserId)[
          method
        ]("app-user-id");

        expect(getPurchaseUpdates).toHaveBeenCalledTimes(2);
        expect(getPurchaseUpdates).toHaveBeenNthCalledWith(1, { reset: true });
        expect(getPurchaseUpdates).toHaveBeenNthCalledWith(2, { reset: false });
        expect(backend.postReceipt).toHaveBeenNthCalledWith(
          1,
          "app-user-id",
          "monthly",
          null,
          "first-receipt",
          null,
          "restore",
          undefined,
          "amazon-store-user-id",
          isRestore,
        );
        expect(backend.postReceipt).toHaveBeenNthCalledWith(
          2,
          "app-user-id",
          "coin-pack",
          null,
          "second-receipt",
          null,
          "restore",
          undefined,
          "amazon-store-user-id",
          isRestore,
        );
      },
    );

    test.each(["syncPurchases", "restorePurchases"] as const)(
      "%s posts receipts in purchase-date order across pages",
      async (method) => {
        const backend = createBackend();
        vi.mocked(backend.postReceipt).mockResolvedValue(customerInfoResponse);
        getPurchaseUpdates
          .mockResolvedValueOnce(
            purchaseUpdatesResponse({
              hasMore: true,
              receiptList: [
                {
                  ...successfulPurchaseResponse().receipt,
                  receiptId: "later-receipt",
                  purchaseDate: new Date("2026-08-14T17:00:00Z"),
                },
              ],
            }),
          )
          .mockResolvedValueOnce(
            purchaseUpdatesResponse({
              hasMore: false,
              receiptList: [
                {
                  ...successfulPurchaseResponse().receipt,
                  receiptId: "earlier-receipt",
                  purchaseDate: new Date("2026-08-10T17:00:00Z"),
                },
              ],
            }),
          );

        await new AmazonBillingWrapper(backend, amazonApiKey, getNoAppUserId)[
          method
        ]("app-user-id");

        expect(backend.postReceipt).toHaveBeenNthCalledWith(
          1,
          "app-user-id",
          "monthly",
          null,
          "earlier-receipt",
          null,
          "restore",
          undefined,
          "amazon-store-user-id",
          method === "restorePurchases",
        );
        expect(backend.postReceipt).toHaveBeenNthCalledWith(
          2,
          "app-user-id",
          "monthly",
          null,
          "later-receipt",
          null,
          "restore",
          undefined,
          "amazon-store-user-id",
          method === "restorePurchases",
        );
      },
    );

    test.each([["syncPurchases"], ["restorePurchases"]] as const)(
      "%s fetches customer info when no receipts are returned",
      async (method) => {
        const backend = createBackend();
        getPurchaseUpdates.mockResolvedValue(
          purchaseUpdatesResponse({ receiptList: [] }),
        );

        await new AmazonBillingWrapper(backend, amazonApiKey, getNoAppUserId)[
          method
        ]("app-user-id");

        expect(backend.postReceipt).not.toHaveBeenCalled();
        expect(backend.getCustomerInfo).toHaveBeenCalledExactlyOnceWith(
          "app-user-id",
        );
      },
    );

    test.each(["syncPurchases", "restorePurchases"] as const)(
      "%s stops when Amazon reports more pages but returns an empty page",
      async (method) => {
        const backend = createBackend();
        getPurchaseUpdates.mockResolvedValue(
          purchaseUpdatesResponse({ hasMore: true, receiptList: [] }),
        );

        await new AmazonBillingWrapper(backend, amazonApiKey, getNoAppUserId)[
          method
        ]("app-user-id");

        expect(getPurchaseUpdates).toHaveBeenCalledExactlyOnceWith({
          reset: true,
        });
        expect(backend.getCustomerInfo).toHaveBeenCalledExactlyOnceWith(
          "app-user-id",
        );
      },
    );

    test.each(["syncPurchases", "restorePurchases"] as const)(
      "%s does not mark a receipt as synced when posting it fails",
      async (method) => {
        const backend = createBackend();
        const error = new Error("backend unavailable");
        vi.mocked(backend.postReceipt)
          .mockRejectedValueOnce(error)
          .mockResolvedValueOnce(customerInfoResponse);
        getPurchaseUpdates.mockResolvedValue(
          successfulPurchaseUpdatesResponse(),
        );
        const wrapper = new AmazonBillingWrapper(
          backend,
          amazonApiKey,
          getNoAppUserId,
        );

        await expect(wrapper[method]("app-user-id")).rejects.toBe(error);
        await wrapper[method]("app-user-id");

        expect(backend.postReceipt).toHaveBeenCalledTimes(2);
      },
    );

    test.each([
      [
        "syncPurchases",
        PurchaseUpdatesResponseCode.NOT_SUPPORTED,
        ErrorCode.UnsupportedError,
        "Syncing purchases is not supported.",
      ],
      [
        "restorePurchases",
        PurchaseUpdatesResponseCode.NOT_SUPPORTED,
        ErrorCode.UnsupportedError,
        "Restoring purchases is not supported.",
      ],
      [
        "syncPurchases",
        PurchaseUpdatesResponseCode.FAILED,
        ErrorCode.StoreProblemError,
        "Syncing purchases with the Amazon Store failed.",
      ],
      [
        "restorePurchases",
        PurchaseUpdatesResponseCode.FAILED,
        ErrorCode.StoreProblemError,
        "Restoring purchases with the Amazon Store failed.",
      ],
      [
        "syncPurchases",
        999 as PurchaseUpdatesResponseCode,
        ErrorCode.StoreProblemError,
        "Received an unexpected response code from the Amazon Store while syncing purchases.",
      ],
      [
        "restorePurchases",
        999 as PurchaseUpdatesResponseCode,
        ErrorCode.StoreProblemError,
        "Received an unexpected response code from the Amazon Store while restoring purchases.",
      ],
    ] as const)(
      "%s maps response code %s to an error",
      async (method, responseCode, errorCode, message) => {
        const backend = createBackend();
        getPurchaseUpdates.mockResolvedValue(
          purchaseUpdatesResponse({ responseCode }),
        );

        await expect(
          new AmazonBillingWrapper(backend, amazonApiKey, getNoAppUserId)[
            method
          ]("app-user-id"),
        ).rejects.toMatchObject({ errorCode, message });

        expect(backend.postReceipt).not.toHaveBeenCalled();
        expect(backend.getCustomerInfo).not.toHaveBeenCalled();
      },
    );

    test.each(["syncPurchases", "restorePurchases"] as const)(
      "%s wraps an error thrown by Amazon in a PurchasesError",
      async (method) => {
        const backend = createBackend();
        const error = new Error("Amazon IAP unavailable");
        getPurchaseUpdates.mockRejectedValue(error);

        await expect(
          new AmazonBillingWrapper(backend, amazonApiKey, getNoAppUserId)[
            method
          ]("app-user-id"),
        ).rejects.toMatchObject({
          errorCode: ErrorCode.StoreProblemError,
          message: `${method === "restorePurchases" ? "Restoring" : "Syncing"} purchases with the Amazon Store failed.`,
          underlyingErrorMessage: "Amazon IAP unavailable",
        });

        expect(backend.postReceipt).not.toHaveBeenCalled();
        expect(backend.getCustomerInfo).not.toHaveBeenCalled();
      },
    );
  });

  describe("purchases", () => {
    const appUserId = "app-user-id";

    beforeEach(() => {
      purchase.mockResolvedValue(successfulPurchaseResponse());
      notifyFulfillment.mockResolvedValue({
        responseCode: NotifyFulfillmentResponseCode.SUCCESSFUL,
      });
      getProductData.mockResolvedValue(responseForProducts([]));
    });

    test("uses a subscription receipt's term SKU when posting and returning the purchase", async () => {
      const backend = createBackend();
      const postReceipt = vi.mocked(backend.postReceipt);
      postReceipt.mockResolvedValue(customerInfoResponse);
      const params = { rcPackage: createMonthlyPackageMock() };

      const result = await new AmazonBillingWrapper(
        backend,
        amazonApiKey,
        getNoAppUserId,
      ).purchase(params, appUserId);

      expect(purchase).toHaveBeenCalledExactlyOnceWith({ sku: "monthly" });
      expect(postReceipt).toHaveBeenCalledExactlyOnceWith(
        appUserId,
        "monthly",
        "USD",
        "amazon-receipt-id",
        params.rcPackage.webBillingProduct.presentedOfferingContext,
        "purchase",
        undefined,
        "amazon-store-user-id",
        false,
        3,
      );
      expect(notifyFulfillment).toHaveBeenCalledExactlyOnceWith({
        receiptId: "amazon-receipt-id",
        fulfillmentResult: FulfillmentResult.FULFILLED,
      });
      expect(postReceipt).toHaveBeenCalledBefore(notifyFulfillment);
      expect(result).toMatchObject({
        operationSessionId: "amazon-receipt-id",
        redemptionInfo: null,
        storeTransaction: {
          productIdentifier: "monthly",
          storeTransactionId: "amazon-receipt-id",
        },
      });
    });

    test("posts the price from the package in the purchase params", async () => {
      const backend = createBackend();
      vi.mocked(backend.postReceipt).mockResolvedValue(customerInfoResponse);
      const wrapper = new AmazonBillingWrapper(
        backend,
        amazonApiKey,
        getNoAppUserId,
      );

      await wrapper.purchase(
        { rcPackage: createMonthlyPackageMock() },
        appUserId,
      );

      expect(getProductData).not.toHaveBeenCalled();
      expect(backend.postReceipt).toHaveBeenCalledWith(
        appUserId,
        "monthly",
        "USD",
        "amazon-receipt-id",
        expect.anything(),
        "purchase",
        undefined,
        "amazon-store-user-id",
        false,
        3,
      );
    });

    test("posts the selected purchase option's price and currency", async () => {
      const backend = createBackend();
      vi.mocked(backend.postReceipt).mockResolvedValue(customerInfoResponse);
      const rcPackage = createMonthlyPackageMock();
      const selectedPurchaseOption = {
        ...rcPackage.webBillingProduct.defaultSubscriptionOption!,
        base: {
          ...rcPackage.webBillingProduct.defaultSubscriptionOption!.base,
          price: {
            amount: 499,
            amountMicros: 4_990_000,
            currency: "EUR",
            formattedPrice: "€4.99",
          },
        },
      };

      await new AmazonBillingWrapper(
        backend,
        amazonApiKey,
        getNoAppUserId,
      ).purchase(
        { rcPackage, purchaseOption: selectedPurchaseOption },
        appUserId,
      );

      expect(backend.postReceipt).toHaveBeenCalledWith(
        appUserId,
        "monthly",
        "EUR",
        "amazon-receipt-id",
        expect.anything(),
        "purchase",
        undefined,
        "amazon-store-user-id",
        false,
        4.99,
      );
    });

    test("caches a receipt ID after Amazon successfully fulfills it", async () => {
      const backend = createBackend();
      vi.mocked(backend.postReceipt).mockResolvedValue(customerInfoResponse);

      await new AmazonBillingWrapper(
        backend,
        amazonApiKey,
        getNoAppUserId,
      ).purchase({ rcPackage: createMonthlyPackageMock() }, appUserId);

      expect(
        vi.mocked(VegaDeviceCache.prototype.addSuccessfullyPostedReceiptId),
      ).toHaveBeenCalledExactlyOnceWith("amazon-receipt-id");
    });

    test("logs a cache warning when fulfillment succeeds but caching fails", async () => {
      const backend = createBackend();
      const warningLog = vi
        .spyOn(Logger, "warnLog")
        .mockImplementation(() => {});
      vi.mocked(backend.postReceipt).mockResolvedValue(customerInfoResponse);
      vi.mocked(
        VegaDeviceCache.prototype.addSuccessfullyPostedReceiptId,
      ).mockRejectedValueOnce(new Error("disk unavailable"));

      await expect(
        new AmazonBillingWrapper(
          backend,
          amazonApiKey,
          getNoAppUserId,
        ).purchase({ rcPackage: createMonthlyPackageMock() }, appUserId),
      ).resolves.toMatchObject({ operationSessionId: "amazon-receipt-id" });

      expect(notifyFulfillment).toHaveBeenCalledOnce();
      expect(warningLog).toHaveBeenCalledWith(
        "Failed to cache successfully posted receipt ID amazon-receipt-id: Error: disk unavailable",
      );
    });

    test("uses a non-subscription receipt's SKU when posting and returning the purchase", async () => {
      const backend = createBackend();
      const params = { rcPackage: createMonthlyPackageMock() };
      vi.mocked(backend.postReceipt).mockResolvedValue(customerInfoResponse);
      purchase.mockResolvedValue({
        ...successfulPurchaseResponse(),
        receipt: {
          ...successfulPurchaseResponse().receipt,
          productType: ProductType.CONSUMABLE,
          sku: "coin-pack",
          termSku: "unused-term-sku",
        },
      });

      const result = await new AmazonBillingWrapper(
        backend,
        amazonApiKey,
        getNoAppUserId,
      ).purchase(params, appUserId);

      expect(backend.postReceipt).toHaveBeenCalledWith(
        appUserId,
        "coin-pack",
        "USD",
        "amazon-receipt-id",
        params.rcPackage.webBillingProduct.presentedOfferingContext,
        "purchase",
        undefined,
        "amazon-store-user-id",
        false,
        3,
      );
      expect(result.storeTransaction.productIdentifier).toBe("coin-pack");
    });

    test.each([
      [
        PurchaseResponseCode.ALREADY_PURCHASED,
        ErrorCode.ProductAlreadyPurchasedError,
        "Product already purchased",
      ],
      [
        PurchaseResponseCode.INVALID_SKU,
        ErrorCode.ProductNotAvailableForPurchaseError,
        "Invalid SKU: monthly",
      ],
      [
        PurchaseResponseCode.NOT_SUPPORTED,
        ErrorCode.PurchaseNotAllowedError,
        "Purchase not supported",
      ],
      [
        PurchaseResponseCode.FAILED,
        ErrorCode.StoreProblemError,
        "Amazon purchase failed",
      ],
    ] as const)(
      "maps Amazon purchase response code %s to the appropriate error",
      async (responseCode, errorCode, message) => {
        const backend = createBackend();
        purchase.mockResolvedValue({
          ...successfulPurchaseResponse(),
          responseCode,
        });

        await expect(
          new AmazonBillingWrapper(
            backend,
            amazonApiKey,
            getNoAppUserId,
          ).purchase({ rcPackage: createMonthlyPackageMock() }, appUserId),
        ).rejects.toMatchObject({ errorCode, message });

        expect(backend.postReceipt).not.toHaveBeenCalled();
        expect(notifyFulfillment).not.toHaveBeenCalled();
      },
    );

    test("rejects an unrecognized Amazon purchase response without posting or fulfilling", async () => {
      const backend = createBackend();
      const warningLog = vi
        .spyOn(Logger, "warnLog")
        .mockImplementation(() => {});
      purchase.mockResolvedValue({
        ...successfulPurchaseResponse(),
        responseCode: 999 as PurchaseResponseCode,
      });

      await expect(
        new AmazonBillingWrapper(
          backend,
          amazonApiKey,
          getNoAppUserId,
        ).purchase({ rcPackage: createMonthlyPackageMock() }, appUserId),
      ).rejects.toMatchObject({
        errorCode: ErrorCode.StoreProblemError,
        message: "Amazon purchase failed",
      });

      expect(warningLog).toHaveBeenCalledWith(
        "Received an unexpected response code from Amazon when purchasing monthly: 999",
      );
      expect(backend.postReceipt).not.toHaveBeenCalled();
      expect(notifyFulfillment).not.toHaveBeenCalled();
      warningLog.mockRestore();
    });

    test("does not fulfill when posting the receipt fails", async () => {
      const backend = createBackend();
      const postReceiptError = new Error("backend unavailable");
      vi.mocked(backend.postReceipt).mockRejectedValue(postReceiptError);

      await expect(
        new AmazonBillingWrapper(
          backend,
          amazonApiKey,
          getNoAppUserId,
        ).purchase({ rcPackage: createMonthlyPackageMock() }, appUserId),
      ).rejects.toBe(postReceiptError);

      expect(notifyFulfillment).not.toHaveBeenCalled();
    });

    test("propagates errors thrown by Amazon before posting or fulfilling", async () => {
      const backend = createBackend();
      const amazonError = new Error("Amazon IAP unavailable");
      purchase.mockRejectedValue(amazonError);

      await expect(
        new AmazonBillingWrapper(
          backend,
          amazonApiKey,
          getNoAppUserId,
        ).purchase({ rcPackage: createMonthlyPackageMock() }, appUserId),
      ).rejects.toBe(amazonError);

      expect(backend.postReceipt).not.toHaveBeenCalled();
      expect(notifyFulfillment).not.toHaveBeenCalled();
    });

    test.each<[NotifyFulfillmentResponseCode, "warnLog" | "errorLog", string]>([
      [
        NotifyFulfillmentResponseCode.NOT_SUPPORTED,
        "warnLog",
        "Failed to fulfill receipt ID amazon-receipt-id with the Amazon Store: fulfillment is not supported.",
      ],
      [
        NotifyFulfillmentResponseCode.FAILED,
        "errorLog",
        "Failed to fulfill receipt ID amazon-receipt-id with the Amazon Store.",
      ],
      [
        999 as NotifyFulfillmentResponseCode,
        "warnLog",
        "Received an unexpected response code from Amazon when fulfilling receipt ID amazon-receipt-id.",
      ],
    ])(
      "returns a completed purchase and logs fulfillment response %s",
      async (responseCode, logMethod, expectedLog) => {
        const backend = createBackend();
        const log =
          logMethod === "warnLog"
            ? vi.spyOn(Logger, "warnLog")
            : vi.spyOn(Logger, "errorLog");
        log.mockImplementation(() => {});
        vi.mocked(backend.postReceipt).mockResolvedValue(customerInfoResponse);
        notifyFulfillment.mockResolvedValue({ responseCode });

        await expect(
          new AmazonBillingWrapper(
            backend,
            amazonApiKey,
            getNoAppUserId,
          ).purchase({ rcPackage: createMonthlyPackageMock() }, appUserId),
        ).resolves.toMatchObject({ operationSessionId: "amazon-receipt-id" });

        expect(notifyFulfillment).toHaveBeenCalledOnce();
        expect(
          vi.mocked(VegaDeviceCache.prototype.addSuccessfullyPostedReceiptId),
        ).not.toHaveBeenCalled();
        expect(log).toHaveBeenCalledWith(expectedLog);
      },
    );

    test("returns a completed purchase when the fulfillment request fails", async () => {
      const backend = createBackend();
      const fulfillmentError = new Error("fulfillment unavailable");
      const warningLog = vi
        .spyOn(Logger, "warnLog")
        .mockImplementation(() => {});
      vi.mocked(backend.postReceipt).mockResolvedValue(customerInfoResponse);
      notifyFulfillment.mockRejectedValue(fulfillmentError);

      await expect(
        new AmazonBillingWrapper(
          backend,
          amazonApiKey,
          getNoAppUserId,
        ).purchase({ rcPackage: createMonthlyPackageMock() }, appUserId),
      ).resolves.toMatchObject({ operationSessionId: "amazon-receipt-id" });

      expect(backend.postReceipt).toHaveBeenCalledOnce();
      await vi.waitFor(() => {
        expect(warningLog).toHaveBeenCalledWith(
          "Failed to fulfill receipt ID amazon-receipt-id with the Amazon Store: Error: fulfillment unavailable",
        );
      });
    });
  });

  describe("product conversion", () => {
    test("maps a consumable product", async () => {
      const { product_details: products } = await getProducts(
        responseForProducts([product()]),
      );

      expect(products).toEqual([
        {
          identifier: "product-id",
          product_type: "consumable",
          title: "Product title",
          description: "Product description",
          default_purchase_option_id: "base_option",
          purchase_options: {
            base_option: {
              id: "base_option",
              price_id: "product-id",
              discount: null,
              base_price: { amount_micros: 4_990_000, currency: "USD" },
            },
          },
        },
      ]);
    });

    test("maps a subscription with trial and introductory pricing", async () => {
      const { product_details: products } = await getProducts(
        responseForProducts([
          product({
            productType: ProductType.SUBSCRIPTION,
            subscriptionPeriod: "P1M",
            freeTrialPeriod: "P7D",
            promotions: [
              {
                type: "introductory",
                plans: [
                  {
                    period: "P1M",
                    price: {
                      priceStr: "$1.99",
                      priceCurrencyCode: "USD",
                      valueInMicros: 1_990_000n,
                    },
                    priceCycles: 3n,
                  },
                ],
              },
            ],
          }),
        ]),
      );

      expect(products[0].purchase_options.base_option).toMatchObject({
        base: {
          period_duration: "P1M",
          price: { amount_micros: 4_990_000, currency: "USD" },
          cycle_count: 0,
        },
        trial: { period_duration: "P7D", price: null, cycle_count: 1 },
        intro_price: {
          period_duration: "P1M",
          price: { amount_micros: 1_990_000, currency: "USD" },
          cycle_count: 3,
        },
      });
    });

    test.each([
      ["Weekly", "P1W"],
      ["BiWeekly", "P2W"],
      ["Monthly", "P1M"],
      ["BiMonthly", "P2M"],
      ["Quarterly", "P3M"],
      ["SemiAnnually", "P6M"],
      ["SemiAnnual", "P6M"],
      ["Annually", "P1Y"],
      ["Annual", "P1Y"],
      ["7 Days", "P7D"],
      ["14 Days", "P14D"],
      ["1 Month", "P1M"],
      ["p1m", "P1M"],
    ])("normalizes Amazon period %s to %s", async (period, expectedPeriod) => {
      const { product_details: products } = await getProducts(
        responseForProducts([
          product({
            productType: ProductType.SUBSCRIPTION,
            subscriptionPeriod: period,
          }),
        ]),
      );

      expect(products[0].purchase_options.base_option).toMatchObject({
        base: { period_duration: expectedPeriod },
      });
    });

    test("maps an entitled product to non-consumable", async () => {
      const { product_details: products } = await getProducts(
        responseForProducts([product({ productType: ProductType.ENTITLED })]),
      );

      expect(products[0].product_type).toBe("non_consumable");
    });

    test("logs and excludes an unknown Amazon product type", async () => {
      const warningLog = vi
        .spyOn(Logger, "warnLog")
        .mockImplementation(() => {});

      const { product_details: products } = await getProducts(
        responseForProducts([product({ productType: 99 as ProductType })]),
      );

      expect(warningLog).toHaveBeenCalledWith(
        'Detected unknown Amazon product type "99" for product "product-id". Ignoring it.',
      );
      expect(products).toEqual([]);

      warningLog.mockRestore();
    });

    test("logs a warning and excludes products with a null price", async () => {
      const warningLog = vi
        .spyOn(Logger, "warnLog")
        .mockImplementation(() => {});

      const { product_details: products } = await getProducts(
        responseForProducts([
          product({ price: null as unknown as Product["price"] }),
          product({ sku: "available-product" }),
        ]),
        ["product-id", "available-product"],
      );

      expect(warningLog).toHaveBeenCalledWith(
        "The Amazon Store returned a null price for product product-id, ignoring it.",
      );
      expect(products).toHaveLength(1);
      expect(products[0].identifier).toBe("available-product");

      warningLog.mockRestore();
    });
  });
});
