import { describe, expect, test } from "vitest";
import {
  GetBrandingInfoEndpoint,
  GetCheckoutStatusEndpoint,
  GetCustomerInfoEndpoint,
  GetOfferingsEndpoint,
  GetProductsEndpoint,
  PurchaseEndpoint,
} from "../../networking/endpoints";

describe("getOfferings endpoint", () => {
  const endpoint = new GetOfferingsEndpoint("someAppUserId");

  test("uses correct method", () => {
    expect(endpoint.method).toBe("GET");
  });

  test("has correct urlPath for common app user id", () => {
    expect(endpoint.urlPath()).toBe("/v1/subscribers/someAppUserId/offerings");
  });

  test("correctly encodes app user id", () => {
    expect(
      new GetOfferingsEndpoint("some+User/id#That$Requires&Encoding").urlPath(),
    ).toBe(
      "/v1/subscribers/some%2BUser%2Fid%23That%24Requires%26Encoding/offerings",
    );
  });
});

describe("purchase endpoint", () => {
  const endpoint = new PurchaseEndpoint();

  test("uses correct method", () => {
    expect(endpoint.method).toBe("POST");
  });

  test("has correct urlPath", () => {
    expect(endpoint.urlPath()).toBe("/rcbilling/v1/purchase");
  });
});

describe("getProducts endpoint", () => {
  const endpoint = new GetProductsEndpoint("someAppUserId", [
    "monthly",
    "annual",
  ]);

  test("uses correct method", () => {
    expect(endpoint.method).toBe("GET");
  });

  test("has correct urlPath for common app user id", () => {
    expect(endpoint.urlPath()).toBe(
      "/rcbilling/v1/subscribers/someAppUserId/products?id=monthly&id=annual",
    );
  });

  test("correctly encodes app user id and product ids", () => {
    expect(
      new GetProductsEndpoint("some+User/id#That$Requires&Encoding", [
        "product+id/That$requires!Encoding",
        "productIdWithoutEncoding",
      ]).urlPath(),
    ).toBe(
      "/rcbilling/v1/subscribers/some%2BUser%2Fid%23That%24Requires%26Encoding/products?id=product%2Bid%2FThat%24requires!Encoding&id=productIdWithoutEncoding",
    );
  });
});

describe("getCustomerInfo endpoint", () => {
  const endpoint = new GetCustomerInfoEndpoint("someAppUserId");

  test("uses correct method", () => {
    expect(endpoint.method).toBe("GET");
  });

  test("has correct urlPath for common app user id", () => {
    expect(endpoint.urlPath()).toBe("/v1/subscribers/someAppUserId");
  });

  test("correctly encodes app user id", () => {
    expect(
      new GetCustomerInfoEndpoint(
        "some+User/id#That$Requires&Encoding",
      ).urlPath(),
    ).toBe("/v1/subscribers/some%2BUser%2Fid%23That%24Requires%26Encoding");
  });
});

describe("getBrandingInfo endpoint", () => {
  const endpoint = new GetBrandingInfoEndpoint("rc_billing");

  test("uses correct method", () => {
    expect(endpoint.method).toBe("GET");
  });

  test("has correct urlPath", () => {
    expect(endpoint.urlPath()).toBe(
      "/rcbilling/v1/branding?provider=rc_billing",
    );
  });
});

describe("getCheckoutStatus endpoint", () => {
  const endpoint = new GetCheckoutStatusEndpoint("someOperationSessionId");

  test("uses correct method", () => {
    expect(endpoint.method).toBe("GET");
  });

  test("has correct urlPath", () => {
    expect(endpoint.urlPath()).toBe(
      "/rcbilling/v1/checkout/someOperationSessionId",
    );
  });
});
