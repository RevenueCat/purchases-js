import { describe, expect, test, vi } from "vitest";
import { AmazonBillingWrapper } from "../../amazon/amazon-billing-wrapper";
import type {
  AmazonIapClient,
  AmazonProductData,
} from "../../amazon/amazon-vega-iap-client";
import { AmazonVegaIapClient } from "../../amazon/amazon-vega-iap-client";
import type { AmazonVegaSdk } from "../../amazon/amazon-vega-sdk-loader";
import { Logger } from "../../helpers/logger";

describe("AmazonBillingWrapper", () => {
  test("maps products from an injected Amazon IAP client", async () => {
    const response: AmazonProductData = {
      responseCode: "SUCCESSFUL",
      isSuccessful: true,
      products: [
        {
          identifier: "monthly",
          productType: "subscription",
          title: "Monthly",
          description: "Monthly subscription",
          price: { valueInMicros: "4990000", currencyCode: "USD" },
          subscriptionPeriod: "P1M",
          freeTrialPeriod: "P7D",
          promotions: [],
        },
      ],
    };
    const client: AmazonIapClient = {
      preload: async () => {},
      getProductData: async () => response,
    };

    const result = await new AmazonBillingWrapper(client).getProducts("user", [
      "monthly",
    ]);

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

describe("AmazonVegaIapClient", () => {
  test("logs and rethrows getProductData errors from the native SDK", async () => {
    const error = new Error("native SDK unavailable");
    const sdk = {
      PurchasingService: {
        getProductData: async () => Promise.reject(error),
      },
    } as unknown as AmazonVegaSdk;
    const errorLog = vi.spyOn(Logger, "errorLog").mockImplementation(() => {});
    const client = new AmazonVegaIapClient(async () => sdk);

    await expect(client.getProductData(["monthly"])).rejects.toBe(error);
    expect(errorLog).toHaveBeenCalledWith(
      "Exception while calling getProductData Error: native SDK unavailable",
    );

    errorLog.mockRestore();
  });

  test("returns no products when the native SDK fails with null product data", async () => {
    const sdk = {
      PurchasingService: {
        getProductData: async () => ({
          responseCode: "FAILED",
          productData: null,
        }),
      },
      ProductDataResponseCode: { SUCCESSFUL: "SUCCESSFUL" },
    } as unknown as AmazonVegaSdk;
    const client = new AmazonVegaIapClient(async () => sdk);

    await expect(client.getProductData(["monthly"])).resolves.toEqual({
      responseCode: "FAILED",
      isSuccessful: false,
      products: [],
    });
  });
});
