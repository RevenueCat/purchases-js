import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const { purchasingService } = vi.hoisted(() => ({
  purchasingService: { getProductData: vi.fn() },
}));

const { keplerFileSystem } = vi.hoisted(() => ({
  keplerFileSystem: { readFileAsString: vi.fn(), writeStringToFile: vi.fn() },
}));

const { isPresentOnOS } = vi.hoisted(() => ({
  isPresentOnOS: vi.fn(() => true),
}));

const { appState } = vi.hoisted(() => ({
  appState: { currentState: "active", addEventListener: vi.fn() },
}));

vi.mock("@amazon-devices/keplerscript-appstore-iap-lib", () => ({
  ProductDataResponseCode: { SUCCESSFUL: 1, NOT_SUPPORTED: 2, FAILED: 3 },
  ProductType: { CONSUMABLE: 1, ENTITLED: 2, SUBSCRIPTION: 3 },
  PurchasingService: purchasingService,
}));

vi.mock("@amazon-devices/kepler-file-system", () => ({
  KeplerFileSystem: keplerFileSystem,
}));

vi.mock("@amazon-devices/kepler-compatibility", () => ({
  isPresentOnOS,
}));

vi.mock("react-native", () => ({
  AppState: appState,
}));

import { defaultHttpConfig } from "../../../src/entities/http-config";
import { Purchases } from "../index";
import { testUserId } from "../../../src/tests/base.purchases_test";
import { APIGetRequest } from "../../../src/tests/test-responses";
import { AmazonBillingWrapper } from "../amazon/amazon-billing-wrapper";
import type { CustomerInfo } from "../../../src/entities/customer-info";
import { ErrorCode, PurchasesError } from "../../../src/entities/errors";

describe("Vega module", () => {
  beforeEach(() => {
    purchasingService.getProductData.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("configures with an Amazon API key", () => {
    expect(() =>
      Purchases.configure({
        apiKey: "amzn_valid_key",
        appUserId: testUserId,
      }),
    ).not.toThrow();
  });

  test("throws when configured with a non-Amazon API key", () => {
    expect(() =>
      Purchases.configure({
        apiKey: "rcb_valid_key",
        appUserId: testUserId,
      }),
    ).toThrowError(
      "Vega applications must be configured with an Amazon Appstore API key.",
    );
  });

  test("throws when configured with a non-Amazon API key using positional arguments", () => {
    expect(() => Purchases.configure("rcb_valid_key", testUserId)).toThrowError(
      "Vega applications must be configured with an Amazon Appstore API key.",
    );
  });

  test("does not load web branding when preloading", async () => {
    const purchases = Purchases.configure({
      apiKey: "amzn_valid_key",
      appUserId: testUserId,
      httpConfig: defaultHttpConfig,
    });
    await purchases.preload();
    expect(APIGetRequest).not.toHaveBeenCalledWith({
      url: "http://localhost:8000/rcbilling/v1/branding",
    });
  });

  test("uses the Amazon IAP SDK for offerings with an Amazon API key", async () => {
    purchasingService.getProductData.mockResolvedValue({
      responseCode: 1,
      productData: new Map(
        ["monthly", "monthly_2"].map((sku) => [
          sku,
          {
            coinsReward: { amount: 0 },
            description: `${sku} description`,
            price: {
              priceStr: "$4.99",
              priceCurrencyCode: "USD",
              valueInMicros: 4_990_000n,
            },
            productType: 3,
            sku,
            smallIconUrl: "",
            title: sku,
            promotions: [],
            subscriptionPeriod: "P1M",
          },
        ]),
      ),
      unavailableSkus: [],
    });
    const purchases = Purchases.configure({
      apiKey: "amzn_valid_key",
      appUserId: testUserId,
      httpConfig: defaultHttpConfig,
      flags: { rcSource: "rcSource" },
    });

    await purchases.getOfferings();

    expect(purchasingService.getProductData).toHaveBeenCalledExactlyOnceWith({
      skus: ["monthly", "monthly_2"],
    });
    expect(APIGetRequest).toHaveBeenCalledExactlyOnceWith({
      url: `http://localhost:8000/v1/subscribers/${testUserId}/offerings`,
    });
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
