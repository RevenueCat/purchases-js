import { afterEach, beforeEach, describe, test } from "vitest";
import { PurchaseOperationHelper } from "../../helpers/purchase-operation-helper";
import { Backend } from "../../networking/backend";
import { setupServer, SetupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { StatusCodes } from "http-status-codes";
import { expectPromiseToError } from "../test-helpers";
import { ErrorCode, PurchasesError } from "../../entities/errors";
import { SubscribeResponse } from "../../networking/responses/subscribe-response";
import {
  OperationErrorCodes,
  OperationResponse,
  OperationSessionStatus,
} from "../../networking/responses/operation-response";

describe("PurchaseOperationHelper", () => {
  let server: SetupServer;
  let backend: Backend;
  let purchaseOperationHelper: PurchaseOperationHelper;

  const operationSessionId = "test-operation-session-id";
  const successSubscribeBody: SubscribeResponse = {
    operation_session_id: operationSessionId,
    next_action: "collect_payment_info",
    data: {
      client_secret: "seti_123",
    },
  };

  beforeEach(() => {
    server = setupServer();
    server.listen();
    backend = new Backend("test_api_key");
    purchaseOperationHelper = new PurchaseOperationHelper(backend);
  });

  afterEach(() => {
    server.close();
  });

  function setSubscribeResponse(httpResponse: HttpResponse) {
    server.use(
      http.post("http://localhost:8000/rcbilling/v1/subscribe", () => {
        return httpResponse;
      }),
    );
  }

  function setGetOperationResponse(httpResponse: HttpResponse) {
    server.use(
      http.get(
        `http://localhost:8000/rcbilling/v1/checkout/${operationSessionId}`,
        () => {
          return httpResponse;
        },
      ),
    );
  }

  test("startPurchase fails if /subscribe fails", async () => {
    setSubscribeResponse(
      HttpResponse.json(null, { status: StatusCodes.INTERNAL_SERVER_ERROR }),
    );
    await expectPromiseToError(
      purchaseOperationHelper.startPurchase(
        "test-app-user-id",
        "test-product-id",
        "test-email",
      ),
      new PurchasesError(
        ErrorCode.UnknownBackendError,
        "Unknown backend error. Request: subscribe. Status code: 500. Body: null.",
      ),
    );
  });

  test("pollCurrentPurchaseForCompletion fails if startPurchase not called before", async () => {
    await expectPromiseToError(
      purchaseOperationHelper.pollCurrentPurchaseForCompletion(),
      new PurchasesError(
        ErrorCode.PurchaseInvalidError,
        "Purchase not started before waiting for completion.",
      ),
    );
  });

  test("pollCurrentPurchaseForCompletion fails if poll request fails", async () => {
    setSubscribeResponse(
      HttpResponse.json(successSubscribeBody, {
        status: StatusCodes.OK,
      }),
    );
    setGetOperationResponse(
      HttpResponse.json(null, { status: StatusCodes.INTERNAL_SERVER_ERROR }),
    );

    await purchaseOperationHelper.startPurchase(
      "test-app-user-id",
      "test-product-id",
      "test-email",
    );
    await expectPromiseToError(
      purchaseOperationHelper.pollCurrentPurchaseForCompletion(),
      new PurchasesError(
        ErrorCode.UnknownBackendError,
        "Unknown backend error. Request: getOperation. Status code: 500. Body: null.",
      ),
    );
  });

  test("pollCurrentPurchaseForCompletion success if poll returns success", async () => {
    setSubscribeResponse(
      HttpResponse.json(successSubscribeBody, {
        status: StatusCodes.OK,
      }),
    );
    const getOperationResponse: OperationResponse = {
      operation: {
        status: OperationSessionStatus.Succeeded,
        isExpired: false,
        error: null,
      },
    };
    setGetOperationResponse(
      HttpResponse.json(getOperationResponse, { status: StatusCodes.OK }),
    );

    await purchaseOperationHelper.startPurchase(
      "test-app-user-id",
      "test-product-id",
      "test-email",
    );
    await purchaseOperationHelper.pollCurrentPurchaseForCompletion();
  });

  // TODO: Fix test that fails due to using same response multiple times
  // test("pollCurrentPurchaseForCompletion fails if poll returns in progress more times than retries", async () => {
  //   setSubscribeResponse(
  //     HttpResponse.json(successSubscribeBody, {
  //       status: StatusCodes.OK,
  //     }),
  //   );
  //   const getOperationResponse: OperationResponse = {
  //     operation: {
  //       status: OperationSessionStatus.InProgress,
  //       isExpired: false,
  //       error: null,
  //     },
  //   };
  //   setGetOperationResponse(
  //     HttpResponse.json(getOperationResponse, { status: StatusCodes.OK }),
  //   );
  //
  //   await purchaseOperationHelper.startPurchase(
  //     "test-app-user-id",
  //     "test-product-id",
  //     "test-email",
  //   );
  //   await expectPromiseToError(
  //     purchaseOperationHelper.pollCurrentPurchaseForCompletion(),
  //     new PurchasesError(
  //       ErrorCode.UnknownError,
  //       "Purchase status was not finished in given timeframe",
  //     ),
  //   );
  // });

  test("pollCurrentPurchaseForCompletion error if poll returns error", async () => {
    setSubscribeResponse(
      HttpResponse.json(successSubscribeBody, {
        status: StatusCodes.OK,
      }),
    );
    const getOperationResponse: OperationResponse = {
      operation: {
        status: OperationSessionStatus.Failed,
        isExpired: false,
        error: {
          code: OperationErrorCodes.PaymentChargeFailed,
          message: "test-error-message",
        },
      },
    };
    setGetOperationResponse(
      HttpResponse.json(getOperationResponse, { status: StatusCodes.OK }),
    );

    await purchaseOperationHelper.startPurchase(
      "test-app-user-id",
      "test-product-id",
      "test-email",
    );
    await expectPromiseToError(
      purchaseOperationHelper.pollCurrentPurchaseForCompletion(),
      new PurchasesError(
        ErrorCode.PaymentPendingError,
        "Purchase payment charge failed",
        "test-error-message",
      ),
    );
  });
});
