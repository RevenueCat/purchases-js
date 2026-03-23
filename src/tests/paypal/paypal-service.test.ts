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
import { loadScript, type PayPalNamespace } from "@paypal/paypal-js";
import { ErrorCode, BackendErrorCode } from "../../entities/errors";
import { setupMswServer } from "../utils/setup-msw-server";

vi.mock("@paypal/paypal-js", () => ({
  loadScript: vi.fn(),
}));

const testTraceId = "test-trace-id";
const operationSessionId = "test-operation-session-id";
const orderId = "test-order-id";

const checkoutStartEndpoint =
  "http://localhost:8000/rcbilling/v1/checkout/start";
const operationStatusEndpoint = `http://localhost:8000/rcbilling/v1/checkout/${operationSessionId}`;

const paypalCheckoutStartResponse: PayPalCheckoutStartResponse = {
  operation_session_id: operationSessionId,
  gateway_params: null,
  management_url: null,
  paypal_billing_params: {
    client_id: "test-client-id",
    order_id: orderId,
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

const server = setupMswServer(...mockHandlers);

describe("PayPalService", () => {
  let backend: Backend;
  let paypalService: PayPalService;
  let mockPayPalInstance: PayPalNamespace;
  let mockButtonsRender: ReturnType<typeof vi.fn>;
  let mockButtonsInstance: { render: ReturnType<typeof vi.fn> };
  let capturedButtonCallbacks: {
    createOrder?: () => string;
    onApprove?: () => Promise<void>;
    onCancel?: () => void;
    onError?: (err: Record<string, unknown>) => void;
  };

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

    capturedButtonCallbacks = {};
    mockButtonsRender = vi.fn().mockResolvedValue(undefined);
    mockButtonsInstance = { render: mockButtonsRender };

    mockPayPalInstance = {
      Buttons: vi.fn().mockImplementation((config) => {
        capturedButtonCallbacks = config;
        return mockButtonsInstance;
      }),
    } as unknown as PayPalNamespace;

    vi.clearAllMocks();
  });

  describe("initializePayPal", () => {
    test("initializes PayPal with sandbox environment", async () => {
      vi.mocked(loadScript).mockResolvedValue(mockPayPalInstance);

      const result = await paypalService.initializePayPal(
        "test-client-id",
        true,
      );

      expect(loadScript).toHaveBeenCalledWith({
        clientId: "test-client-id",
        buyerCountry: "US",
      });
      expect(result).toBe(mockPayPalInstance);
    });

    test("initializes PayPal with production environment", async () => {
      vi.mocked(loadScript).mockResolvedValue(mockPayPalInstance);

      const result = await paypalService.initializePayPal(
        "test-client-id",
        false,
      );

      expect(loadScript).toHaveBeenCalledWith({
        clientId: "test-client-id",
      });
      expect(result).toBe(mockPayPalInstance);
    });

    test("returns existing instance if already initialized", async () => {
      vi.mocked(loadScript).mockResolvedValue(mockPayPalInstance);

      await paypalService.initializePayPal("test-client-id", true);
      vi.clearAllMocks();

      const result = await paypalService.initializePayPal(
        "test-client-id",
        true,
      );

      expect(loadScript).not.toHaveBeenCalled();
      expect(result).toBe(mockPayPalInstance);
    });

    test("throws error when PayPal client is not found", async () => {
      vi.mocked(loadScript).mockResolvedValue(null);

      const expectedError = new PurchaseFlowError(
        PurchaseFlowErrorCode.UnknownError,
        "PayPal client not found",
      );

      await expect(
        paypalService.initializePayPal("test-client-id", true),
      ).rejects.toThrow(expectedError);
    });

    test("throws error when initialization fails", async () => {
      const error = new Error("Initialization failed");
      vi.mocked(loadScript).mockRejectedValue(error);

      const expectedError = new PurchaseFlowError(
        PurchaseFlowErrorCode.UnknownError,
        `Error initializing PayPal: ${error}`,
      );

      await expect(
        paypalService.initializePayPal("test-client-id", true),
      ).rejects.toThrow(expectedError);
    });
  });

  describe("getPayPalInstance", () => {
    test("returns PayPal instance when initialized", async () => {
      vi.mocked(loadScript).mockResolvedValue(mockPayPalInstance);

      await paypalService.initializePayPal("test-client-id", true);
      const result = paypalService.getPayPalInstance();

      expect(result).toBe(mockPayPalInstance);
    });

    test("throws error when PayPal is not initialized", () => {
      expect(() => paypalService.getPayPalInstance()).toThrow(
        new PurchaseFlowError(
          PurchaseFlowErrorCode.UnknownError,
          "PayPal not initialized.",
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

    test("starts checkout successfully and initializes PayPal", async () => {
      vi.mocked(loadScript).mockResolvedValue(mockPayPalInstance);

      const result = await paypalService.startCheckout(startCheckoutArgs);
      expect(result).toEqual(paypalCheckoutStartResponse);
      expect(loadScript).toHaveBeenCalledWith({
        clientId: "test-client-id",
        buyerCountry: "US",
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

    test("fails if PayPal initialization fails", async () => {
      vi.mocked(loadScript).mockRejectedValue(
        new Error("Initialization failed"),
      );

      const expectedError = new PurchaseFlowError(
        PurchaseFlowErrorCode.UnknownError,
        "Error starting PayPal checkout: Error: Error initializing PayPal: Error: Initialization failed",
        undefined,
        undefined,
        undefined,
      );

      await expect(
        paypalService.startCheckout(startCheckoutArgs),
      ).rejects.toThrow(expectedError);
    });
  });

  describe("purchase", () => {
    let container: HTMLElement;

    beforeEach(async () => {
      vi.mocked(loadScript).mockResolvedValue(mockPayPalInstance);
      await paypalService.initializePayPal("test-client-id", true);
      container = document.createElement("div");
    });

    test("renders PayPal buttons and calls onButtonsReady", async () => {
      const onButtonsReady = vi.fn();
      const onClose = vi.fn();

      const purchasePromise = paypalService.purchase({
        operationSessionId,
        orderId,
        onButtonsReady,
        onClose,
        container,
      });

      expect(mockPayPalInstance.Buttons).toHaveBeenCalled();
      expect(mockButtonsRender).toHaveBeenCalledWith(container);

      // Wait for render to complete
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(onButtonsReady).toHaveBeenCalled();

      // Clean up by cancelling
      capturedButtonCallbacks.onCancel?.();
      purchasePromise.catch(() => {});
    });

    test("createOrder returns the order ID", async () => {
      const purchasePromise = paypalService.purchase({
        operationSessionId,
        orderId,
        onButtonsReady: vi.fn(),
        onClose: vi.fn(),
        container,
      });

      const result = await capturedButtonCallbacks.createOrder?.();
      expect(result).toBe(orderId);

      capturedButtonCallbacks.onCancel?.();
      purchasePromise.catch(() => {});
    });

    test("completes purchase successfully when onApprove fires", async () => {
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
        onButtonsReady: vi.fn(),
        onClose: vi.fn(),
        container,
      });

      await capturedButtonCallbacks.onApprove?.();

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
    });

    test("calls onClose when user cancels", async () => {
      const onClose = vi.fn();

      const purchasePromise = paypalService.purchase({
        operationSessionId,
        orderId,
        onButtonsReady: vi.fn(),
        onClose,
        container,
      });

      capturedButtonCallbacks.onCancel?.();

      // onCancel doesn't reject the promise, it calls onClose
      expect(onClose).toHaveBeenCalled();

      purchasePromise.catch(() => {});
    });

    test("rejects on PayPal error", async () => {
      const purchasePromise = paypalService.purchase({
        operationSessionId,
        orderId,
        onButtonsReady: vi.fn(),
        onClose: vi.fn(),
        container,
      });

      capturedButtonCallbacks.onError?.({ message: "Something went wrong" });

      await expect(purchasePromise).rejects.toThrow(PurchaseFlowError);
    });

    test("rejects if PayPal is not initialized", async () => {
      const uninitializedService = new PayPalService(backend, {
        getTraceId: () => testTraceId,
        updateUser: () => Promise.resolve(),
        trackSDKEvent: () => {},
        trackExternalEvent: () => {},
        trackPaywallEvent: () => {},
        dispose: () => {},
        flushAllEvents: () => Promise.resolve(),
      });

      await expect(
        uninitializedService.purchase({
          operationSessionId,
          orderId,
          onButtonsReady: vi.fn(),
          onClose: vi.fn(),
          container,
        }),
      ).rejects.toThrow(
        new PurchaseFlowError(
          PurchaseFlowErrorCode.UnknownError,
          "PayPal not initialized.",
        ),
      );
    });

    test("rejects if Buttons component is not available", async () => {
      const noButtonsInstance = {} as PayPalNamespace;
      vi.mocked(loadScript).mockResolvedValue(noButtonsInstance);

      const service = new PayPalService(backend, {
        getTraceId: () => testTraceId,
        updateUser: () => Promise.resolve(),
        trackSDKEvent: () => {},
        trackExternalEvent: () => {},
        trackPaywallEvent: () => {},
        dispose: () => {},
        flushAllEvents: () => Promise.resolve(),
      });
      await service.initializePayPal("test-client-id", true);

      await expect(
        service.purchase({
          operationSessionId,
          orderId,
          onButtonsReady: vi.fn(),
          onClose: vi.fn(),
          container,
        }),
      ).rejects.toThrow(
        new PurchaseFlowError(
          PurchaseFlowErrorCode.UnknownError,
          "PayPal Buttons component not available",
        ),
      );
    });
  });

  describe("Operation status polling logic (on approval)", () => {
    let container: HTMLElement;

    beforeEach(async () => {
      vi.mocked(loadScript).mockResolvedValue(mockPayPalInstance);
      await paypalService.initializePayPal("test-client-id", true);
      container = document.createElement("div");
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

      const purchasePromise = paypalService.purchase({
        operationSessionId,
        orderId,
        onButtonsReady: vi.fn(),
        onClose: vi.fn(),
        container,
      });

      capturedButtonCallbacks.onApprove?.().catch(() => {});

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

      const purchasePromise = paypalService.purchase({
        operationSessionId,
        orderId,
        onButtonsReady: vi.fn(),
        onClose: vi.fn(),
        container,
      });

      capturedButtonCallbacks.onApprove?.();

      const rejectionPromise = purchasePromise.catch((error) => error);

      for (let i = 0; i < 10; i++) {
        await vi.advanceTimersByTimeAsync(1000);
      }

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

      const purchasePromise = paypalService.purchase({
        operationSessionId,
        orderId,
        onButtonsReady: vi.fn(),
        onClose: vi.fn(),
        container,
      });

      await capturedButtonCallbacks.onApprove?.();

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

      const purchasePromise = paypalService.purchase({
        operationSessionId,
        orderId,
        onButtonsReady: vi.fn(),
        onClose: vi.fn(),
        container,
      });

      await capturedButtonCallbacks.onApprove?.();

      await expect(purchasePromise).rejects.toThrow(PurchaseFlowError);
    });
  });
});
