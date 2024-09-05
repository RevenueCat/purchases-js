import { describe, expect, test } from "vitest";
import { configurePurchases } from "./base.purchases_test";
import { APIGetRequest, type GetRequest } from "./test-responses";

describe("purchase", () => {
  test("purchase loads branding if not preloaded", async () => {
    const purchases = configurePurchases();
    const expectedRequest: GetRequest = {
      url: "http://localhost:8000/rcbilling/v1/branding",
    };
    const offerings = await purchases.getOfferings();
    const packageToBuy = offerings.current?.availablePackages[0];
    expect(packageToBuy).not.toBeNull();
    expect(APIGetRequest).not.toHaveBeenCalledWith(expectedRequest);
    // Currently we hold on the purchase UI, so we add a timeout to not hold the test forever.
    // We're just checking that the request happened as expected.
    await Promise.race([
      purchases.purchase({
        rcPackage: packageToBuy!,
      }),
      new Promise((resolve) => setTimeout(resolve, 100)),
    ]);
    expect(APIGetRequest).toHaveBeenCalledWith(expectedRequest);
  });
});

describe("preload", () => {
  test("loads branding info", async () => {
    const purchases = configurePurchases();
    const expectedRequest: GetRequest = {
      url: "http://localhost:8000/rcbilling/v1/branding",
    };
    expect(APIGetRequest).not.toHaveBeenCalledWith(expectedRequest);
    await purchases.preload();
    expect(APIGetRequest).toHaveBeenCalledWith(expectedRequest);
  });
});
