import { describe, expect, test, vi } from "vitest";

const { getProductData } = vi.hoisted(() => ({
  getProductData: vi.fn(),
}));

vi.mock("@amazon-devices/keplerscript-appstore-iap-lib", () => ({
  ProductDataResponseCode: {
    SUCCESSFUL: 1,
    NOT_SUPPORTED: 2,
    FAILED: 3,
  },
  ProductType: {
    CONSUMABLE: 1,
    ENTITLED: 2,
    SUBSCRIPTION: 3,
  },
  PurchasingService: { getProductData },
}));

import {
  type Product,
  type ProductDataResponse,
  ProductDataResponseCode,
  ProductType,
} from "@amazon-devices/keplerscript-appstore-iap-lib";
import { AmazonBillingWrapper } from "../../amazon/amazon-billing-wrapper";
import { ErrorCode } from "../../entities/errors";
import type { PurchasesError } from "../../entities/errors";
import { Logger } from "../../helpers/logger";

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
  return await new AmazonBillingWrapper().getProducts("app-user-id", [
    "product-id",
  ]);
}

describe("AmazonBillingWrapper", () => {
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
  });

  describe("product data response errors", () => {
    test("maps an unsupported response to an unsupported error", async () => {
      await expect(
        getProducts(responseForCode(ProductDataResponseCode.NOT_SUPPORTED)),
      ).rejects.toMatchObject({
        errorCode: ErrorCode.UnsupportedError,
        message: "Couldn't fetch product data, since is is unsupported.",
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
      const warningLog = vi.spyOn(console, "warn").mockImplementation(() => {});

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
