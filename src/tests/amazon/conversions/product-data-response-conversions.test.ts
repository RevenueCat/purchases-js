import { describe, expect, test, vi } from "vitest";

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
}));

import {
  type Product,
  type ProductDataResponse,
  ProductDataResponseCode,
  ProductType,
} from "@amazon-devices/keplerscript-appstore-iap-lib";
import {
  productsForProductDataResponse,
  purchasesErrorForProductDataResponse,
} from "../../../amazon/conversions/product-data-response-conversions";
import { ErrorCode, PurchasesError } from "../../../entities/errors";
import { Logger } from "../../../helpers/logger";

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

describe("purchasesErrorForProductDataResponse", () => {
  test("returns no error for a successful response", () => {
    expect(
      purchasesErrorForProductDataResponse(
        responseForCode(ProductDataResponseCode.SUCCESSFUL),
      ),
    ).toBeNull();
  });

  test("maps an unsupported response to an unsupported error", () => {
    const error = purchasesErrorForProductDataResponse(
      responseForCode(ProductDataResponseCode.NOT_SUPPORTED),
    );

    expect(error).toBeInstanceOf(PurchasesError);
    expect(error).toMatchObject({
      errorCode: ErrorCode.UnsupportedError,
      message: "Couldn't fetch product data, since is is unsupported.",
    });
  });

  test("maps a failed response to a store problem error", () => {
    const error = purchasesErrorForProductDataResponse(
      responseForCode(ProductDataResponseCode.FAILED),
    );

    expect(error).toBeInstanceOf(PurchasesError);
    expect(error).toMatchObject({
      errorCode: ErrorCode.StoreProblemError,
      message: "An error occurred when fetching product data.",
    });
  });
});

describe("productsForProductDataResponse", () => {
  test("maps a consumable product", () => {
    const products = productsForProductDataResponse(
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

  test("maps a subscription with trial and introductory pricing", () => {
    const products = productsForProductDataResponse(
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
  ])("normalizes Amazon period %s to %s", (period, expectedPeriod) => {
    const products = productsForProductDataResponse(
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

  test("maps an entitled product to non-consumable", () => {
    const products = productsForProductDataResponse(
      responseForProducts([product({ productType: ProductType.ENTITLED })]),
    );

    expect(products[0].product_type).toBe("non_consumable");
  });

  test("logs the raw Amazon value for an unknown product type", () => {
    const warningLog = vi.spyOn(Logger, "warnLog").mockImplementation(() => {});

    productsForProductDataResponse(
      responseForProducts([product({ productType: 99 as ProductType })]),
    );

    expect(warningLog).toHaveBeenCalledWith(
      'Detected unknown Amazon product type "99" for product "product-id". Ignoring it.',
    );

    warningLog.mockRestore();
  });

  test("logs a warning and excludes products with a null price", () => {
    const warningLog = vi.spyOn(console, "warn").mockImplementation(() => {});

    const products = productsForProductDataResponse(
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
