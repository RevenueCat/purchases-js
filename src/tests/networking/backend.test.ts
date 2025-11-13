import { type SetupServer, setupServer } from "msw/node";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { http, HttpResponse } from "msw";
import {
  checkoutStartResponse,
  checkoutCompleteResponse,
  customerInfoResponse,
  offeringsArray,
  productsResponse,
  getVirtualCurrenciesResponseWith3Currencies,
  getVirtualCurrenciesResponseWithNoCurrencies,
  identifyResponse,
} from "../test-responses";
import { Backend } from "../../networking/backend";
import { StatusCodes } from "http-status-codes";
import {
  BackendErrorCode,
  ErrorCode,
  PurchasesError,
} from "../../entities/errors";
import { expectPromiseToError } from "../test-helpers";
import { VERSION } from "../../helpers/constants";
import { Purchases } from "../../main";

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

  test("expected headers are sent", async () => {
    setCustomerInfoResponse(
      HttpResponse.json(customerInfoResponse, { status: 200 }),
    );

    let requestPerformed: Request | undefined;
    server.events.on("request:start", (req) => {
      requestPerformed = req.request;
    });
    backend = new Backend("test_api_key");
    await backend.getCustomerInfo("someAppUserId");
    const headers = requestPerformed?.headers;
    expect(headers).not.toBeNull();
    if (!headers) return;
    expect(headers.get("X-Platform")).toEqual("web");
    expect(headers.get("X-Version")).toEqual(VERSION);
    expect(headers.get("X-Platform-Flavor")).toBeNull();
    expect(headers.get("X-Platform-Flavor-Version")).toBeNull();
    expect(headers.get("X-Is-Sandbox")).toEqual("false");
  });

  test("expected platformInfo headers are sent", async () => {
    setCustomerInfoResponse(
      HttpResponse.json(customerInfoResponse, { status: 200 }),
    );

    Purchases.setPlatformInfo({
      flavor: "flutter",
      version: "1.2.3",
    });

    let requestPerformed: Request | undefined;
    server.events.on("request:start", (req) => {
      requestPerformed = req.request;
    });
    backend = new Backend("test_api_key");
    await backend.getCustomerInfo("someAppUserId");
    const headers = requestPerformed?.headers;
    expect(headers).not.toBeNull();
    if (!headers) return;
    expect(headers.get("X-Platform-Flavor")).toEqual("flutter");
    expect(headers.get("X-Platform-Flavor-Version")).toEqual("1.2.3");
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

describe("identify request", () => {
  function setIdentifyResponse(httpResponse: HttpResponse) {
    server.use(
      http.post("http://localhost:8000/v1/subscribers/identify", () => {
        return httpResponse;
      }),
    );
  }

  test("can get customer info successfully", async () => {
    setIdentifyResponse(HttpResponse.json(identifyResponse, { status: 200 }));
    const backendResponse = await backend.identify(
      "oldAppUserId",
      "newAppUserId",
    );
    expect(backendResponse).toEqual(identifyResponse);
  });

  test("throws an error if the backend returns a server error", async () => {
    setIdentifyResponse(
      HttpResponse.json(null, { status: StatusCodes.INTERNAL_SERVER_ERROR }),
    );
    await expectPromiseToError(
      backend.identify("oldAppUserId", "newAppUserId"),
      new PurchasesError(
        ErrorCode.UnknownBackendError,
        "Unknown backend error.",
        "Request: identify. Status code: 500. Body: null.",
      ),
    );
  });

  test("throws a known error if the backend returns a request error with correct body", async () => {
    setIdentifyResponse(
      HttpResponse.json(
        {
          code: BackendErrorCode.BackendInvalidAPIKey,
          message: "API key was wrong",
        },
        { status: StatusCodes.BAD_REQUEST },
      ),
    );
    await expectPromiseToError(
      backend.identify("oldAppUserId", "newAppUserId"),
      new PurchasesError(
        ErrorCode.InvalidCredentialsError,
        "There was a credentials issue. Check the underlying error for more details.",
        "API key was wrong",
      ),
    );
  });

  test("throws unknown error if the backend returns a request error with unknown error code in body", async () => {
    setIdentifyResponse(
      HttpResponse.json(
        {
          code: 1234567890,
          message: "Invalid error message",
        },
        { status: StatusCodes.BAD_REQUEST },
      ),
    );
    await expectPromiseToError(
      backend.identify("oldAppUserId", "newAppUserId"),
      new PurchasesError(
        ErrorCode.UnknownBackendError,
        "Unknown backend error.",
        'Request: identify. Status code: 400. Body: {"code":1234567890,"message":"Invalid error message"}.',
      ),
    );
  });

  test("throws unknown error if the backend returns a request error without error code in body", async () => {
    setIdentifyResponse(
      HttpResponse.json(null, { status: StatusCodes.BAD_REQUEST }),
    );
    await expectPromiseToError(
      backend.identify("oldAppUserId", "newAppUserId"),
      new PurchasesError(
        ErrorCode.UnknownBackendError,
        "Unknown backend error.",
        "Request: identify. Status code: 400. Body: null.",
      ),
    );
  });

  test("throws network error if cannot reach server", async () => {
    setIdentifyResponse(HttpResponse.error());
    await expectPromiseToError(
      backend.identify("oldAppUserId", "newAppUserId"),
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

describe("postCheckoutStart request", () => {
  const purchaseMethodAPIMock = vi.fn();

  function setCheckoutStartResponse(httpResponse: HttpResponse) {
    server.use(
      http.post("http://localhost:8000/rcbilling/v1/checkout/start", (req) => {
        purchaseMethodAPIMock(req);
        return httpResponse;
      }),
    );
  }

  afterEach(() => {
    purchaseMethodAPIMock.mockReset();
  });

  test("can post checkout start successfully", async () => {
    setCheckoutStartResponse(
      HttpResponse.json(checkoutStartResponse, { status: 200 }),
    );

    const result = await backend.postCheckoutStart(
      "someAppUserId",
      "monthly",
      {
        offeringIdentifier: "offering_1",
        targetingContext: null,
        placementIdentifier: null,
        workflowIdentifier: null,
      },
      { id: "base_option", priceId: "test_price_id" },
      "test-trace-id",
    );

    expect(purchaseMethodAPIMock).toHaveBeenCalledTimes(1);
    const request = purchaseMethodAPIMock.mock.calls[0][0].request;
    expect(request.headers.get("Content-Type")).toBe("application/json");
    expect(request.headers.get("Authorization")).toBe("Bearer test_api_key");

    const requestBody = await request.json();
    expect(requestBody).toEqual({
      app_user_id: "someAppUserId",
      product_id: "monthly",
      price_id: "test_price_id",
      presented_offering_identifier: "offering_1",
      trace_id: "test-trace-id",
    });

    expect(result).toEqual(checkoutStartResponse);
  });

  test("accepts an email if provided", async () => {
    setCheckoutStartResponse(
      HttpResponse.json(checkoutStartResponse, { status: 200 }),
    );

    const result = await backend.postCheckoutStart(
      "someAppUserId",
      "monthly",
      {
        offeringIdentifier: "offering_1",
        targetingContext: null,
        placementIdentifier: null,
        workflowIdentifier: null,
      },
      { id: "base_option", priceId: "test_price_id" },
      "test-trace-id",
      "testemail@revenuecat.com",
      { utm_campaign: "test-campaign" },
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
      metadata: { utm_campaign: "test-campaign" },
      trace_id: "test-trace-id",
    });

    expect(result).toEqual(checkoutStartResponse);
  });

  test("handles workflow identifier correctly", async () => {
    setCheckoutStartResponse(
      HttpResponse.json(checkoutStartResponse, { status: 200 }),
    );

    await backend.postCheckoutStart(
      "someAppUserId",
      "monthly",
      {
        offeringIdentifier: "offering_1",
        targetingContext: null,
        placementIdentifier: null,
        workflowIdentifier: "workflow_456",
      },
      { id: "base_option", priceId: "test_price_id" },
      "test-trace-id",
    );

    expect(purchaseMethodAPIMock).toHaveBeenCalledTimes(1);
    const request = purchaseMethodAPIMock.mock.calls[0][0].request;
    const requestBody = await request.json();
    expect(requestBody.presented_workflow_id).toBe("workflow_456");
  });

  test("throws an error if the backend returns a server error", async () => {
    setCheckoutStartResponse(
      HttpResponse.json(null, { status: StatusCodes.INTERNAL_SERVER_ERROR }),
    );
    await expectPromiseToError(
      backend.postCheckoutStart(
        "someAppUserId",
        "monthly",
        {
          offeringIdentifier: "offering_1",
          targetingContext: null,
          placementIdentifier: null,
          workflowIdentifier: null,
        },
        { id: "base_option", priceId: "test_price_id" },
        "test-trace-id",
        undefined,
        { utm_campaign: "test-campaign" },
      ),
      new PurchasesError(
        ErrorCode.UnknownBackendError,
        "Unknown backend error.",
        "Request: postCheckoutStart. Status code: 500. Body: null.",
      ),
    );
  });

  test("throws a known error if the backend returns a request error with correct body", async () => {
    setCheckoutStartResponse(
      HttpResponse.json(
        {
          code: BackendErrorCode.BackendInvalidAPIKey,
          message: "API key was wrong",
        },
        { status: StatusCodes.BAD_REQUEST },
      ),
    );
    await expectPromiseToError(
      backend.postCheckoutStart(
        "someAppUserId",
        "monthly",
        {
          offeringIdentifier: "offering_1",
          targetingContext: null,
          placementIdentifier: null,
          workflowIdentifier: null,
        },
        { id: "base_option", priceId: "test_price_id" },
        "test-trace-id",
        "testemail@revenuecat.com",
        { utm_campaign: "test-campaign" },
      ),
      new PurchasesError(
        ErrorCode.InvalidCredentialsError,
        "There was a credentials issue. Check the underlying error for more details.",
        "API key was wrong",
      ),
    );
  });

  test("throws a PurchaseInvalidError if the backend returns with a offer not found error", async () => {
    setCheckoutStartResponse(
      HttpResponse.json(
        {
          code: BackendErrorCode.BackendOfferNotFound,
          message: "Offer not available",
        },
        { status: StatusCodes.NOT_FOUND },
      ),
    );
    await expectPromiseToError(
      backend.postCheckoutStart(
        "someAppUserId",
        "monthly",
        {
          offeringIdentifier: "offering_1",
          targetingContext: null,
          placementIdentifier: null,
          workflowIdentifier: null,
        },
        { id: "base_option", priceId: "test_price_id" },
        "test-trace-id",
        "testemail@revenuecat.com",
        { utm_campaign: "test-campaign" },
      ),
      new PurchasesError(
        ErrorCode.PurchaseInvalidError,
        "One or more of the arguments provided are invalid.",
        "Offer not available",
      ),
    );
  });

  test("throws network error if cannot reach server", async () => {
    setCheckoutStartResponse(HttpResponse.error());
    await expectPromiseToError(
      backend.postCheckoutStart(
        "someAppUserId",
        "monthly",
        {
          offeringIdentifier: "offering_1",
          targetingContext: null,
          placementIdentifier: null,
          workflowIdentifier: null,
        },
        { id: "base_option", priceId: "test_price_id" },
        "test-trace-id",
        undefined,
        { utm_campaign: "test-campaign" },
      ),
      new PurchasesError(
        ErrorCode.NetworkError,
        "Error performing request. Please check your network connection and try again.",
        "Failed to fetch",
      ),
    );
  });
});

describe("postCheckoutComplete request", () => {
  const purchaseMethodAPIMock = vi.fn();

  function setCheckoutCompleteResponse(httpResponse: HttpResponse) {
    server.use(
      http.post(
        "http://localhost:8000/rcbilling/v1/checkout/someOperationSessionId/complete",
        (req) => {
          purchaseMethodAPIMock(req);
          return httpResponse;
        },
      ),
    );
  }

  afterEach(() => {
    purchaseMethodAPIMock.mockReset();
  });

  test("can post checkout complete successfully", async () => {
    setCheckoutCompleteResponse(
      HttpResponse.json(checkoutCompleteResponse, { status: 200 }),
    );

    const result = await backend.postCheckoutComplete("someOperationSessionId");

    expect(purchaseMethodAPIMock).toHaveBeenCalledTimes(1);
    const request = purchaseMethodAPIMock.mock.calls[0][0].request;
    expect(request.headers.get("Content-Type")).toBe("application/json");
    expect(request.headers.get("Authorization")).toBe("Bearer test_api_key");

    const requestBody = await request.json();
    expect(requestBody).toEqual({});

    expect(result).toEqual(checkoutCompleteResponse);
  });

  test("accepts an email if provided", async () => {
    setCheckoutCompleteResponse(
      HttpResponse.json(checkoutCompleteResponse, { status: 200 }),
    );

    const result = await backend.postCheckoutComplete(
      "someOperationSessionId",
      "testemail@revenuecat.com",
    );

    expect(purchaseMethodAPIMock).toHaveBeenCalledTimes(1);
    const request = purchaseMethodAPIMock.mock.calls[0][0].request;
    expect(request.headers.get("Content-Type")).toBe("application/json");
    expect(request.headers.get("Authorization")).toBe("Bearer test_api_key");

    const requestBody = await request.json();
    expect(requestBody).toEqual({
      email: "testemail@revenuecat.com",
    });

    expect(result).toEqual(checkoutCompleteResponse);
  });

  test("throws an error if the backend returns a server error", async () => {
    setCheckoutCompleteResponse(
      HttpResponse.json(null, { status: StatusCodes.INTERNAL_SERVER_ERROR }),
    );
    await expectPromiseToError(
      backend.postCheckoutComplete("someOperationSessionId"),
      new PurchasesError(
        ErrorCode.UnknownBackendError,
        "Unknown backend error.",
        "Request: postCheckoutComplete. Status code: 500. Body: null.",
      ),
    );
  });

  test("throws a known error if the backend returns a request error with correct body", async () => {
    setCheckoutCompleteResponse(
      HttpResponse.json(
        {
          code: BackendErrorCode.BackendInvalidAPIKey,
          message: "API key was wrong",
        },
        { status: StatusCodes.BAD_REQUEST },
      ),
    );
    await expectPromiseToError(
      backend.postCheckoutComplete("someOperationSessionId"),
      new PurchasesError(
        ErrorCode.InvalidCredentialsError,
        "There was a credentials issue. Check the underlying error for more details.",
        "API key was wrong",
      ),
    );
  });

  test("throws a PurchaseInvalidError if the backend returns with a invalid operation session error", async () => {
    setCheckoutCompleteResponse(
      HttpResponse.json(
        {
          code: BackendErrorCode.BackendInvalidOperationSession,
          message: "The operation session is invalid.",
        },
        { status: StatusCodes.BAD_REQUEST },
      ),
    );
    await expectPromiseToError(
      backend.postCheckoutComplete("someOperationSessionId"),
      new PurchasesError(
        ErrorCode.PurchaseInvalidError,
        "One or more of the arguments provided are invalid.",
        "The operation session is invalid.",
      ),
    );
  });

  test("throws a PurchaseInvalidError if the backend returns with a purchase cannot be completed error", async () => {
    setCheckoutCompleteResponse(
      HttpResponse.json(
        {
          code: BackendErrorCode.BackendPurchaseCannotBeCompleted,
          message: "The purchase cannot be completed.",
        },
        { status: StatusCodes.BAD_REQUEST },
      ),
    );
    await expectPromiseToError(
      backend.postCheckoutComplete("someOperationSessionId"),
      new PurchasesError(
        ErrorCode.PurchaseInvalidError,
        "One or more of the arguments provided are invalid.",
        "The purchase cannot be completed.",
      ),
    );
  });

  test("throws a InvalidEmailError if the backend returns with a email is required error", async () => {
    setCheckoutCompleteResponse(
      HttpResponse.json(
        {
          code: BackendErrorCode.BackendEmailIsRequired,
          message: "Email is required to complete the purchase.",
        },
        { status: StatusCodes.BAD_REQUEST },
      ),
    );
    await expectPromiseToError(
      backend.postCheckoutComplete("someOperationSessionId"),
      new PurchasesError(
        ErrorCode.InvalidEmailError,
        "Email is not valid. Please provide a valid email address.",
        "Email is required to complete the purchase.",
      ),
    );
  });

  test("throws network error if cannot reach server", async () => {
    setCheckoutCompleteResponse(HttpResponse.error());
    await expectPromiseToError(
      backend.postCheckoutComplete("someOperationSessionId"),
      new PurchasesError(
        ErrorCode.NetworkError,
        "Error performing request. Please check your network connection and try again.",
        "Failed to fetch",
      ),
    );
  });
});

describe("setAttributes request", () => {
  function setAttributesResponse(httpResponse: HttpResponse) {
    server.use(
      http.post(
        "http://localhost:8000/v1/subscribers/someAppUserId/attributes",
        () => {
          return httpResponse;
        },
      ),
    );
  }

  test("can set attributes successfully", async () => {
    setAttributesResponse(HttpResponse.json({}, { status: 200 }));
    await backend.setAttributes("someAppUserId", {
      age: "24",
      custom_group_id: "abc123",
    });
  });

  test("throws an error if the backend returns a server error", async () => {
    setAttributesResponse(
      HttpResponse.json({}, { status: StatusCodes.INTERNAL_SERVER_ERROR }),
    );
    await expectPromiseToError(
      backend.setAttributes("someAppUserId", { age: "24" }),
      new PurchasesError(
        ErrorCode.UnknownBackendError,
        "Unknown backend error.",
        "Request: setAttributes. Status code: 500. Body: {}.",
      ),
    );
  });

  test("throws a known error if the backend returns a request error with correct body", async () => {
    setAttributesResponse(
      HttpResponse.json(
        {
          code: BackendErrorCode.BackendInvalidAPIKey,
          message: "API key was wrong",
        },
        { status: StatusCodes.BAD_REQUEST },
      ),
    );
    await expectPromiseToError(
      backend.setAttributes("someAppUserId", { age: "24" }),
      new PurchasesError(
        ErrorCode.InvalidCredentialsError,
        "There was a credentials issue. Check the underlying error for more details.",
        "API key was wrong",
      ),
    );
  });

  test("throws a known error if the attributes are invalid", async () => {
    setAttributesResponse(
      HttpResponse.json(
        {
          code: BackendErrorCode.BackendInvalidSubscriberAttributes,
          message: "Some subscriber attributes keys were unable to be saved.",
          attribute_errors: [{ key_name: "age", message: "Invalid attribute" }],
        },
        { status: StatusCodes.BAD_REQUEST },
      ),
    );

    await expectPromiseToError(
      backend.setAttributes("someAppUserId", { age: "24" }),
      new PurchasesError(
        ErrorCode.InvalidSubscriberAttributesError,
        "One or more of the attributes sent could not be saved.",
        "Some subscriber attributes keys were unable to be saved.",
      ),
    );
  });

  test("throws network error if cannot reach server", async () => {
    setAttributesResponse(HttpResponse.error());
    await expectPromiseToError(
      backend.setAttributes("someAppUserId", { age: "24" }),
      new PurchasesError(
        ErrorCode.NetworkError,
        "Error performing request. Please check your network connection and try again.",
        "Failed to fetch",
      ),
    );
  });
});

describe("postReceipt request", () => {
  const postReceiptAPIMock = vi.fn();

  function setPostReceiptResponse(httpResponse: HttpResponse) {
    server.use(
      http.post("http://localhost:8000/v1/receipts", (req) => {
        postReceiptAPIMock(req);
        return httpResponse;
      }),
    );
  }

  afterEach(() => {
    postReceiptAPIMock.mockReset();
  });

  test("can post receipt successfully", async () => {
    setPostReceiptResponse(
      HttpResponse.json(customerInfoResponse, { status: 200 }),
    );

    const result = await backend.postReceipt(
      "someAppUserId",
      "monthly",
      "EUR",
      "test_fetch_token",
      {
        offeringIdentifier: "offering_1",
        targetingContext: null,
        placementIdentifier: null,
        workflowIdentifier: null,
      },
      "restore",
    );

    expect(postReceiptAPIMock).toHaveBeenCalledTimes(1);
    const request = postReceiptAPIMock.mock.calls[0][0].request;
    expect(request.headers.get("Content-Type")).toBe("application/json");
    expect(request.headers.get("Authorization")).toBe("Bearer test_api_key");

    const requestBody = await request.json();
    expect(requestBody).toEqual({
      fetch_token: "test_fetch_token",
      product_id: "monthly",
      currency: "EUR",
      app_user_id: "someAppUserId",
      presented_offering_identifier: "offering_1",
      presented_placement_identifier: null,
      presented_workflow_id: null,
      applied_targeting_rule: null,
      initiation_source: "restore",
    });

    expect(result).toEqual(customerInfoResponse);
  });

  test("includes targeting context when provided", async () => {
    setPostReceiptResponse(
      HttpResponse.json(customerInfoResponse, { status: 200 }),
    );

    const result = await backend.postReceipt(
      "someAppUserId",
      "monthly",
      "EUR",
      "test_fetch_token",
      {
        offeringIdentifier: "offering_1",
        targetingContext: {
          ruleId: "rule_123",
          revision: 5,
        },
        placementIdentifier: "placement_1",
        workflowIdentifier: null,
      },
      "purchase",
    );

    expect(postReceiptAPIMock).toHaveBeenCalledTimes(1);
    const request = postReceiptAPIMock.mock.calls[0][0].request;
    const requestBody = await request.json();
    expect(requestBody).toEqual({
      fetch_token: "test_fetch_token",
      product_id: "monthly",
      currency: "EUR",
      app_user_id: "someAppUserId",
      presented_offering_identifier: "offering_1",
      presented_placement_identifier: "placement_1",
      presented_workflow_id: null,
      applied_targeting_rule: {
        rule_id: "rule_123",
        revision: 5,
      },
      initiation_source: "purchase",
    });

    expect(result).toEqual(customerInfoResponse);
  });

  test("handles placement identifier correctly", async () => {
    setPostReceiptResponse(
      HttpResponse.json(customerInfoResponse, { status: 200 }),
    );

    await backend.postReceipt(
      "someAppUserId",
      "monthly",
      "EUR",
      "test_fetch_token",
      {
        offeringIdentifier: "offering_1",
        targetingContext: null,
        placementIdentifier: "home_screen",
        workflowIdentifier: null,
      },
      "purchase",
    );

    const request = postReceiptAPIMock.mock.calls[0][0].request;
    const requestBody = await request.json();
    expect(requestBody.presented_placement_identifier).toBe("home_screen");
  });

  test("handles workflow identifier correctly", async () => {
    setPostReceiptResponse(
      HttpResponse.json(customerInfoResponse, { status: 200 }),
    );

    await backend.postReceipt(
      "someAppUserId",
      "monthly",
      "EUR",
      "test_fetch_token",
      {
        offeringIdentifier: "offering_1",
        targetingContext: null,
        placementIdentifier: null,
        workflowIdentifier: "workflow_123",
      },
      "purchase",
    );

    const request = postReceiptAPIMock.mock.calls[0][0].request;
    const requestBody = await request.json();
    expect(requestBody.presented_workflow_id).toBe("workflow_123");
  });

  test("throws an error if the backend returns a server error", async () => {
    setPostReceiptResponse(
      HttpResponse.json(null, { status: StatusCodes.INTERNAL_SERVER_ERROR }),
    );
    await expectPromiseToError(
      backend.postReceipt(
        "someAppUserId",
        "monthly",
        "EUR",
        "test_fetch_token",
        {
          offeringIdentifier: "offering_1",
          targetingContext: null,
          placementIdentifier: null,
          workflowIdentifier: null,
        },
        "restore",
      ),
      new PurchasesError(
        ErrorCode.UnknownBackendError,
        "Unknown backend error.",
        "Request: postReceipt. Status code: 500. Body: null.",
      ),
    );
  });

  test("throws a known error if the backend returns a request error with correct body", async () => {
    setPostReceiptResponse(
      HttpResponse.json(
        {
          code: BackendErrorCode.BackendInvalidAPIKey,
          message: "API key was wrong",
        },
        { status: StatusCodes.BAD_REQUEST },
      ),
    );
    await expectPromiseToError(
      backend.postReceipt(
        "someAppUserId",
        "monthly",
        "EUR",
        "test_fetch_token",
        {
          offeringIdentifier: "offering_1",
          targetingContext: null,
          placementIdentifier: null,
          workflowIdentifier: null,
        },
        "restore",
      ),
      new PurchasesError(
        ErrorCode.InvalidCredentialsError,
        "There was a credentials issue. Check the underlying error for more details.",
        "API key was wrong",
      ),
    );
  });

  test("throws network error if cannot reach server", async () => {
    setPostReceiptResponse(HttpResponse.error());
    await expectPromiseToError(
      backend.postReceipt(
        "someAppUserId",
        "monthly",
        "EUR",
        "test_fetch_token",
        {
          offeringIdentifier: "offering_1",
          targetingContext: null,
          placementIdentifier: null,
          workflowIdentifier: null,
        },
        "restore",
      ),
      new PurchasesError(
        ErrorCode.NetworkError,
        "Error performing request. Please check your network connection and try again.",
        "Failed to fetch",
      ),
    );
  });

  test("handles invalid receipt error", async () => {
    setPostReceiptResponse(
      HttpResponse.json(
        {
          code: BackendErrorCode.BackendInvalidReceiptToken,
          message: "Receipt token is invalid",
        },
        { status: StatusCodes.BAD_REQUEST },
      ),
    );
    await expectPromiseToError(
      backend.postReceipt(
        "someAppUserId",
        "monthly",
        "EUR",
        "invalid_token",
        {
          offeringIdentifier: "offering_1",
          targetingContext: null,
          placementIdentifier: null,
          workflowIdentifier: null,
        },
        "restore",
      ),
      new PurchasesError(
        ErrorCode.InvalidReceiptError,
        "The receipt is not valid.",
        "Receipt token is invalid",
      ),
    );
  });
});

describe("getVirtualCurrencies request", () => {
  function setVirtualCurrenciesResponse(httpResponse: HttpResponse) {
    server.use(
      http.get(
        "http://localhost:8000/v1/subscribers/someAppUserId/virtual_currencies",
        () => {
          return httpResponse;
        },
      ),
    );
  }

  test("can get virtual currencies successfully when currencies are present", async () => {
    setVirtualCurrenciesResponse(
      HttpResponse.json(getVirtualCurrenciesResponseWith3Currencies, {
        status: 200,
      }),
    );
    const backendResponse = await backend.getVirtualCurrencies("someAppUserId");
    expect(backendResponse).toEqual(
      getVirtualCurrenciesResponseWith3Currencies,
    );
  });

  test("can get virtual currencies successfully when no currencies are present", async () => {
    setVirtualCurrenciesResponse(
      HttpResponse.json(getVirtualCurrenciesResponseWithNoCurrencies, {
        status: 200,
      }),
    );
    const backendResponse = await backend.getVirtualCurrencies("someAppUserId");
    expect(backendResponse).toEqual(
      getVirtualCurrenciesResponseWithNoCurrencies,
    );
  });

  test("throws an error if the backend returns a server error", async () => {
    setVirtualCurrenciesResponse(
      HttpResponse.json(null, { status: StatusCodes.INTERNAL_SERVER_ERROR }),
    );
    await expectPromiseToError(
      backend.getVirtualCurrencies("someAppUserId"),
      new PurchasesError(
        ErrorCode.UnknownBackendError,
        "Unknown backend error.",
        "Request: getVirtualCurrencies. Status code: 500. Body: null.",
      ),
    );
  });

  test("throws a known error if the backend returns a request error with correct body", async () => {
    setVirtualCurrenciesResponse(
      HttpResponse.json(
        {
          code: BackendErrorCode.BackendInvalidAPIKey,
          message: "API key was wrong",
        },
        { status: StatusCodes.BAD_REQUEST },
      ),
    );
    await expectPromiseToError(
      backend.getVirtualCurrencies("someAppUserId"),
      new PurchasesError(
        ErrorCode.InvalidCredentialsError,
        "There was a credentials issue. Check the underlying error for more details.",
        "API key was wrong",
      ),
    );
  });

  test("throws unknown error if the backend returns a request error with unknown error code in body", async () => {
    setVirtualCurrenciesResponse(
      HttpResponse.json(
        {
          code: 1234567890,
          message: "Invalid error message",
        },
        { status: StatusCodes.BAD_REQUEST },
      ),
    );
    await expectPromiseToError(
      backend.getVirtualCurrencies("someAppUserId"),
      new PurchasesError(
        ErrorCode.UnknownBackendError,
        "Unknown backend error.",
        'Request: getVirtualCurrencies. Status code: 400. Body: {"code":1234567890,"message":"Invalid error message"}.',
      ),
    );
  });

  test("throws unknown error if the backend returns a request error without error code in body", async () => {
    setVirtualCurrenciesResponse(
      HttpResponse.json(null, { status: StatusCodes.BAD_REQUEST }),
    );
    await expectPromiseToError(
      backend.getVirtualCurrencies("someAppUserId"),
      new PurchasesError(
        ErrorCode.UnknownBackendError,
        "Unknown backend error.",
        "Request: getVirtualCurrencies. Status code: 400. Body: null.",
      ),
    );
  });

  test("throws network error if cannot reach server", async () => {
    setVirtualCurrenciesResponse(HttpResponse.error());
    await expectPromiseToError(
      backend.getVirtualCurrencies("someAppUserId"),
      new PurchasesError(
        ErrorCode.NetworkError,
        "Error performing request. Please check your network connection and try again.",
        "Failed to fetch",
      ),
    );
  });
});
