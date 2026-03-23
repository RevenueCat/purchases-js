import { beforeEach, describe, expect, test, vi } from "vitest";
import { PayPalService } from "../../paypal/paypal-service";
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
import type { PayPalCheckoutStartResponse } from "../../networking/responses/checkout-start-response";
import {
  PurchaseFlowError,
  PurchaseFlowErrorCode,
} from "../../helpers/purchase-operation-helper";
import { ErrorCode, BackendErrorCode } from "../../entities/errors";
import { createMonthlyPackageMock } from "../mocks/offering-mock-provider";
import { setupMswServer } from "../utils/setup-msw-server";

const testTraceId = "test-trace-id";
const operationSessionId = "test-operation-session-id";
const orderId = "test-order-id";
const approvalUrl = "https://www.sandbox.paypal.com/checkoutnow?token=test";

const checkoutStartEndpoint =
  "http://localhost:8000/rcbilling/v1/checkout/start";
const operationStatusEndpoint = `http://localhost:8000/rcbilling/v1/checkout/${operationSessionId}`;

const paypalCheckoutStartResponse: PayPalCheckoutStartResponse = {
  operation_session_id: operationSessionId,
  gateway_params: null,
  management_url: null,
  paypal_billing_params: {
    order_id: orderId,
    approval_url: approvalUrl,
    is_sandbox: true,
  },
};

const mockHandlers = [
  http.post(checkoutStartEndpoint, async (req) => {
    const json = (await req.request.json()) as Record<string, unknown>;

    expect(json["trace_id"]).toBe(testTraceId);

    return HttpResponse.json(paypalCheckoutStartResponse, {
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

describe("PayPalService", () => {
  let backend: Backend;
  let paypalService: PayPalService;
  let mockPopup: { closed: boolean; close: () => void };

  beforeEach(() => {
    backend = new Backend("test_api_key");
    const eventsTrackerMock: IEventsTracker = {
      getTraceId: () => testTraceId,
      updateUser: () => Promise.resolve(),
      trackSDKEvent: () => {},
      trackExternalEvent: () => {},
      trackPaywallEvent: () => {},
      dispose: () => {},
      flushAllEvents: () => Promise.resolve(),
    };
    paypalService = new PayPalService(backend, eventsTrackerMock);

    mockPopup = {
      closed: false,
      close: vi.fn(),
    };

    vi.stubGlobal("open", vi.fn().mockReturnValue(mockPopup));

    vi.clearAllMocks();
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

    test("starts checkout successfully", async () => {
      const result = await paypalService.startCheckout(startCheckoutArgs);
      expect(result).toEqual(paypalCheckoutStartResponse);
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
        false,
      );

      await expect(
        paypalService.startCheckout(startCheckoutArgs),
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
        false,
      );

      await expect(
        paypalService.startCheckout(startCheckoutArgs),
      ).rejects.toThrow(expectedError);
    });
  });

  describe("purchase", () => {
    test("opens popup window with approval URL", async () => {
      const onCheckoutLoaded = vi.fn();
      const onClose = vi.fn();

      const purchasePromise = paypalService.purchase({
        operationSessionId,
        orderId,
        approvalUrl,
        onCheckoutLoaded,
        onClose,
        params: purchaseParams,
      });

      expect(onCheckoutLoaded).toHaveBeenCalled();
      expect(window.open).toHaveBeenCalledWith(
        approvalUrl,
        "paypal-checkout",
        expect.stringContaining("width="),
      );

      // Clean up
      purchasePromise.catch(() => {});
    });

    test("rejects if popup is blocked", async () => {
      vi.stubGlobal("open", vi.fn().mockReturnValue(null));

      await expect(
        paypalService.purchase({
          operationSessionId,
          orderId,
          approvalUrl,
          onCheckoutLoaded: vi.fn(),
          onClose: vi.fn(),
          params: purchaseParams,
        }),
      ).rejects.toThrow(
        new PurchaseFlowError(
          PurchaseFlowErrorCode.UnknownError,
          "Failed to open PayPal checkout window. Please allow popups for this site.",
        ),
      );
    });

    test("polls operation status after popup closes and resolves on success", async () => {
      vi.useFakeTimers();

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

      const purchasePromise = paypalService.purchase({
        operationSessionId,
        orderId,
        approvalUrl,
        onCheckoutLoaded: vi.fn(),
        onClose: vi.fn(),
        params: purchaseParams,
      });

      // Simulate popup closing (user completed payment on PayPal)
      mockPopup.closed = true;
      await vi.advanceTimersByTimeAsync(500);

      const result = await purchasePromise;

      expect(result).toEqual({
        redemptionInfo: {
          redeemUrl: "test-url://redeem_my_rcb?token=1234",
        },
        operationSessionId: operationSessionId,
        storeTransactionIdentifier: "test-store-transaction-id",
        productIdentifier: "test-product-id",
        purchaseDate: new Date("2025-01-15T04:21:11Z"),
      });

      vi.useRealTimers();
    });

    test("calls onClose when user closes popup and polling times out", async () => {
      vi.useFakeTimers();

      const onClose = vi.fn();

      server.use(
        http.get(operationStatusEndpoint, () =>
          HttpResponse.json(
            {
              operation: {
                status: CheckoutSessionStatus.Started,
                is_expired: false,
                error: null,
              },
            },
            { status: StatusCodes.OK },
          ),
        ),
      );

      const purchasePromise = paypalService.purchase({
        operationSessionId,
        orderId,
        approvalUrl,
        onCheckoutLoaded: vi.fn(),
        onClose,
        params: purchaseParams,
      });

      // Simulate popup closing (user cancelled)
      mockPopup.closed = true;
      await vi.advanceTimersByTimeAsync(500);

      // Advance past all polling attempts
      for (let i = 0; i < 10; i++) {
        await vi.advanceTimersByTimeAsync(1000);
      }
      await vi.runAllTimersAsync();

      // onClose should have been called since max attempts were reached
      // (user closed popup without completing payment)
      expect(onClose).toHaveBeenCalled();

      // Clean up - the promise won't reject since onClose was called instead
      purchasePromise.catch(() => {});

      vi.useRealTimers();
    });

    test("rejects if operation status is failed", async () => {
      vi.useFakeTimers();

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
            { status: StatusCodes.OK },
          ),
        ),
      );

      const purchasePromise = paypalService.purchase({
        operationSessionId,
        orderId,
        approvalUrl,
        onCheckoutLoaded: vi.fn(),
        onClose: vi.fn(),
        params: purchaseParams,
      });

      // Attach rejection handler before advancing timers to avoid unhandled rejection
      const expectation = expect(purchasePromise).rejects.toThrow(
        new PurchaseFlowError(
          PurchaseFlowErrorCode.ErrorChargingPayment,
          "Payment charge failed",
        ),
      );

      // Simulate popup closing
      mockPopup.closed = true;
      await vi.advanceTimersByTimeAsync(500);

      await expectation;

      vi.useRealTimers();
    });

    test("rejects if operation status response is missing required fields", async () => {
      vi.useFakeTimers();

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
            { status: StatusCodes.OK },
          ),
        ),
      );

      const purchasePromise = paypalService.purchase({
        operationSessionId,
        orderId,
        approvalUrl,
        onCheckoutLoaded: vi.fn(),
        onClose: vi.fn(),
        params: purchaseParams,
      });

      // Attach rejection handler before advancing timers to avoid unhandled rejection
      const expectation = expect(purchasePromise).rejects.toThrow(
        new PurchaseFlowError(
          PurchaseFlowErrorCode.UnknownError,
          "Missing required fields in operation response.",
        ),
      );

      // Simulate popup closing
      mockPopup.closed = true;
      await vi.advanceTimersByTimeAsync(500);

      await expectation;

      vi.useRealTimers();
    });

    test("rejects if getCheckoutStatus fails with network error", async () => {
      vi.useFakeTimers();

      server.use(
        http.get(operationStatusEndpoint, () =>
          HttpResponse.json(null, {
            status: StatusCodes.INTERNAL_SERVER_ERROR,
          }),
        ),
      );

      const purchasePromise = paypalService.purchase({
        operationSessionId,
        orderId,
        approvalUrl,
        onCheckoutLoaded: vi.fn(),
        onClose: vi.fn(),
        params: purchaseParams,
      });

      // Attach rejection handler before advancing timers to avoid unhandled rejection
      const expectation =
        expect(purchasePromise).rejects.toThrow(PurchaseFlowError);

      // Simulate popup closing
      mockPopup.closed = true;
      await vi.advanceTimersByTimeAsync(500);
      await vi.runAllTimersAsync();

      await expectation;

      vi.useRealTimers();
    });
  });
});
