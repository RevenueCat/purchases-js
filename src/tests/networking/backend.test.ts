import { type SetupServer, setupServer } from "msw/node";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { http, HttpResponse } from "msw";
import {
  customerInfoResponse,
  offeringsArray,
  productsResponse,
} from "../test-responses";
import { Backend } from "../../networking/backend";
import { StatusCodes } from "http-status-codes";
import {
  BackendErrorCode,
  ErrorCode,
  PurchasesError,
} from "../../entities/errors";
import { expectPromiseToError } from "../test-helpers";
import { type PurchaseResponse } from "../../networking/responses/purchase-response";

let server: SetupServer;
let backend: Backend;

beforeEach(() => {
  server = setupServer();
  server.listen();
  backend = new Backend("test_api_key");
});

afterEach(() => {
  server.close();
});

describe("httpConfig is setup correctly", () => {
  function setCustomerInfoResponse(httpResponse: HttpResponse) {
    server.use(
      http.get("http://localhost:8000/v1/subscribers/someAppUserId", () => {
        return httpResponse;
      }),
    );
  }

  test("additionalHeaders are included correctly", async () => {
    setCustomerInfoResponse(
      HttpResponse.json(customerInfoResponse, { status: 200 }),
    );

    let requestPerformed: Request | undefined;
    server.events.on("request:start", (req) => {
      requestPerformed = req.request;
    });
    backend = new Backend("test_api_key", {
      additionalHeaders: {
        "X-Custom-Header": "customValue",
        "X-Another-Header": "anotherValue",
      },
    });
    await backend.getCustomerInfo("someAppUserId");
    expect(requestPerformed).not.toBeNull();
    expect(requestPerformed?.headers.get("X-Custom-Header")).toEqual(
      "customValue",
    );
    expect(requestPerformed?.headers.get("X-Another-Header")).toEqual(
      "anotherValue",
    );
  });

  test("additionalHeaders don't override existing headers", async () => {
    setCustomerInfoResponse(
      HttpResponse.json(customerInfoResponse, { status: 200 }),
    );

    let requestPerformed: Request | undefined;
    server.events.on("request:start", (req) => {
      requestPerformed = req.request;
    });
    backend = new Backend("test_api_key", {
      additionalHeaders: {
        "X-Platform": "overridenValue",
      },
    });
    await backend.getCustomerInfo("someAppUserId");
    expect(requestPerformed).not.toBeNull();
    expect(requestPerformed?.headers.get("X-Platform")).toEqual("web");
  });
});

describe("getCustomerInfo request", () => {
  function setCustomerInfoResponse(httpResponse: HttpResponse) {
    server.use(
      http.get("http://localhost:8000/v1/subscribers/someAppUserId", () => {
        return httpResponse;
      }),
    );
  }

  test("can get customer info successfully", async () => {
    setCustomerInfoResponse(
      HttpResponse.json(customerInfoResponse, { status: 200 }),
    );
    const backendResponse = await backend.getCustomerInfo("someAppUserId");
    expect(backendResponse).toEqual(customerInfoResponse);
  });

  test("throws an error if the backend returns a server error", async () => {
    setCustomerInfoResponse(
      HttpResponse.json(null, { status: StatusCodes.INTERNAL_SERVER_ERROR }),
    );
    await expectPromiseToError(
      backend.getCustomerInfo("someAppUserId"),
      new PurchasesError(
        ErrorCode.UnknownBackendError,
        "Unknown backend error.",
        "Request: getCustomerInfo. Status code: 500. Body: null.",
      ),
    );
  });

  test("throws a known error if the backend returns a request error with correct body", async () => {
    setCustomerInfoResponse(
      HttpResponse.json(
        {
          code: BackendErrorCode.BackendInvalidAPIKey,
          message: "API key was wrong",
        },
        { status: StatusCodes.BAD_REQUEST },
      ),
    );
    await expectPromiseToError(
      backend.getCustomerInfo("someAppUserId"),
      new PurchasesError(
        ErrorCode.InvalidCredentialsError,
        "There was a credentials issue. Check the underlying error for more details.",
        "API key was wrong",
      ),
    );
  });

  test("throws unknown error if the backend returns a request error with unknown error code in body", async () => {
    setCustomerInfoResponse(
      HttpResponse.json(
        {
          code: 1234567890,
          message: "Invalid error message",
        },
        { status: StatusCodes.BAD_REQUEST },
      ),
    );
    await expectPromiseToError(
      backend.getCustomerInfo("someAppUserId"),
      new PurchasesError(
        ErrorCode.UnknownBackendError,
        "Unknown backend error.",
        'Request: getCustomerInfo. Status code: 400. Body: {"code":1234567890,"message":"Invalid error message"}.',
      ),
    );
  });

  test("throws unknown error if the backend returns a request error without error code in body", async () => {
    setCustomerInfoResponse(
      HttpResponse.json(null, { status: StatusCodes.BAD_REQUEST }),
    );
    await expectPromiseToError(
      backend.getCustomerInfo("someAppUserId"),
      new PurchasesError(
        ErrorCode.UnknownBackendError,
        "Unknown backend error.",
        "Request: getCustomerInfo. Status code: 400. Body: null.",
      ),
    );
  });

  test("throws network error if cannot reach server", async () => {
    setCustomerInfoResponse(HttpResponse.error());
    await expectPromiseToError(
      backend.getCustomerInfo("someAppUserId"),
      new PurchasesError(
        ErrorCode.NetworkError,
        "Error performing request. Please check your network connection and try again.",
        "Failed to fetch",
      ),
    );
  });
});

describe("getOfferings request", () => {
  function setOfferingsResponse(httpResponse: HttpResponse) {
    server.use(
      http.get(
        "http://localhost:8000/v1/subscribers/someAppUserId/offerings",
        () => {
          return httpResponse;
        },
      ),
    );
  }

  test("can get offerings successfully", async () => {
    const expectedResponse = {
      current_offering_id: "offering_1",
      offerings: offeringsArray,
    };
    setOfferingsResponse(HttpResponse.json(expectedResponse, { status: 200 }));
    expect(await backend.getOfferings("someAppUserId")).toEqual(
      expectedResponse,
    );
  });

  test("throws an error if the backend returns a server error", async () => {
    setOfferingsResponse(
      HttpResponse.json(null, { status: StatusCodes.INTERNAL_SERVER_ERROR }),
    );
    await expectPromiseToError(
      backend.getOfferings("someAppUserId"),
      new PurchasesError(
        ErrorCode.UnknownBackendError,
        "Unknown backend error.",
        "Request: getOfferings. Status code: 500. Body: null.",
      ),
    );
  });

  test("throws a known error if the backend returns a request error with correct body", async () => {
    setOfferingsResponse(
      HttpResponse.json(
        {
          code: BackendErrorCode.BackendInvalidAPIKey,
          message: "API key was wrong",
        },
        { status: StatusCodes.BAD_REQUEST },
      ),
    );
    await expectPromiseToError(
      backend.getOfferings("someAppUserId"),
      new PurchasesError(
        ErrorCode.InvalidCredentialsError,
        "There was a credentials issue. Check the underlying error for more details.",
        "API key was wrong",
      ),
    );
  });

  test("throws network error if cannot reach server", async () => {
    setOfferingsResponse(HttpResponse.error());
    await expectPromiseToError(
      backend.getOfferings("someAppUserId"),
      new PurchasesError(
        ErrorCode.NetworkError,
        "Error performing request. Please check your network connection and try again.",
        "Failed to fetch",
      ),
    );
  });
});

describe("getProducts request", () => {
  function setProductsResponse(httpResponse: HttpResponse, currency?: string) {
    const baseUrl =
      "http://localhost:8000/rcbilling/v1/subscribers/someAppUserId/products";
    server.use(
      http.get(baseUrl, ({ request }) => {
        const url = new URL(request.url);
        const productIds = url.searchParams.getAll("id");
        const urlCurrency = url.searchParams.get("currency");
        if (
          productIds.includes("monthly") &&
          productIds.includes("monthly_2") &&
          productIds.length === 2 &&
          (urlCurrency === null || urlCurrency === currency)
        ) {
          return httpResponse;
        }
        throw new Error("Invalid request");
      }),
    );
  }

  test("can get products successfully", async () => {
    setProductsResponse(HttpResponse.json(productsResponse, { status: 200 }));
    expect(
      await backend.getProducts("someAppUserId", ["monthly", "monthly_2"]),
    ).toEqual(productsResponse);
  });

  test("passes request with currency successfully", async () => {
    setProductsResponse(
      HttpResponse.json(productsResponse, { status: 200 }),
      "USD",
    );
    expect(
      await backend.getProducts(
        "someAppUserId",
        ["monthly", "monthly_2"],
        "USD",
      ),
    ).toEqual(productsResponse);
  });

  test("throws an error if the backend returns a server error", async () => {
    setProductsResponse(
      HttpResponse.json(null, { status: StatusCodes.INTERNAL_SERVER_ERROR }),
    );
    await expectPromiseToError(
      backend.getProducts("someAppUserId", ["monthly", "monthly_2"]),
      new PurchasesError(
        ErrorCode.UnknownBackendError,
        "Unknown backend error.",
        "Request: getProducts. Status code: 500. Body: null.",
      ),
    );
  });

  test("throws a known error if the backend returns a request error with correct body", async () => {
    setProductsResponse(
      HttpResponse.json(
        {
          code: BackendErrorCode.BackendInvalidAPIKey,
          message: "API key was wrong",
        },
        { status: StatusCodes.BAD_REQUEST },
      ),
    );
    await expectPromiseToError(
      backend.getProducts("someAppUserId", ["monthly", "monthly_2"]),
      new PurchasesError(
        ErrorCode.InvalidCredentialsError,
        "There was a credentials issue. Check the underlying error for more details.",
        "API key was wrong",
      ),
    );
  });

  test("throws network error if cannot reach server", async () => {
    setProductsResponse(HttpResponse.error());
    await expectPromiseToError(
      backend.getProducts("someAppUserId", ["monthly", "monthly_2"]),
      new PurchasesError(
        ErrorCode.NetworkError,
        "Error performing request. Please check your network connection and try again.",
        "Failed to fetch",
      ),
    );
  });
});

describe("purchase request", () => {
  const purchaseMethodAPIMock = vi.fn();
  function setPurchaseResponse(httpResponse: HttpResponse) {
    server.use(
      http.post("http://localhost:8000/rcbilling/v1/purchase", (req) => {
        purchaseMethodAPIMock(req);
        return httpResponse;
      }),
    );
  }

  afterEach(() => {
    purchaseMethodAPIMock.mockReset();
  });

  test("can post purchase successfully", async () => {
    const purchaseResponse: PurchaseResponse = {
      operation_session_id: "test-operation-session-id",
      next_action: "collect_payment_info",
      data: {
        client_secret: "seti_123",
      },
    };
    setPurchaseResponse(HttpResponse.json(purchaseResponse, { status: 200 }));

    const result = await backend.postPurchase(
      "someAppUserId",
      "monthly",
      "testemail@revenuecat.com",
      {
        offeringIdentifier: "offering_1",
        targetingContext: null,
        placementIdentifier: null,
      },
      { id: "base_option", priceId: "test_price_id" },
      "test-trace-id",
      "test-checkout-session-id",
    );

    expect(purchaseMethodAPIMock).toHaveBeenCalledTimes(1);
    const request = purchaseMethodAPIMock.mock.calls[0][0].request;
    expect(request.headers.get("Content-Type")).toBe("application/json");
    expect(request.headers.get("Authorization")).toBe("Bearer test_api_key");

    const requestBody = await request.json();
    expect(requestBody).toEqual({
      app_user_id: "someAppUserId",
      product_id: "monthly",
      email: "testemail@revenuecat.com",
      price_id: "test_price_id",
      presented_offering_identifier: "offering_1",
      supports_direct_payment: true,
      trace_id: "test-trace-id",
      checkout_session_id: "test-checkout-session-id",
    });

    expect(result).toEqual(purchaseResponse);
  });

  test("throws an error if the backend returns a server error", async () => {
    setPurchaseResponse(
      HttpResponse.json(null, { status: StatusCodes.INTERNAL_SERVER_ERROR }),
    );
    await expectPromiseToError(
      backend.postPurchase(
        "someAppUserId",
        "monthly",
        "testemail@revenuecat.com",
        {
          offeringIdentifier: "offering_1",
          targetingContext: null,
          placementIdentifier: null,
        },
        { id: "base_option", priceId: "test_price_id" },
        "test-trace-id",
        "test-checkout-session-id",
      ),
      new PurchasesError(
        ErrorCode.UnknownBackendError,
        "Unknown backend error.",
        "Request: purchase. Status code: 500. Body: null.",
      ),
    );
  });

  test("throws a known error if the backend returns a request error with correct body", async () => {
    setPurchaseResponse(
      HttpResponse.json(
        {
          code: BackendErrorCode.BackendInvalidAPIKey,
          message: "API key was wrong",
        },
        { status: StatusCodes.BAD_REQUEST },
      ),
    );
    await expectPromiseToError(
      backend.postPurchase(
        "someAppUserId",
        "monthly",
        "testemail@revenuecat.com",
        {
          offeringIdentifier: "offering_1",
          targetingContext: null,
          placementIdentifier: null,
        },
        { id: "base_option", priceId: "test_price_id" },
        "test-trace-id",
        "test-checkout-session-id",
      ),
      new PurchasesError(
        ErrorCode.InvalidCredentialsError,
        "There was a credentials issue. Check the underlying error for more details.",
        "API key was wrong",
      ),
    );
  });

  test("throws a PurchaseInvalidError if the backend returns with a offer not found error", async () => {
    setPurchaseResponse(
      HttpResponse.json(
        {
          code: BackendErrorCode.BackendOfferNotFound,
          message: "Offer not available",
        },
        { status: StatusCodes.NOT_FOUND },
      ),
    );
    await expectPromiseToError(
      backend.postPurchase(
        "someAppUserId",
        "monthly",
        "testemail@revenuecat.com",
        {
          offeringIdentifier: "offering_1",
          targetingContext: null,
          placementIdentifier: null,
        },
        { id: "base_option", priceId: "test_price_id" },
        "test-trace-id",
        "test-checkout-session-id",
      ),
      new PurchasesError(
        ErrorCode.PurchaseInvalidError,
        "One or more of the arguments provided are invalid.",
        "Offer not available",
      ),
    );
  });

  test("throws network error if cannot reach server", async () => {
    setPurchaseResponse(HttpResponse.error());
    await expectPromiseToError(
      backend.postPurchase(
        "someAppUserId",
        "monthly",
        "testemail@revenuecat.com",
        {
          offeringIdentifier: "offering_1",
          targetingContext: null,
          placementIdentifier: null,
        },
        { id: "base_option", priceId: "test_price_id" },
        "test-trace-id",
        "test-checkout-session-id",
      ),
      new PurchasesError(
        ErrorCode.NetworkError,
        "Error performing request. Please check your network connection and try again.",
        "Failed to fetch",
      ),
    );
  });
});
