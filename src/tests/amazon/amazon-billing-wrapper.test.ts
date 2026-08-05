import { describe, expect, test } from "vitest";
import { AmazonBillingWrapper } from "../../amazon/amazon-billing-wrapper";
import type {
  AmazonIapClient,
  AmazonProductData,
} from "../../amazon/amazon-vega-iap-client";

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
