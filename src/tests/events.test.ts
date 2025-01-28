import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { server, configurePurchases } from "./base.purchases_test";
import { APIPostRequest, eventsURL } from "./test-responses";
import { http, HttpResponse } from "msw";
import "./utils/to-have-been-called-exactly-once-with";
import { Logger } from "../helpers/logger";
import { type Purchases } from "../main";

describe("Purchases.configure()", () => {
  const date = new Date(1988, 10, 18, 13, 37, 0);
  vi.mock("uuid", () => ({
    v4: () => "c1365463-ce59-4b83-b61b-ef0d883e9047",
  }));
  const loggerMock = vi
    .spyOn(Logger, "debugLog")
    .mockImplementation((params) => console.log(params));

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(date);
  });

  afterEach(() => {
    loggerMock.mockReset();
    vi.useRealTimers();
  });

  test("tracks the SDKInitialized event", async () => {
    configurePurchases();

    await vi.advanceTimersToNextTimerAsync();

    await vi.waitFor(() => {
      expect(loggerMock).toHaveBeenCalledExactlyOnceWith(
        "Events flushed successfully",
      );
      expect(APIPostRequest).toHaveBeenCalledWith({
        url: "http://localhost:8000/v1/events",
        json: {
          events: [
            {
              id: "c1365463-ce59-4b83-b61b-ef0d883e9047",
              type: "web_billing_sdk_initialized",
              trace_id: "c1365463-ce59-4b83-b61b-ef0d883e9047",
              trace_index: 0,
              timestamp: date.getTime(),
              sdk_version: "0.15.1",
              app_user_id: "someAppUserId",
            },
          ],
        },
      });
    });
  });

  test("retries tracking events exponentially", async () => {
    let attempts = 0;

    server.use(
      http.post(eventsURL, async ({ request }) => {
        ++attempts;

        switch (attempts) {
          case 1:
            return new HttpResponse(null, { status: 500 });
          case 2:
            await new Promise((resolve) => setTimeout(resolve, 1_000));
            throw new Error("Unexpected error");
          case 3:
            await new Promise((resolve) => setTimeout(resolve, 20_000));
            throw new Error("Unexpected error");
          case 4:
            return HttpResponse.json(await request.json(), { status: 201 });
          default:
            throw new Error("Unexpected call");
        }
      }),
    );

    configurePurchases();

    // Attempt 1: First direct attempt to flush without timeout
    await vi.advanceTimersByTimeAsync(100);
    expect(loggerMock).not.toHaveBeenCalledWith("Events flushed successfully");
    loggerMock.mockClear();

    // Attempt 2: Wait for next flush
    await vi.advanceTimersByTimeAsync(2_000);
    expect(loggerMock).not.toHaveBeenCalledWith("Events flushed successfully");
    loggerMock.mockClear();

    // Attempt 2: Wait for request to complete
    await vi.advanceTimersByTimeAsync(1_000);
    expect(loggerMock).not.toHaveBeenCalledWith("Events flushed successfully");
    loggerMock.mockClear();

    // Attempt 3: Wait for next flush
    await vi.advanceTimersByTimeAsync(4_000);
    expect(loggerMock).not.toHaveBeenCalledWith("Events flushed successfully");
    loggerMock.mockClear();

    // Attempt 3: Wait for request to complete
    await vi.advanceTimersByTimeAsync(20_000);
    expect(loggerMock).not.toHaveBeenCalledWith("Events flushed successfully");
    loggerMock.mockClear();

    // Attempt 4: Wait for next flush
    await vi.advanceTimersByTimeAsync(8_000);
    expect(loggerMock).toHaveBeenCalledWith("Events flushed successfully");
  });

  test("retries tracking events accumulating them if there are errors", async () => {
    let attempts = 0;

    server.use(
      http.post(eventsURL, async ({ request }) => {
        ++attempts;

        if (attempts < 4) {
          return new HttpResponse(null, { status: 500 });
        }

        const json = (await request.json()) as Record<string, Array<unknown>>;
        if (json.events?.length === 4) {
          return HttpResponse.json(json, { status: 201 });
        }

        return new HttpResponse(null, { status: 500 });
      }),
    );

    const purchases = configurePurchases();
    for (let i = 0; i < 3; i++) {
      // @ts-expect-error "no way to fire an extra event for testing"
      purchases.eventsTracker.trackSDKInitialized("someAppUserId");
    }

    await vi.advanceTimersByTimeAsync(1000 + 2000 + 4000 + 8000);
    expect(loggerMock).toHaveBeenCalledWith("Events flushed successfully");
  });

  test("retries tracking events exponentially", async () => {
    let attempts = 0;

    server.use(
      http.post(eventsURL, async ({ request }) => {
        ++attempts;

        switch (attempts) {
          case 1:
            return new HttpResponse(null, { status: 500 });
          case 2:
            await new Promise((resolve) => setTimeout(resolve, 1_000));
            throw new Error("Unexpected error");
          case 3:
            await new Promise((resolve) => setTimeout(resolve, 20_000));
            throw new Error("Unexpected error");
          case 4:
            return HttpResponse.json(await request.json(), { status: 201 });
          default:
            throw new Error("Unexpected call");
        }
      }),
    );

    configurePurchases();

    // Attempt 1: First direct attempt to flush without timeout
    await vi.advanceTimersByTimeAsync(100);
    expect(loggerMock).not.toHaveBeenCalledWith("Events flushed successfully");
    loggerMock.mockClear();

    // Attempt 2: Wait for next flush
    await vi.advanceTimersByTimeAsync(2_000);
    expect(loggerMock).not.toHaveBeenCalledWith("Events flushed successfully");
    loggerMock.mockClear();

    // Attempt 2: Wait for request to complete
    await vi.advanceTimersByTimeAsync(1_000);
    expect(loggerMock).not.toHaveBeenCalledWith("Events flushed successfully");
    loggerMock.mockClear();

    // Attempt 3: Wait for next flush
    await vi.advanceTimersByTimeAsync(4_000);
    expect(loggerMock).not.toHaveBeenCalledWith("Events flushed successfully");
    loggerMock.mockClear();

    // Attempt 3: Wait for request to complete
    await vi.advanceTimersByTimeAsync(20_000);
    expect(loggerMock).not.toHaveBeenCalledWith("Events flushed successfully");
    loggerMock.mockClear();

    // Attempt 4: Wait for next flush
    await vi.advanceTimersByTimeAsync(8_000);
    expect(loggerMock).toHaveBeenCalledWith("Events flushed successfully");
  });

  test("does not lose events due to race conditions on the request", async () => {
    const eventPayloadSpy = vi.fn();
    let attempts = 0;
    let purchases: Purchases | null = null;

    server.use(
      http.post(eventsURL, async ({ request }) => {
        ++attempts;

        const json = await request.json();
        eventPayloadSpy(json);

        if (attempts === 1) {
          setTimeout(
            // @ts-expect-error "no way to fire an extra event for testing"
            () => purchases.eventsTracker.trackSDKInitialized("someAppUserId"),
            1_000,
          );
          await new Promise((resolve) => setTimeout(resolve, 10_000));
          return new HttpResponse(null, { status: 201 });
        }

        return HttpResponse.json(null, { status: 201 });
      }),
    );

    purchases = configurePurchases();

    await vi.runAllTimersAsync();

    expect(eventPayloadSpy).toHaveBeenNthCalledWith(1, {
      events: [
        {
          id: "c1365463-ce59-4b83-b61b-ef0d883e9047",
          type: "web_billing_sdk_initialized",
          trace_id: "c1365463-ce59-4b83-b61b-ef0d883e9047",
          trace_index: 0,
          timestamp: date.getTime(),
          sdk_version: "0.15.1",
          app_user_id: "someAppUserId",
        },
      ],
    });

    expect(eventPayloadSpy).toHaveBeenNthCalledWith(2, {
      events: [
        {
          id: "c1365463-ce59-4b83-b61b-ef0d883e9047",
          type: "web_billing_sdk_initialized",
          trace_id: "c1365463-ce59-4b83-b61b-ef0d883e9047",
          trace_index: 1,
          timestamp: date.getTime() + 1_000,
          sdk_version: "0.15.1",
          app_user_id: "someAppUserId",
        },
      ],
    });
  });
});
