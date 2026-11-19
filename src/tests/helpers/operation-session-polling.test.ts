import { afterEach, expect, test, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { PurchaseOperationHelper } from "../../helpers/purchase-operation-helper";
import { Backend } from "../../networking/backend";
import { ErrorCode, PurchasesError } from "../../entities/errors";
import { setupMswServer } from "../utils/setup-msw-server";

const server = setupMswServer();
const backend = new Backend("test_api_key");
const endpoint =
  "http://localhost:8000/rcbilling/v1/checkout/resume/:appUserId/:checkoutToken";
const checkoutToken = "opaque-checkout-token";

afterEach(() => vi.useRealTimers());

test.each(["succeeded", "failed"])(
  "returns terminal %s before checking expiration or the deadline",
  async (status) => {
    const response = {
      operation_session_id: "rcbopsess_checkout",
      operation: {
        status,
        is_expired: true,
        product_identifier: "product",
        store_transaction_identifier: "transaction",
        purchase_date: "2026-11-11T12:00:00Z",
        redemption_info: { redeem_url: "https://redeem.example/token" },
      },
      attribution_metadata: { workflow_id: "workflow" },
    };
    server.use(
      http.get(endpoint, ({ params }) => {
        expect(params.checkoutToken).toBe(checkoutToken);
        expect(params.appUserId).toBe("buyer");
        return HttpResponse.json(response);
      }),
    );
    expect(
      await PurchaseOperationHelper.pollExternalCheckout(
        backend,
        "buyer",
        checkoutToken,
        0,
      ),
    ).toEqual({ status: "finished", response });
  },
);

test.each([
  { waitTimeoutMs: 0, expectedTimes: [0] },
  { waitTimeoutMs: 1500, expectedTimes: [0, 1000, 1500] },
])(
  "checks once even at a zero budget and respects a $waitTimeoutMs ms deadline",
  async ({ waitTimeoutMs, expectedTimes }) => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const requestTimes: number[] = [];
    server.use(
      http.get(endpoint, () => {
        requestTimes.push(Date.now());
        return HttpResponse.json({
          operation: { status: "started", is_expired: false },
        });
      }),
    );
    const result = PurchaseOperationHelper.pollExternalCheckout(
      backend,
      "buyer",
      checkoutToken,
      waitTimeoutMs,
    );
    await vi.runAllTimersAsync();
    expect(await result).toEqual({ status: "limit_reached" });
    expect(requestTimes).toEqual(expectedTimes);
  },
);

test("stops when an incomplete checkout expires", async () => {
  const request = vi.fn(() =>
    HttpResponse.json({
      operation: { status: "in_progress", is_expired: true },
    }),
  );
  server.use(http.get(endpoint, request));
  expect(
    await PurchaseOperationHelper.pollExternalCheckout(
      backend,
      "buyer",
      checkoutToken,
      15000,
    ),
  ).toEqual({ status: "expired" });
  expect(request).toHaveBeenCalledOnce();
});

test.each(["started", "succeeded"])(
  "allows an in-flight %s request to finish after the deadline",
  async (status) => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const response = { operation: { status, is_expired: false } };
    const request = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      return HttpResponse.json(response);
    });
    server.use(http.get(endpoint, request));
    const result = PurchaseOperationHelper.pollExternalCheckout(
      backend,
      "buyer",
      checkoutToken,
      1000,
    );
    await vi.runAllTimersAsync();
    expect(await result).toEqual(
      status === "succeeded"
        ? { status: "finished", response }
        : { status: "limit_reached" },
    );
    expect(Date.now()).toBe(2500);
    expect(request).toHaveBeenCalledOnce();
  },
);

test("rejects unknown operation statuses", async () => {
  server.use(
    http.get(endpoint, () =>
      HttpResponse.json({ operation: { status: "unknown" } }),
    ),
  );
  await expect(
    PurchaseOperationHelper.pollExternalCheckout(
      backend,
      "buyer",
      checkoutToken,
      0,
    ),
  ).rejects.toMatchObject({
    errorCode: ErrorCode.UnexpectedBackendResponseError,
    message: "Unknown checkout status.",
  });
});

test("propagates request failures without another polling attempt", async () => {
  const request = vi.fn(() =>
    HttpResponse.json({ code: 7225, message: "Unavailable" }, { status: 400 }),
  );
  server.use(http.get(endpoint, request));
  await expect(
    PurchaseOperationHelper.pollExternalCheckout(
      backend,
      "buyer",
      checkoutToken,
      15000,
    ),
  ).rejects.toBeInstanceOf(PurchasesError);
  expect(request).toHaveBeenCalledOnce();
});
