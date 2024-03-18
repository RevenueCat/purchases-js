import { SetupServer, setupServer } from "msw/node";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
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
import { type SubscribeResponse } from "../../networking/responses/subscribe-response";

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
        "Unknown backend error. Request: getCustomerInfo. Status code: 500. Body: null.",
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
        'Unknown backend error. Request: getCustomerInfo. Status code: 400. Body: {"code":1234567890,"message":"Invalid error message"}.',
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
        "Unknown backend error. Request: getCustomerInfo. Status code: 400. Body: null.",
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
        "Unknown backend error. Request: getOfferings. Status code: 500. Body: null.",
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
});

describe("getProducts request", () => {
  function setProductsResponse(httpResponse: HttpResponse) {
    server.use(
      http.get(
        "http://localhost:8000/rcbilling/v1/subscribers/someAppUserId/products?id=monthly&id=monthly_2",
        () => {
          return httpResponse;
        },
      ),
    );
  }

  test("can get products successfully", async () => {
    setProductsResponse(HttpResponse.json(productsResponse, { status: 200 }));
    expect(
      await backend.getProducts("someAppUserId", ["monthly", "monthly_2"]),
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
        "Unknown backend error. Request: getProducts. Status code: 500. Body: null.",
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
});

describe("subscribe request", () => {
  function setSubscribeResponse(httpResponse: HttpResponse) {
    server.use(
      http.post("http://localhost:8000/rcbilling/v1/subscribe", () => {
        return httpResponse;
      }),
    );
  }

  test("can post subscribe successfully", async () => {
    const subscribeResponse: SubscribeResponse = {
      operation_session_id: "test-operation-session-id",
      next_action: "collect_payment_info",
      data: {
        client_secret: "seti_123",
      },
    };
    setSubscribeResponse(HttpResponse.json(subscribeResponse, { status: 200 }));
    expect(
      await backend.postSubscribe(
        "someAppUserId",
        "monthly",
        "testemail@revenuecat.com",
        "offering_1",
      ),
    ).toEqual(subscribeResponse);
  });

  test("throws an error if the backend returns a server error", async () => {
    setSubscribeResponse(
      HttpResponse.json(null, { status: StatusCodes.INTERNAL_SERVER_ERROR }),
    );
    await expectPromiseToError(
      backend.postSubscribe(
        "someAppUserId",
        "monthly",
        "testemail@revenuecat.com",
        "offering_1",
      ),
      new PurchasesError(
        ErrorCode.UnknownBackendError,
        "Unknown backend error. Request: subscribe. Status code: 500. Body: null.",
      ),
    );
  });

  test("throws a known error if the backend returns a request error with correct body", async () => {
    setSubscribeResponse(
      HttpResponse.json(
        {
          code: BackendErrorCode.BackendInvalidAPIKey,
          message: "API key was wrong",
        },
        { status: StatusCodes.BAD_REQUEST },
      ),
    );
    await expectPromiseToError(
      backend.postSubscribe(
        "someAppUserId",
        "monthly",
        "testemail@revenuecat.com",
        "offering_1",
      ),
      new PurchasesError(
        ErrorCode.InvalidCredentialsError,
        "There was a credentials issue. Check the underlying error for more details.",
        "API key was wrong",
      ),
    );
  });
});
