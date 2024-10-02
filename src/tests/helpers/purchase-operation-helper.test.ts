import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
  PurchaseFlowError,
  PurchaseFlowErrorCode,
  PurchaseOperationHelper,
} from "../../helpers/purchase-operation-helper";
import { Backend } from "../../networking/backend";
import { setupServer, type SetupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { StatusCodes } from "http-status-codes";
import { failTest } from "../test-helpers";
import { type PurchaseResponse } from "../../networking/responses/purchase-response";
import {
  CheckoutSessionStatus,
  CheckoutStatusErrorCodes,
  type CheckoutStatusResponse,
} from "../../networking/responses/checkout-status-response";

describe("PurchaseOperationHelper", () => {
  let server: SetupServer;
  let backend: Backend;
  let purchaseOperationHelper: PurchaseOperationHelper;

  const operationSessionId = "test-operation-session-id";
  const successPurchaseBody: PurchaseResponse = {
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

  function setPurchaseResponse(httpResponse: HttpResponse) {
    server.use(
      http.post("http://localhost:8000/rcbilling/v1/purchase", () => {
        return httpResponse;
      }),
    );
  }

  function setGetCheckoutStatusResponse(httpResponse: HttpResponse) {
    server.use(
      http.get(
        `http://localhost:8000/rcbilling/v1/checkout/${operationSessionId}`,
        () => {
          return httpResponse;
        },
      ),
    );
  }

  test("startPurchase fails if /purchase fails", async () => {
    setPurchaseResponse(
      HttpResponse.json(null, { status: StatusCodes.INTERNAL_SERVER_ERROR }),
    );
    await expectPromiseToPurchaseFlowError(
      purchaseOperationHelper.startPurchase(
        "test-app-user-id",
        "test-product-id",
        { id: "test-option-id", priceId: "test-price-id" },
        "test-email",
        {
          offeringIdentifier: "test-offering-id",
          targetingContext: null,
          placementIdentifier: null,
        },
      ),
      new PurchaseFlowError(
        PurchaseFlowErrorCode.ErrorSettingUpPurchase,
        "Unknown backend error.",
        "Request: purchase. Status code: 500. Body: null.",
      ),
    );
  });

  test("startPurchase fails if user already subscribed to product", async () => {
    setPurchaseResponse(
      HttpResponse.json(
        {
          code: 7772,
          message:
            "This subscriber is already subscribed to the requested product.",
        },
        { status: StatusCodes.CONFLICT },
      ),
    );
    await expectPromiseToPurchaseFlowError(
      purchaseOperationHelper.startPurchase(
        "test-app-user-id",
        "test-product-id",
        { id: "test-option-id", priceId: "test-price-id" },
        "test-email",
        {
          offeringIdentifier: "test-offering-id",
          targetingContext: null,
          placementIdentifier: null,
        },
      ),
      new PurchaseFlowError(
        PurchaseFlowErrorCode.AlreadySubscribedError,
        "This product is already active for the user.",
        "This subscriber is already subscribed to the requested product.",
      ),
    );
  });

  test("pollCurrentPurchaseForCompletion fails if startPurchase not called before", async () => {
    await expectPromiseToPurchaseFlowError(
      purchaseOperationHelper.pollCurrentPurchaseForCompletion(),
      new PurchaseFlowError(
        PurchaseFlowErrorCode.ErrorSettingUpPurchase,
        "No purchase in progress",
      ),
    );
  });

  test("pollCurrentPurchaseForCompletion fails if poll request fails", async () => {
    setPurchaseResponse(
      HttpResponse.json(successPurchaseBody, {
        status: StatusCodes.OK,
      }),
    );
    setGetCheckoutStatusResponse(
      HttpResponse.json(null, { status: StatusCodes.INTERNAL_SERVER_ERROR }),
    );

    await purchaseOperationHelper.startPurchase(
      "test-app-user-id",
      "test-product-id",
      { id: "test-option-id", priceId: "test-price-id" },
      "test-email",
      {
        offeringIdentifier: "test-offering-id",
        targetingContext: null,
        placementIdentifier: null,
      },
    );
    await expectPromiseToPurchaseFlowError(
      purchaseOperationHelper.pollCurrentPurchaseForCompletion(),
      new PurchaseFlowError(
        PurchaseFlowErrorCode.NetworkError,
        "Unknown backend error.",
        "Request: getCheckoutStatus. Status code: 500. Body: null.",
      ),
    );
  });

  test("pollCurrentPurchaseForCompletion success if poll returns success", async () => {
    setPurchaseResponse(
      HttpResponse.json(successPurchaseBody, {
        status: StatusCodes.OK,
      }),
    );
    const getCheckoutStatusResponse: CheckoutStatusResponse = {
      operation: {
        status: CheckoutSessionStatus.Succeeded,
        isExpired: false,
        error: null,
      },
    };
    setGetCheckoutStatusResponse(
      HttpResponse.json(getCheckoutStatusResponse, { status: StatusCodes.OK }),
    );

    await purchaseOperationHelper.startPurchase(
      "test-app-user-id",
      "test-product-id",
      { id: "test-option-id", priceId: "test-price-id" },
      "test-email",
      {
        offeringIdentifier: "test-offering-id",
        targetingContext: null,
        placementIdentifier: null,
      },
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
  //   const getCheckoutStatusResponse: OperationResponse = {
  //     operation: {
  //       status: OperationSessionStatus.InProgress,
  //       isExpired: false,
  //       error: null,
  //     },
  //   };
  //   setGetCheckoutStatusResponse(
  //     HttpResponse.json(getCheckoutStatusResponse, { status: StatusCodes.OK }),
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
    setPurchaseResponse(
      HttpResponse.json(successPurchaseBody, {
        status: StatusCodes.OK,
      }),
    );
    const getCheckoutStatusResponse: CheckoutStatusResponse = {
      operation: {
        status: CheckoutSessionStatus.Failed,
        isExpired: false,
        error: {
          code: CheckoutStatusErrorCodes.PaymentChargeFailed,
          message: "test-error-message",
        },
      },
    };
    setGetCheckoutStatusResponse(
      HttpResponse.json(getCheckoutStatusResponse, { status: StatusCodes.OK }),
    );

    await purchaseOperationHelper.startPurchase(
      "test-app-user-id",
      "test-product-id",
      { id: "test-option-id", priceId: "test-price-id" },
      "test-email",
      {
        offeringIdentifier: "test-offering-id",
        targetingContext: null,
        placementIdentifier: null,
      },
    );
    await expectPromiseToPurchaseFlowError(
      purchaseOperationHelper.pollCurrentPurchaseForCompletion(),
      new PurchaseFlowError(
        PurchaseFlowErrorCode.ErrorChargingPayment,
        "Payment charge failed",
      ),
    );
  });
});

function verifyExpectedError(e: unknown, expectedError: PurchaseFlowError) {
  expect(e).toBeInstanceOf(PurchaseFlowError);
  const purchasesError = e as PurchaseFlowError;
  expect(purchasesError.errorCode).toEqual(expectedError.errorCode);
  expect(purchasesError.message).toEqual(expectedError.message);
  expect(purchasesError.underlyingErrorMessage).toEqual(
    expectedError.underlyingErrorMessage,
  );
}

function expectPromiseToPurchaseFlowError(
  f: Promise<unknown>,
  expectedError: PurchaseFlowError,
) {
  return f.then(
    () => failTest(),
    (e) => verifyExpectedError(e, expectedError),
  );
}
