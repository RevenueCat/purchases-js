import { beforeEach, describe, expect, test, vi } from "vitest";

const { getProductData, notifyFulfillment, purchase } = vi.hoisted(() => ({
  getProductData: vi.fn(),
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
  ProductType: {
    CONSUMABLE: 1,
    ENTITLED: 2,
    SUBSCRIPTION: 3,
  },
  PurchasingService: { getProductData, notifyFulfillment, purchase },
}));

import {
  FulfillmentResult,
  NotifyFulfillmentResponseCode,
  type Product,
  type ProductDataResponse,
  ProductDataResponseCode,
  type PurchaseResponse,
  PurchaseResponseCode,
  ProductType,
} from "@amazon-devices/keplerscript-appstore-iap-lib";
import { AmazonBillingWrapper } from "../../amazon/amazon-billing-wrapper";
import { ErrorCode } from "../../entities/errors";
import type { PurchasesError } from "../../entities/errors";
import { Logger } from "../../helpers/logger";
import type { Backend } from "../../networking/backend";
import { customerInfoResponse } from "../test-responses";
import { createMonthlyPackageMock } from "../mocks/offering-mock-provider";

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

async function getProducts(response: ProductDataResponse) {
  getProductData.mockResolvedValue(response);
  return await new AmazonBillingWrapper({} as Backend).getProducts(
    "app-user-id",
    ["product-id"],
  );
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

const createBackend = () =>
  ({
    postReceipt: vi.fn(),
  }) as unknown as Backend;

describe("AmazonBillingWrapper", () => {
  beforeEach(() => {
    getProductData.mockReset();
    notifyFulfillment.mockReset();
    purchase.mockReset();
    vi.restoreAllMocks();
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

      const result = await new AmazonBillingWrapper().getProducts("user", [
        "monthly",
      ]);

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

      await new AmazonBillingWrapper().getProducts("user", [
        "monthly",
        "yearly",
        "monthly",
        "yearly",
      ]);

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

      await new AmazonBillingWrapper().getProducts("user", productIds);

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

      const result = await new AmazonBillingWrapper().getProducts(
        "user",
        productIds,
      );

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

      await new AmazonBillingWrapper().getProducts("user", requestedProductIds);

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

  describe("purchases", () => {
    const appUserId = "app-user-id";

    beforeEach(() => {
      purchase.mockResolvedValue(successfulPurchaseResponse());
      notifyFulfillment.mockResolvedValue({
        responseCode: NotifyFulfillmentResponseCode.SUCCESSFUL,
      });
    });

    test("uses a subscription receipt's term SKU when posting and returning the purchase", async () => {
      const backend = createBackend();
      const postReceipt = vi.mocked(backend.postReceipt);
      postReceipt.mockResolvedValue(customerInfoResponse);
      const params = { rcPackage: createMonthlyPackageMock() };

      const result = await new AmazonBillingWrapper(backend).purchase(
        params,
        appUserId,
      );

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

      const result = await new AmazonBillingWrapper(backend).purchase(
        params,
        appUserId,
      );

      expect(backend.postReceipt).toHaveBeenCalledWith(
        appUserId,
        "coin-pack",
        "USD",
        "amazon-receipt-id",
        params.rcPackage.webBillingProduct.presentedOfferingContext,
        "purchase",
        undefined,
        "amazon-store-user-id",
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
    ])(
      "maps Amazon purchase response code %s to the appropriate error",
      async (responseCode, errorCode, message) => {
        const backend = createBackend();
        purchase.mockResolvedValue({
          ...successfulPurchaseResponse(),
          responseCode,
        });

        await expect(
          new AmazonBillingWrapper(backend).purchase(
            { rcPackage: createMonthlyPackageMock() },
            appUserId,
          ),
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
        new AmazonBillingWrapper(backend).purchase(
          { rcPackage: createMonthlyPackageMock() },
          appUserId,
        ),
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
        new AmazonBillingWrapper(backend).purchase(
          { rcPackage: createMonthlyPackageMock() },
          appUserId,
        ),
      ).rejects.toBe(postReceiptError);

      expect(notifyFulfillment).not.toHaveBeenCalled();
    });

    test("propagates errors thrown by Amazon before posting or fulfilling", async () => {
      const backend = createBackend();
      const amazonError = new Error("Amazon IAP unavailable");
      purchase.mockRejectedValue(amazonError);

      await expect(
        new AmazonBillingWrapper(backend).purchase(
          { rcPackage: createMonthlyPackageMock() },
          appUserId,
        ),
      ).rejects.toBe(amazonError);

      expect(backend.postReceipt).not.toHaveBeenCalled();
      expect(notifyFulfillment).not.toHaveBeenCalled();
    });

    test.each([
      [
        NotifyFulfillmentResponseCode.NOT_SUPPORTED,
        "Failed to fulfill receipt ID amazon-receipt-id with the Amazon Store: fulfillment is not supported.",
      ],
      [
        NotifyFulfillmentResponseCode.FAILED,
        "Failed to fulfill receipt ID amazon-receipt-id with the Amazon Store.",
      ],
      [
        999 as NotifyFulfillmentResponseCode,
        "Received an unexpected response code from Amazon when fulfilling receipt ID amazon-receipt-id.",
      ],
    ])(
      "returns a completed purchase and logs fulfillment response %s",
      async (responseCode, expectedWarning) => {
        const backend = createBackend();
        const warningLog = vi
          .spyOn(Logger, "warnLog")
          .mockImplementation(() => {});
        vi.mocked(backend.postReceipt).mockResolvedValue(customerInfoResponse);
        notifyFulfillment.mockResolvedValue({ responseCode });

        await expect(
          new AmazonBillingWrapper(backend).purchase(
            { rcPackage: createMonthlyPackageMock() },
            appUserId,
          ),
        ).resolves.toMatchObject({ operationSessionId: "amazon-receipt-id" });

        expect(notifyFulfillment).toHaveBeenCalledOnce();
        expect(warningLog).toHaveBeenCalledWith(expectedWarning);
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
        new AmazonBillingWrapper(backend).purchase(
          { rcPackage: createMonthlyPackageMock() },
          appUserId,
        ),
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
