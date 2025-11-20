import { beforeEach, describe, expect, test, vi } from "vitest";
import { PaddleService } from "../../paddle/paddle-service";
import { Backend } from "../../networking/backend";
import { HttpResponse } from "msw";
import { http } from "msw";
import { StatusCodes } from "http-status-codes";
import {
  CheckoutSessionStatus,
  CheckoutStatusErrorCodes,
  type CheckoutStatusResponse,
} from "../../networking/responses/checkout-status-response";
import { type IEventsTracker } from "../../behavioural-events/events-tracker";
import type { PaddleCheckoutStartResponse } from "../../networking/responses/checkout-start-response";
import {
  PurchaseFlowError,
  PurchaseFlowErrorCode,
} from "../../helpers/purchase-operation-helper";
import type { Paddle, PaddleEventData } from "@paddle/paddle-js";
import {
  initializePaddle as initPaddle,
  CheckoutEventNames,
} from "@paddle/paddle-js";
import {
  PurchasesError,
  ErrorCode,
  BackendErrorCode,
} from "../../entities/errors";
import { createMonthlyPackageMock } from "../mocks/offering-mock-provider";
import { setupMswServer } from "../utils/setup-msw-server";

vi.mock("@paddle/paddle-js", () => ({
  initializePaddle: vi.fn(),
  CheckoutEventNames: {
    CHECKOUT_LOADED: "checkout.loaded",
    CHECKOUT_COMPLETED: "checkout.completed",
    CHECKOUT_CLOSED: "checkout.closed",
  },
}));

const testTraceId = "test-trace-id";
const operationSessionId = "test-operation-session-id";
const transactionId = "test-transaction-id";

const checkoutStartEndpoint =
  "http://localhost:8000/rcbilling/v1/checkout/start";
const operationStatusEndpoint = `http://localhost:8000/rcbilling/v1/checkout/${operationSessionId}`;

const paddleCheckoutStartResponse: PaddleCheckoutStartResponse = {
  operation_session_id: operationSessionId,
  gateway_params: null,
  management_url: null,
  paddle_billing_params: {
    client_side_token: "test-client-side-token",
    is_sandbox: true,
    transaction_id: transactionId,
  },
};

const checkoutCompletedEvent: PaddleEventData = {
  name: CheckoutEventNames.CHECKOUT_COMPLETED,
};

const mockHandlers = [
  http.post(checkoutStartEndpoint, async (req) => {
    const json = (await req.request.json()) as Record<string, unknown>;

    expect(json["trace_id"]).toBe(testTraceId);

    return HttpResponse.json(paddleCheckoutStartResponse, {
      status: StatusCodes.OK,
    });
  }),
];

const purchaseParams = {
  rcPackage: createMonthlyPackageMock(),
  purchaseOption: { id: "test-option-id", priceId: "test-price-id" },
  appUserId: "test-app-user-id",
  presentedOfferingIdentifier: "test-offering-id",
};

const server = setupMswServer(...mockHandlers);

describe("PaddleService", () => {
  let backend: Backend;
  let paddleService: PaddleService;
  let mockPaddleInstance: Paddle;

  beforeEach(() => {
    backend = new Backend("test_api_key");
    const eventsTrackerMock: IEventsTracker = {
      getTraceId: () => testTraceId,
      updateUser: () => Promise.resolve(),
      trackSDKEvent: () => {},
      trackExternalEvent: () => {},
      dispose: () => {},
    };
    paddleService = new PaddleService(backend, eventsTrackerMock);

    mockPaddleInstance = {
      Initialized: true,
      Update: vi.fn(),
      Checkout: {
        open: vi.fn(),
        close: vi.fn(),
      },
    } as unknown as Paddle;

    vi.clearAllMocks();
  });

  function paddleEventCallback(event: PaddleEventData): Promise<void> {
    const paddleInstanceUpdate = vi.mocked(mockPaddleInstance.Update).mock
      .calls[0]?.[0] as
      | { eventCallback: (event: PaddleEventData) => Promise<void> }
      | undefined;
    if (!paddleInstanceUpdate?.eventCallback) {
      throw new Error(
        "Update was not called or eventCallback is missing. Make sure paddleService.purchase() was called first.",
      );
    }
    return paddleInstanceUpdate.eventCallback(event);
  }

  describe("initializePaddle", () => {
    test("initializes Paddle with sandbox environment", async () => {
      vi.mocked(initPaddle).mockResolvedValue(mockPaddleInstance);

      const result = await paddleService.initializePaddle("test-token", true);

      expect(initPaddle).toHaveBeenCalledWith({
        token: "test-token",
        version: "v1",
        environment: "sandbox",
      });
      expect(result).toBe(mockPaddleInstance);
    });

    test("initializes Paddle with production environment", async () => {
      vi.mocked(initPaddle).mockResolvedValue(mockPaddleInstance);

      const result = await paddleService.initializePaddle("test-token", false);

      expect(initPaddle).toHaveBeenCalledWith({
        token: "test-token",
        version: "v1",
        environment: "production",
      });
      expect(result).toBe(mockPaddleInstance);
    });

    test("returns existing instance if already initialized", async () => {
      vi.mocked(initPaddle).mockResolvedValue(mockPaddleInstance);

      await paddleService.initializePaddle("test-token", true);
      vi.clearAllMocks();

      const result = await paddleService.initializePaddle("test-token", true);

      expect(initPaddle).not.toHaveBeenCalled();
      expect(result).toBe(mockPaddleInstance);
    });

    test("throws error when Paddle client is not found", async () => {
      vi.mocked(initPaddle).mockResolvedValue(undefined);

      const expectedError = new PurchaseFlowError(
        PurchaseFlowErrorCode.UnknownError,
        "Paddle client not found",
      );

      await expect(
        paddleService.initializePaddle("test-token", true),
      ).rejects.toThrow(expectedError);
    });

    test("throws error when initialization fails", async () => {
      const error = new Error("Initialization failed");
      vi.mocked(initPaddle).mockRejectedValue(error);

      const expectedError = new PurchaseFlowError(
        PurchaseFlowErrorCode.UnknownError,
        `Error initializing Paddle: ${error}`,
      );

      await expect(
        paddleService.initializePaddle("test-token", true),
      ).rejects.toThrow(expectedError);
    });
  });

  describe("getPaddleInstance", () => {
    test("returns Paddle instance when initialized", async () => {
      vi.mocked(initPaddle).mockResolvedValue(mockPaddleInstance);

      await paddleService.initializePaddle("test-token", true);
      const result = paddleService.getPaddleInstance();

      expect(result).toBe(mockPaddleInstance);
    });

    test("throws error when Paddle is not initialized", () => {
      expect(() => paddleService.getPaddleInstance()).toThrow(
        new PurchaseFlowError(
          PurchaseFlowErrorCode.UnknownError,
          "Paddle not initialized.",
        ),
      );
    });

    test("throws error when Paddle instance exists but not initialized", async () => {
      const uninitializedInstance = { Initialized: false } as Paddle;
      vi.mocked(initPaddle).mockResolvedValue(uninitializedInstance);

      await paddleService.initializePaddle("test-token", true);

      expect(() => paddleService.getPaddleInstance()).toThrow(
        new PurchaseFlowError(
          PurchaseFlowErrorCode.UnknownError,
          "Paddle not initialized.",
        ),
      );
    });
  });

  describe("startCheckout", () => {
    const startCheckoutArgs = {
      appUserId: "test-app-user-id",
      productId: "test-product-id",
      presentedOfferingContext: {
        offeringIdentifier: "test-offering-id",
        targetingContext: null,
        placementIdentifier: null,
      },
      purchaseOption: { id: "test-option-id", priceId: "test-price-id" },
    };

    test("starts checkout successfully and initializes Paddle", async () => {
      vi.mocked(initPaddle).mockResolvedValue(mockPaddleInstance);

      const result = await paddleService.startCheckout(startCheckoutArgs);
      expect(result).toEqual(paddleCheckoutStartResponse);
      expect(initPaddle).toHaveBeenCalledWith({
        environment: "sandbox",
        token: "test-client-side-token",
        version: "v1",
      });
    });

    test("fails if /checkout/start fails", async () => {
      server.use(
        http.post(checkoutStartEndpoint, () =>
          HttpResponse.json(null, {
            status: StatusCodes.INTERNAL_SERVER_ERROR,
          }),
        ),
      );

      const expectedError = new PurchaseFlowError(
        PurchaseFlowErrorCode.ErrorSettingUpPurchase,
        "Unknown backend error.",
        "Request: postCheckoutStart. Status code: 500. Body: null.",
        ErrorCode.UnknownBackendError,
        { backendErrorCode: undefined },
      );

      await expect(
        paddleService.startCheckout(startCheckoutArgs),
      ).rejects.toThrow(expectedError);
    });

    test("fails if user already subscribed to product", async () => {
      server.use(
        http.post(checkoutStartEndpoint, () =>
          HttpResponse.json(
            {
              code: 7772,
              message:
                "This subscriber is already subscribed to the requested product.",
            },
            { status: StatusCodes.CONFLICT },
          ),
        ),
      );

      const expectedError = new PurchaseFlowError(
        PurchaseFlowErrorCode.AlreadyPurchasedError,
        "This product is already active for the user.",
        "This subscriber is already subscribed to the requested product.",
        ErrorCode.ProductAlreadyPurchasedError,
        { backendErrorCode: BackendErrorCode.BackendAlreadySubscribedError },
      );

      await expect(
        paddleService.startCheckout(startCheckoutArgs),
      ).rejects.toThrow(expectedError);
    });

    test("fails if Paddle initialization fails", async () => {
      vi.mocked(initPaddle).mockRejectedValue(
        new Error("Initialization failed"),
      );

      const expectedError = new PurchaseFlowError(
        PurchaseFlowErrorCode.UnknownError,
        "Error starting Paddle checkout: Error: Error initializing Paddle: Error: Initialization failed",
        undefined,
        undefined,
        undefined,
      );

      await expect(
        paddleService.startCheckout(startCheckoutArgs),
      ).rejects.toThrow(expectedError);
    });
  });

  describe("purchase", () => {
    beforeEach(async () => {
      vi.mocked(initPaddle).mockResolvedValue(mockPaddleInstance);
      await paddleService.initializePaddle("test-token", true);
    });

    test("opens checkout and calls onCheckoutLoaded when CHECKOUT_LOADED event fires", async () => {
      const onCheckoutLoaded = vi.fn();
      const unmountPaddlePurchaseUi = vi.fn();

      const purchasePromise = paddleService.purchase({
        operationSessionId,
        transactionId,
        onCheckoutLoaded,
        unmountPaddlePurchaseUi,
        params: purchaseParams,
      });

      expect(mockPaddleInstance.Update).toHaveBeenCalled();
      expect(mockPaddleInstance.Checkout?.open).toHaveBeenCalledWith({
        transactionId: "test-transaction-id",
        customData: {
          rc_user_id: "test-app-user-id",
        },
        settings: expect.any(Object),
      });

      await paddleEventCallback({ name: CheckoutEventNames.CHECKOUT_LOADED });

      expect(onCheckoutLoaded).toHaveBeenCalled();

      // Ignore errors - this test only verifies CHECKOUT_LOADED behavior
      purchasePromise.catch(() => {});
    });

    test("uses custom locale when provided", async () => {
      const purchasePromise = paddleService.purchase({
        operationSessionId,
        transactionId,
        onCheckoutLoaded: vi.fn(),
        unmountPaddlePurchaseUi: vi.fn(),
        params: { ...purchaseParams, locale: "es" },
      });

      expect(mockPaddleInstance.Checkout?.open).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: expect.objectContaining({ locale: "es" }),
        }),
      );

      purchasePromise.catch(() => {});
    });

    test("includes customer email in checkout data when provided", async () => {
      const purchasePromise = paddleService.purchase({
        operationSessionId,
        transactionId,
        onCheckoutLoaded: vi.fn(),
        unmountPaddlePurchaseUi: vi.fn(),
        params: { ...purchaseParams, customerEmail: "test@example.com" },
      });

      expect(mockPaddleInstance.Checkout?.open).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: { email: "test@example.com" },
        }),
      );

      purchasePromise.catch(() => {});
    });

    test("completes purchase successfully when CHECKOUT_COMPLETED event fires", async () => {
      const getOperationStatusResponse: CheckoutStatusResponse = {
        operation: {
          status: CheckoutSessionStatus.Succeeded,
          is_expired: false,
          error: null,
          redemption_info: {
            redeem_url: "test-url://redeem_my_rcb?token=1234",
          },
          store_transaction_identifier: "test-store-transaction-id",
          product_identifier: "test-product-id",
          purchase_date: "2025-01-15T04:21:11Z",
        },
      };
      server.use(
        http.get(operationStatusEndpoint, () =>
          HttpResponse.json(getOperationStatusResponse, {
            status: StatusCodes.OK,
          }),
        ),
      );

      const purchasePromise = paddleService.purchase({
        operationSessionId,
        transactionId,
        onCheckoutLoaded: vi.fn(),
        unmountPaddlePurchaseUi: vi.fn(),
        params: purchaseParams,
      });

      await paddleEventCallback(checkoutCompletedEvent);

      const result = await purchasePromise;

      expect(mockPaddleInstance.Checkout?.close).toHaveBeenCalled();
      expect(result).toEqual({
        redemptionInfo: {
          redeemUrl: "test-url://redeem_my_rcb?token=1234",
        },
        operationSessionId: operationSessionId,
        storeTransactionIdentifier: "test-store-transaction-id",
        productIdentifier: "test-product-id",
        purchaseDate: new Date("2025-01-15T04:21:11Z"),
      });
    });

    test("calls unmountPaddlePurchaseUi when user closes checkout", async () => {
      const unmountPaddlePurchaseUi = vi.fn();

      const purchasePromise = paddleService.purchase({
        operationSessionId,
        transactionId,
        onCheckoutLoaded: vi.fn(),
        unmountPaddlePurchaseUi,
        params: purchaseParams,
      });

      await paddleEventCallback({
        name: CheckoutEventNames.CHECKOUT_CLOSED,
        data: { status: "draft" } as PaddleEventData["data"],
      });

      expect(unmountPaddlePurchaseUi).toHaveBeenCalled();

      purchasePromise.catch(() => {});
    });

    test("does not call unmountPaddlePurchaseUi when code closes checkout", async () => {
      const unmountPaddlePurchaseUi = vi.fn();

      const purchasePromise = paddleService.purchase({
        operationSessionId,
        transactionId,
        onCheckoutLoaded: vi.fn(),
        unmountPaddlePurchaseUi,
        params: purchaseParams,
      });

      await paddleEventCallback({ name: CheckoutEventNames.CHECKOUT_CLOSED });

      expect(unmountPaddlePurchaseUi).not.toHaveBeenCalled();

      purchasePromise.catch(() => {});
    });

    test("rejects if checkout.open throws error", async () => {
      vi.mocked(mockPaddleInstance.Checkout?.open).mockImplementation(() => {
        throw new Error("Failed to open");
      });

      await expect(
        paddleService.purchase({
          operationSessionId,
          transactionId,
          onCheckoutLoaded: vi.fn(),
          unmountPaddlePurchaseUi: vi.fn(),
          params: purchaseParams,
        }),
      ).rejects.toThrow(
        new PurchaseFlowError(
          PurchaseFlowErrorCode.UnknownError,
          "Failed to open Paddle checkout: Error: Failed to open",
        ),
      );
    });

    test("rejects if Paddle is not initialized", async () => {
      const uninitializedService = new PaddleService(backend, {
        getTraceId: () => testTraceId,
        updateUser: () => Promise.resolve(),
        trackSDKEvent: () => {},
        trackExternalEvent: () => {},
        dispose: () => {},
      });

      await expect(
        uninitializedService.purchase({
          operationSessionId,
          transactionId,
          onCheckoutLoaded: vi.fn(),
          unmountPaddlePurchaseUi: vi.fn(),
          params: purchaseParams,
        }),
      ).rejects.toThrow(
        new PurchaseFlowError(
          PurchaseFlowErrorCode.UnknownError,
          "Paddle not initialized.",
        ),
      );
    });
  });

  describe("Operation status polling logic (on checkout completed)", () => {
    beforeEach(async () => {
      vi.mocked(initPaddle).mockResolvedValue(mockPaddleInstance);
      await paddleService.initializePaddle("test-token", true);
    });

    test("polls until operation status is succeeded", async () => {
      vi.useFakeTimers();

      let callCount = 0;
      server.use(
        http.get(operationStatusEndpoint, () => {
          callCount++;
          if (callCount === 1) {
            return HttpResponse.json(
              {
                operation: {
                  status: CheckoutSessionStatus.InProgress,
                  is_expired: false,
                  error: null,
                },
              },
              { status: StatusCodes.OK },
            );
          }
          return HttpResponse.json(
            {
              operation: {
                status: CheckoutSessionStatus.Succeeded,
                is_expired: false,
                error: null,
                store_transaction_identifier: "test-store-transaction-id",
                product_identifier: "test-product-id",
                purchase_date: "2025-01-15T04:21:11Z",
              },
            },
            { status: StatusCodes.OK },
          );
        }),
      );

      const purchasePromise = paddleService.purchase({
        operationSessionId,
        transactionId,
        onCheckoutLoaded: vi.fn(),
        unmountPaddlePurchaseUi: vi.fn(),
        params: purchaseParams,
      });

      // Ignore errors - they will be caught by purchasePromise rejection
      paddleEventCallback(checkoutCompletedEvent).catch(() => {});

      await vi.advanceTimersByTimeAsync(1000);

      const result = await purchasePromise;

      expect(callCount).toBe(2);
      expect(result.storeTransactionIdentifier).toBe(
        "test-store-transaction-id",
      );

      vi.useRealTimers();
    });

    test("rejects after max attempts if status never succeeds", async () => {
      vi.useFakeTimers();

      server.use(
        http.get(operationStatusEndpoint, () =>
          HttpResponse.json(
            {
              operation: {
                status: CheckoutSessionStatus.InProgress,
                is_expired: false,
                error: null,
              },
            },
            {
              status: StatusCodes.OK,
            },
          ),
        ),
      );

      const purchasePromise = paddleService.purchase({
        operationSessionId,
        transactionId,
        onCheckoutLoaded: vi.fn(),
        unmountPaddlePurchaseUi: vi.fn(),
        params: purchaseParams,
      });

      paddleEventCallback(checkoutCompletedEvent);

      // Set up promise rejection handler to prevent unhandled rejections
      // Expected rejection - will be verified below
      const rejectionPromise = purchasePromise.catch((error) => error);

      // Advance timers to trigger all polling attempts
      // First attempt happens immediately when eventCallback is called
      // Then we need to advance 10 more times to trigger attempts 2-11
      // After 10 attempts, the 11th check (checkCount = 11) will exceed maxNumberAttempts (10) and reject
      for (let i = 0; i < 10; i++) {
        await vi.advanceTimersByTimeAsync(1000);
      }

      // Run all remaining pending timers to ensure the rejection is triggered
      await vi.runAllTimersAsync();

      const error = await rejectionPromise;
      expect(error).toBeInstanceOf(PurchaseFlowError);
      expect(error).toEqual(
        expect.objectContaining({
          errorCode: PurchaseFlowErrorCode.UnknownError,
          message:
            "Max attempts reached trying to get successful purchase status",
        }),
      );

      vi.useRealTimers();
    });

    test("rejects if operation status response is missing required fields", async () => {
      server.use(
        http.get(operationStatusEndpoint, () =>
          HttpResponse.json(
            {
              operation: {
                status: CheckoutSessionStatus.Succeeded,
                is_expired: false,
                error: null,
                // missing store_transaction_identifier, product_identifier, purchase_date
              },
            },
            {
              status: StatusCodes.OK,
            },
          ),
        ),
      );

      const purchasePromise = paddleService.purchase({
        operationSessionId,
        transactionId,
        onCheckoutLoaded: vi.fn(),
        unmountPaddlePurchaseUi: vi.fn(),
        params: purchaseParams,
      });

      await paddleEventCallback(checkoutCompletedEvent);

      await expect(purchasePromise).rejects.toThrow(
        new PurchaseFlowError(
          PurchaseFlowErrorCode.UnknownError,
          "Missing required fields in operation response.",
        ),
      );
    });

    test("rejects if operation status is failed", async () => {
      server.use(
        http.get(operationStatusEndpoint, () =>
          HttpResponse.json(
            {
              operation: {
                status: CheckoutSessionStatus.Failed,
                is_expired: false,
                error: {
                  code: CheckoutStatusErrorCodes.PaymentChargeFailed,
                  message: "test-error-message",
                },
              },
            },
            {
              status: StatusCodes.OK,
            },
          ),
        ),
      );

      const purchasePromise = paddleService.purchase({
        operationSessionId,
        transactionId,
        onCheckoutLoaded: vi.fn(),
        unmountPaddlePurchaseUi: vi.fn(),
        params: purchaseParams,
      });

      await paddleEventCallback(checkoutCompletedEvent);

      await expect(purchasePromise).rejects.toThrow(
        new PurchaseFlowError(
          PurchaseFlowErrorCode.ErrorChargingPayment,
          "Payment charge failed",
        ),
      );
    });

    test("rejects if getCheckoutStatus fails with network error", async () => {
      server.use(
        http.get(operationStatusEndpoint, () =>
          HttpResponse.json(null, {
            status: StatusCodes.INTERNAL_SERVER_ERROR,
          }),
        ),
      );

      const purchasePromise = paddleService.purchase({
        operationSessionId,
        transactionId,
        onCheckoutLoaded: vi.fn(),
        unmountPaddlePurchaseUi: vi.fn(),
        params: purchaseParams,
      });

      await paddleEventCallback(checkoutCompletedEvent);

      await expect(purchasePromise).rejects.toThrow(PurchaseFlowError);
    });

    test("handles invalid purchase date gracefully", async () => {
      const checkoutStatusResponse: CheckoutStatusResponse = {
        operation: {
          status: CheckoutSessionStatus.Succeeded,
          is_expired: false,
          error: null,
          store_transaction_identifier: "test-store-transaction-id",
          product_identifier: "test-product-id",
          purchase_date: "invalid-date",
        },
      };
      server.use(
        http.get(operationStatusEndpoint, () =>
          HttpResponse.json(checkoutStatusResponse, {
            status: StatusCodes.OK,
          }),
        ),
      );

      const purchasePromise = paddleService.purchase({
        operationSessionId,
        transactionId,
        onCheckoutLoaded: vi.fn(),
        unmountPaddlePurchaseUi: vi.fn(),
        params: purchaseParams,
      });

      await paddleEventCallback(checkoutCompletedEvent).catch(() => {});

      await expect(purchasePromise).rejects.toThrow(
        new PurchaseFlowError(
          PurchaseFlowErrorCode.UnknownError,
          "Missing required fields in operation response.",
        ),
      );
    });

    test("handles error in event callback and closes checkout", async () => {
      const checkoutStatusResponse: CheckoutStatusResponse = {
        operation: {
          status: CheckoutSessionStatus.Succeeded,
          is_expired: false,
          error: null,
          store_transaction_identifier: "test-store-transaction-id",
          product_identifier: "test-product-id",
          purchase_date: "2025-01-15T04:21:11Z",
        },
      };
      server.use(
        http.get(operationStatusEndpoint, () =>
          HttpResponse.json(checkoutStatusResponse, {
            status: StatusCodes.OK,
          }),
        ),
      );

      vi.spyOn(backend, "getCheckoutStatus").mockRejectedValue(
        new PurchasesError(ErrorCode.NetworkError, "Network error"),
      );

      const purchasePromise = paddleService.purchase({
        operationSessionId,
        transactionId,
        onCheckoutLoaded: vi.fn(),
        unmountPaddlePurchaseUi: vi.fn(),
        params: {
          rcPackage: createMonthlyPackageMock(),
          purchaseOption: { id: "test-option-id", priceId: "test-price-id" },
          appUserId: "test-app-user-id",
          presentedOfferingIdentifier: "test-offering-id",
        },
      });

      await paddleEventCallback(checkoutCompletedEvent);

      await expect(purchasePromise).rejects.toThrow(PurchaseFlowError);
      expect(mockPaddleInstance.Checkout?.close).toHaveBeenCalled();
    });
  });
});
