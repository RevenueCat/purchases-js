import { describe, expect, test } from "vitest";
import {
  GetBrandingInfoEndpoint,
  GetCheckoutStatusEndpoint,
  GetCustomerInfoEndpoint,
  GetOfferingsEndpoint,
  GetProductsEndpoint,
  SubscribeEndpoint,
} from "../../networking/endpoints";

describe("getOfferings endpoint", () => {
  const endpoint = new GetOfferingsEndpoint("someAppUserId");

  test("uses correct method", () => {
    expect(endpoint.method).toBe("GET");
  });

  test("has correct url for common app user id", () => {
    expect(endpoint.url()).toBe(
      "http://localhost:8000/v1/subscribers/someAppUserId/offerings",
    );
  });

  test("correctly encodes app user id", () => {
    expect(
      new GetOfferingsEndpoint("some+User/id#That$Requires&Encoding").url(),
    ).toBe(
      "http://localhost:8000/v1/subscribers/some%2BUser%2Fid%23That%24Requires%26Encoding/offerings",
    );
  });
});

describe("subscribe endpoint", () => {
  const endpoint = new SubscribeEndpoint();

  test("uses correct method", () => {
    expect(endpoint.method).toBe("POST");
  });

  test("has correct path", () => {
    expect(endpoint.url()).toBe("http://localhost:8000/rcbilling/v1/subscribe");
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

  test("has correct path for common app user id", () => {
    expect(endpoint.url()).toBe(
      "http://localhost:8000/rcbilling/v1/subscribers/someAppUserId/products?id=monthly&id=annual",
    );
  });

  test("correctly encodes app user id and product ids", () => {
    expect(
      new GetProductsEndpoint("some+User/id#That$Requires&Encoding", [
        "product+id/That$requires!Encoding",
        "productIdWithoutEncoding",
      ]).url(),
    ).toBe(
      "http://localhost:8000/rcbilling/v1/subscribers/some%2BUser%2Fid%23That%24Requires%26Encoding/products?id=product%2Bid%2FThat%24requires!Encoding&id=productIdWithoutEncoding",
    );
  });
});

describe("getCustomerInfo endpoint", () => {
  const endpoint = new GetCustomerInfoEndpoint("someAppUserId");

  test("uses correct method", () => {
    expect(endpoint.method).toBe("GET");
  });

  test("has correct path for common app user id", () => {
    expect(endpoint.url()).toBe(
      "http://localhost:8000/v1/subscribers/someAppUserId",
    );
  });

  test("correctly encodes app user id", () => {
    expect(
      new GetCustomerInfoEndpoint("some+User/id#That$Requires&Encoding").url(),
    ).toBe(
      "http://localhost:8000/v1/subscribers/some%2BUser%2Fid%23That%24Requires%26Encoding",
    );
  });
});

describe("getBrandingInfo endpoint", () => {
  const endpoint = new GetBrandingInfoEndpoint();

  test("uses correct method", () => {
    expect(endpoint.method).toBe("GET");
  });

  test("has correct path", () => {
    expect(endpoint.url()).toBe("http://localhost:8000/rcbilling/v1/branding");
  });
});

describe("getCheckoutStatus endpoint", () => {
  const endpoint = new GetCheckoutStatusEndpoint("someOperationSessionId");

  test("uses correct method", () => {
    expect(endpoint.method).toBe("GET");
  });

  test("has correct path", () => {
    expect(endpoint.url()).toBe(
      "http://localhost:8000/rcbilling/v1/checkout/someOperationSessionId",
    );
  });
});
