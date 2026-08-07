import { describe, expect, test, vi } from "vitest";

const { getProductData } = vi.hoisted(() => ({
  getProductData: vi.fn(),
}));

vi.mock("@amazon-devices/keplerscript-appstore-iap-lib", () => ({
  ProductDataResponseCode: { SUCCESSFUL: 1, NOT_SUPPORTED: 2, FAILED: 3 },
  ProductType: { CONSUMABLE: 1, ENTITLED: 2, SUBSCRIPTION: 3 },
  PurchasingService: { getProductData },
}));

import { AmazonBillingWrapper } from "../../amazon/amazon-billing-wrapper";
import {
  ProductDataResponseCode,
  ProductType,
} from "@amazon-devices/keplerscript-appstore-iap-lib";

describe("AmazonBillingWrapper", () => {
  test("loads and maps products from the Amazon IAP SDK", async () => {
    getProductData.mockResolvedValue({
      responseCode: ProductDataResponseCode.SUCCESSFUL,
      productData: new Map(
        [
          {
            sku: "monthly",
            productType: ProductType.SUBSCRIPTION,
            title: "Monthly",
            description: "Monthly subscription",
            price: { valueInMicros: 4_990_000n, priceCurrencyCode: "USD" },
            subscriptionPeriod: "P1M",
            freeTrialPeriod: "P7D",
            promotions: [],
            coinsReward: { amount: 0 },
            smallIconUrl: "",
          },
        ].map((product) => [product.sku, product]),
      ),
      unavailableSkus: [],
    });

    const result = await new AmazonBillingWrapper().getProducts("user", [
      "monthly",
    ]);

    expect(getProductData).toHaveBeenCalledWith({ skus: ["monthly"] });

    expect(result.product_details[0]).toMatchObject({
      identifier: "monthly",
      product_type: "subscription",
      purchase_options: {
        base_option: {
          price_id: "monthly",
          trial: {
            period_duration: "P7D",
          },
        },
      },
    });
  });
});
