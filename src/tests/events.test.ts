import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { server, configurePurchases } from "./base.purchases_test";
import { APIPostRequest, eventsURL } from "./test-responses";
import { http, HttpResponse } from "msw";
import "./utils/to-have-been-called-exactly-once-with";

describe("Purchases.configure()", () => {
  const consoleMock = vi
    .spyOn(console, "debug")
    .mockImplementation(() => undefined);

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    consoleMock.mockReset();
    vi.useRealTimers();
  });

  test("tracks the SDKInitialized event", async () => {
    configurePurchases();

    await vi.waitFor(() => {
      expect(consoleMock).toHaveBeenCalledExactlyOnceWith(
        "Events flushed successfully",
      );
      expect(APIPostRequest).toHaveBeenCalledWith({
        url: "http://localhost:8000/v1/events",
        json: {
          events: [
            {
              type: "rc_billing_event",
              event_name: "SDK_INITIALIZED",
              sdk_version: "0.15.1",
            },
          ],
        },
      });
    });
  });

  test("retries tracking events the request to the server is unsuccessful", async () => {
    let attempts = 0;

    server.use(
      http.post(eventsURL, async () => {
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
            return HttpResponse.json({}, { status: 201 });
          default:
            throw new Error("Unexpected call");
        }
      }),
    );

    configurePurchases();

    // Attempt 1: First direct attempt to flush without timeout
    await vi.advanceTimersByTimeAsync(100);
    expect(consoleMock).toHaveBeenCalledExactlyOnceWith(
      "Events failed to flush due to server error",
    );
    consoleMock.mockClear();

    // Attempt 2: Wait for next flush 4_000
    await vi.advanceTimersByTimeAsync(4_000);
    expect(consoleMock).not.toHaveBeenCalledWith(
      "Events failed to flush due to server error",
    );
    consoleMock.mockClear();

    // Attempt 2: Wait for request to complete 1_000
    await vi.advanceTimersByTimeAsync(1_000);
    expect(consoleMock).toHaveBeenCalledExactlyOnceWith(
      "Events failed to flush due to server error",
    );
    consoleMock.mockClear();

    // Attempt 3: Wait for next flush 8_000
    await vi.advanceTimersByTimeAsync(8_000);
    expect(consoleMock).not.toHaveBeenCalledWith(
      "Events failed to flush due to server error",
    );
    consoleMock.mockClear();

    // Attempt 3: Wait for request to complete 20_000
    await vi.advanceTimersByTimeAsync(20_000);
    expect(consoleMock).toHaveBeenCalledExactlyOnceWith(
      "Events failed to flush due to server error",
    );
    consoleMock.mockClear();

    // Attempt 4: Wait for next flush 16_000
    await vi.advanceTimersByTimeAsync(16_000);
    await vi.waitFor(() => {
      expect(consoleMock).toHaveBeenCalledWith("Events flushed successfully");
    });
  });
});
