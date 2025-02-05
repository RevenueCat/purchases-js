import {
  afterEach,
  assert,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";
import {
  PurchaseFlowError,
  PurchaseFlowErrorCode,
  PurchaseOperationHelper,
} from "../../helpers/purchase-operation-helper";
import { Backend } from "../../networking/backend";
import { setupServer, type SetupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { StatusCodes } from "http-status-codes";
import {
  CheckoutSessionStatus,
  CheckoutStatusErrorCodes,
  type CheckoutStatusResponse,
} from "../../networking/responses/checkout-status-response";
import { checkoutStartResponse } from "../test-responses";

describe("PurchaseOperationHelper", () => {
  let server: SetupServer;
  let backend: Backend;
  let purchaseOperationHelper: PurchaseOperationHelper;

  const operationSessionId = checkoutStartResponse.operation_session_id;

  beforeEach(() => {
    server = setupServer();
    server.listen();
    backend = new Backend("test_api_key");
    purchaseOperationHelper = new PurchaseOperationHelper(backend);
  });

  afterEach(() => {
    server.close();
  });

  function setCheckoutStartResponse(httpResponse: HttpResponse) {
    server.use(
      http.post("http://localhost:8000/rcbilling/v1/checkout/start", () => {
        return httpResponse;
      }),
    );
  }

  function setCheckoutCompleteResponse(httpResponse: HttpResponse) {
    server.use(
      http.post(
        `http://localhost:8000/rcbilling/v1/checkout/${operationSessionId}/complete`,
        () => {
          return httpResponse;
        },
      ),
    );
  }

  function setGetCheckoutStatusResponse(httpResponse: HttpResponse) {
    setGetCheckoutStatusResponseResolver(() => {
      return httpResponse;
    });
  }

  function setGetCheckoutStatusResponseResolver(
    httpResponseResolver: () => HttpResponse,
  ) {
    server.use(
      http.get(
        `http://localhost:8000/rcbilling/v1/checkout/${operationSessionId}`,
        httpResponseResolver,
      ),
    );
  }

  test("checkoutStart fails if /checkout/start fails", async () => {
    setCheckoutStartResponse(
      HttpResponse.json(null, { status: StatusCodes.INTERNAL_SERVER_ERROR }),
    );
    await expectPromiseToPurchaseFlowError(
      purchaseOperationHelper.checkoutStart(
        "test-app-user-id",
        "test-product-id",
        { id: "test-option-id", priceId: "test-price-id" },
        {
          offeringIdentifier: "test-offering-id",
          targetingContext: null,
          placementIdentifier: null,
        },
      ),
      new PurchaseFlowError(
        PurchaseFlowErrorCode.ErrorSettingUpPurchase,
        "Unknown backend error.",
        "Request: checkoutStart. Status code: 500. Body: null.",
      ),
    );
  });

  test("checkoutStart fails if user already subscribed to product", async () => {
    setCheckoutStartResponse(
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
      purchaseOperationHelper.checkoutStart(
        "test-app-user-id",
        "test-product-id",
        { id: "test-option-id", priceId: "test-price-id" },
        {
          offeringIdentifier: "test-offering-id",
          targetingContext: null,
          placementIdentifier: null,
        },
      ),
      new PurchaseFlowError(
        PurchaseFlowErrorCode.AlreadyPurchasedError,
        "This product is already active for the user.",
        "This subscriber is already subscribed to the requested product.",
      ),
    );
  });

  test("checkoutComplete fails if checkoutStart not called before", async () => {
    await expectPromiseToPurchaseFlowError(
      purchaseOperationHelper.checkoutComplete(),
      new PurchaseFlowError(
        PurchaseFlowErrorCode.ErrorSettingUpPurchase,
        "No purchase started",
      ),
    );
  });

  test("checkoutComplete fails if /checkout/{operation_session_id}/complete fails", async () => {
    setCheckoutStartResponse(
      HttpResponse.json(checkoutStartResponse, {
        status: StatusCodes.OK,
      }),
    );
    setCheckoutCompleteResponse(
      HttpResponse.json(null, { status: StatusCodes.INTERNAL_SERVER_ERROR }),
    );

    await purchaseOperationHelper.checkoutStart(
      "test-app-user-id",
      "test-product-id",
      { id: "test-option-id", priceId: "test-price-id" },
      {
        offeringIdentifier: "test-offering-id",
        targetingContext: null,
        placementIdentifier: null,
      },
    );

    await expectPromiseToPurchaseFlowError(
      purchaseOperationHelper.checkoutComplete(),
      new PurchaseFlowError(
        PurchaseFlowErrorCode.ErrorSettingUpPurchase,
        "Unknown backend error.",
        "Request: checkoutComplete. Status code: 500. Body: null.",
      ),
    );
  });

  test("checkoutComplete fails if email is missing", async () => {
    setCheckoutStartResponse(
      HttpResponse.json(checkoutStartResponse, {
        status: StatusCodes.OK,
      }),
    );
    setCheckoutCompleteResponse(
      HttpResponse.json(
        {
          code: 7878,
          message: "Email is required to complete the purchase.",
        },
        { status: StatusCodes.BAD_REQUEST },
      ),
    );

    await purchaseOperationHelper.checkoutStart(
      "test-app-user-id",
      "test-product-id",
      { id: "test-option-id", priceId: "test-price-id" },
      {
        offeringIdentifier: "test-offering-id",
        targetingContext: null,
        placementIdentifier: null,
      },
    );

    await expectPromiseToPurchaseFlowError(
      purchaseOperationHelper.checkoutComplete(),
      new PurchaseFlowError(
        PurchaseFlowErrorCode.MissingEmailError,
        "Email is not valid. Please provide a valid email address.",
        "Email is required to complete the purchase.",
      ),
    );
  });

  test("pollCurrentPurchaseForCompletion fails if checkoutStart not called before", async () => {
    await expectPromiseToPurchaseFlowError(
      purchaseOperationHelper.pollCurrentPurchaseForCompletion(),
      new PurchaseFlowError(
        PurchaseFlowErrorCode.ErrorSettingUpPurchase,
        "No purchase in progress",
      ),
    );
  });

  test("pollCurrentPurchaseForCompletion fails if poll request fails", async () => {
    setCheckoutStartResponse(
      HttpResponse.json(checkoutStartResponse, {
        status: StatusCodes.OK,
      }),
    );
    setGetCheckoutStatusResponse(
      HttpResponse.json(null, { status: StatusCodes.INTERNAL_SERVER_ERROR }),
    );

    await purchaseOperationHelper.checkoutStart(
      "test-app-user-id",
      "test-product-id",
      { id: "test-option-id", priceId: "test-price-id" },
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
    setCheckoutStartResponse(
      HttpResponse.json(checkoutStartResponse, {
        status: StatusCodes.OK,
      }),
    );
    const getCheckoutStatusResponse: CheckoutStatusResponse = {
      operation: {
        status: CheckoutSessionStatus.Succeeded,
        is_expired: false,
        error: null,
      },
    };
    setGetCheckoutStatusResponse(
      HttpResponse.json(getCheckoutStatusResponse, { status: StatusCodes.OK }),
    );

    await purchaseOperationHelper.checkoutStart(
      "test-app-user-id",
      "test-product-id",
      { id: "test-option-id", priceId: "test-price-id" },
      {
        offeringIdentifier: "test-offering-id",
        targetingContext: null,
        placementIdentifier: null,
      },
    );
    await purchaseOperationHelper.pollCurrentPurchaseForCompletion();
  });

  test("pollCurrentPurchaseForCompletion success with redemption info if poll returns success", async () => {
    setCheckoutStartResponse(
      HttpResponse.json(checkoutStartResponse, {
        status: StatusCodes.OK,
      }),
    );
    const getCheckoutStatusResponse: CheckoutStatusResponse = {
      operation: {
        status: CheckoutSessionStatus.Succeeded,
        is_expired: false,
        error: null,
        redemption_info: {
          redeem_url: "test-url://redeem_my_rcb?token=1234",
        },
      },
    };
    setGetCheckoutStatusResponse(
      HttpResponse.json(getCheckoutStatusResponse, { status: StatusCodes.OK }),
    );

    await purchaseOperationHelper.checkoutStart(
      "test-app-user-id",
      "test-product-id",
      { id: "test-option-id", priceId: "test-price-id" },
      {
        offeringIdentifier: "test-offering-id",
        targetingContext: null,
        placementIdentifier: null,
      },
    );
    const pollResult =
      await purchaseOperationHelper.pollCurrentPurchaseForCompletion();
    expect(pollResult.redemptionInfo?.redeemUrl).toEqual(
      "test-url://redeem_my_rcb?token=1234",
    );
  });

  test("pollCurrentPurchaseForCompletion fails if poll returns in progress more times than retries", async () => {
    vi.useFakeTimers();

    setCheckoutStartResponse(
      HttpResponse.json(checkoutStartResponse, {
        status: StatusCodes.OK,
      }),
    );
    const getCheckoutStatusResponse: CheckoutStatusResponse = {
      operation: {
        status: CheckoutSessionStatus.InProgress,
        is_expired: false,
        error: null,
      },
    };

    let callCount = 0;
    let lastCallTime = 0;
    setGetCheckoutStatusResponseResolver(() => {
      callCount++;
      const currentTime = Date.now();
      if (lastCallTime > 0) {
        expect(currentTime - lastCallTime).toBeGreaterThanOrEqual(1000);
      }
      lastCallTime = currentTime;
      return HttpResponse.json(getCheckoutStatusResponse, {
        status: StatusCodes.OK,
      });
    });

    await purchaseOperationHelper.checkoutStart(
      "test-app-user-id",
      "test-product-id",
      { id: "test-option-id", priceId: "test-price-id" },
      {
        offeringIdentifier: "test-offering-id",
        targetingContext: null,
        placementIdentifier: null,
      },
    );

    const pollPromise = expectPromiseToPurchaseFlowError(
      purchaseOperationHelper.pollCurrentPurchaseForCompletion(),
      new PurchaseFlowError(
        PurchaseFlowErrorCode.UnknownError,
        "Max attempts reached trying to get successful purchase status",
      ),
    );

    await vi.runAllTimersAsync();

    expect(callCount).toEqual(10);

    await pollPromise;

    vi.useRealTimers();
  });

  test("pollCurrentPurchaseForCompletion error if poll returns error", async () => {
    setCheckoutStartResponse(
      HttpResponse.json(checkoutStartResponse, {
        status: StatusCodes.OK,
      }),
    );
    const getCheckoutStatusResponse: CheckoutStatusResponse = {
      operation: {
        status: CheckoutSessionStatus.Failed,
        is_expired: false,
        error: {
          code: CheckoutStatusErrorCodes.PaymentChargeFailed,
          message: "test-error-message",
        },
      },
    };
    setGetCheckoutStatusResponse(
      HttpResponse.json(getCheckoutStatusResponse, { status: StatusCodes.OK }),
    );

    await purchaseOperationHelper.checkoutStart(
      "test-app-user-id",
      "test-product-id",
      { id: "test-option-id", priceId: "test-price-id" },
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

  test("pollCurrentPurchaseForCompletion error if poll returns unknown error code", async () => {
    setCheckoutStartResponse(
      HttpResponse.json(checkoutStartResponse, {
        status: StatusCodes.OK,
      }),
    );
    const getCheckoutStatusResponse: CheckoutStatusResponse = {
      operation: {
        status: CheckoutSessionStatus.Failed,
        is_expired: false,
        error: {
          code: 12345,
          message: "test-error-message",
        },
      },
    };
    setGetCheckoutStatusResponse(
      HttpResponse.json(getCheckoutStatusResponse, { status: StatusCodes.OK }),
    );

    await purchaseOperationHelper.checkoutStart(
      "test-app-user-id",
      "test-product-id",
      { id: "test-option-id", priceId: "test-price-id" },
      {
        offeringIdentifier: "test-offering-id",
        targetingContext: null,
        placementIdentifier: null,
      },
    );
    await expectPromiseToPurchaseFlowError(
      purchaseOperationHelper.pollCurrentPurchaseForCompletion(),
      new PurchaseFlowError(
        PurchaseFlowErrorCode.UnknownError,
        "Unknown error code received",
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
    () => assert.fail("Promise was expected to raise an error"),
    (e) => verifyExpectedError(e, expectedError),
  );
}
