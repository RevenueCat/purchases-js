import { afterEach, expect, test, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { PurchaseOperationHelper } from "../../helpers/purchase-operation-helper";
import { Backend } from "../../networking/backend";
import { ErrorCode, PurchasesError } from "../../entities/errors";
import { setupMswServer } from "../utils/setup-msw-server";

const server = setupMswServer();
const backend = new Backend("test_api_key");
const endpoint = "http://localhost:8000/rcbilling/v1/checkout/:id";

afterEach(() => vi.useRealTimers());

test.each(["succeeded", "failed"])(
  "returns terminal %s before checking expiration or the deadline",
  async (status) => {
    const response = {
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
      http.get(endpoint, ({ request, params }) => {
        expect(params.id).toBe("operation");
        expect(new URL(request.url).searchParams.get("app_user_id")).toBe(
          "buyer",
        );
        return HttpResponse.json(response);
      }),
    );
    expect(
      await PurchaseOperationHelper.pollOperationSession(backend, "operation", {
        appUserId: "buyer",
        waitTimeoutMs: 0,
        stopOnExpiration: true,
      }),
    ).toEqual({ status: "finished", response });
  },
);

test("preserves the attempt count, interval and final exhaustion delay", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(0);
  const requestTimes: number[] = [];
  server.use(
    http.get(endpoint, ({ request }) => {
      expect(new URL(request.url).searchParams.has("app_user_id")).toBe(false);
      requestTimes.push(Date.now());
      return HttpResponse.json({
        operation: { status: "in_progress", is_expired: false },
      });
    }),
  );
  const result = PurchaseOperationHelper.pollOperationSession(
    backend,
    "operation",
    { maxAttempts: 3 },
  );
  await vi.runAllTimersAsync();
  expect(await result).toEqual({ status: "limit_reached" });
  expect(requestTimes).toEqual([0, 1000, 2000]);
  expect(Date.now()).toBe(3000);
});

test("does not request an operation when no attempts are allowed", async () => {
  const request = vi.fn(() =>
    HttpResponse.json({ operation: { status: "succeeded" } }),
  );
  server.use(http.get(endpoint, request));
  expect(
    await PurchaseOperationHelper.pollOperationSession(backend, "operation", {
      maxAttempts: 0,
    }),
  ).toEqual({ status: "limit_reached" });
  expect(request).not.toHaveBeenCalled();
});

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
    const result = PurchaseOperationHelper.pollOperationSession(
      backend,
      "operation",
      { waitTimeoutMs },
    );
    await vi.runAllTimersAsync();
    expect(await result).toEqual({ status: "limit_reached" });
    expect(requestTimes).toEqual(expectedTimes);
  },
);

test.each([true, false])(
  "honors stopOnExpiration=%s only for incomplete operations",
  async (stopOnExpiration) => {
    vi.useFakeTimers();
    const request = vi.fn(() =>
      HttpResponse.json({
        operation: { status: "in_progress", is_expired: true },
      }),
    );
    server.use(http.get(endpoint, request));
    const result = PurchaseOperationHelper.pollOperationSession(
      backend,
      "operation",
      {
        maxAttempts: 2,
        stopOnExpiration,
      },
    );
    await vi.runAllTimersAsync();
    expect(await result).toEqual({
      status: stopOnExpiration ? "expired" : "limit_reached",
    });
    expect(request).toHaveBeenCalledTimes(stopOnExpiration ? 1 : 2);
  },
);

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
    const result = PurchaseOperationHelper.pollOperationSession(
      backend,
      "operation",
      { waitTimeoutMs: 1000 },
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
    PurchaseOperationHelper.pollOperationSession(backend, "operation", {
      waitTimeoutMs: 0,
    }),
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
    PurchaseOperationHelper.pollOperationSession(backend, "operation", {
      maxAttempts: 3,
    }),
  ).rejects.toBeInstanceOf(PurchasesError);
  expect(request).toHaveBeenCalledOnce();
});
