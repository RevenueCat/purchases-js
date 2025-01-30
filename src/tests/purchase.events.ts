import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { configurePurchases } from "./base.purchases_test";
import { APIPostRequest } from "./test-responses";
import "./utils/to-have-been-called-exactly-once-with";
import { Logger } from "../helpers/logger";

describe("Purchases.configure()", () => {
  const date = new Date(1988, 10, 18, 13, 37, 0);
  vi.mock("uuid", () => ({
    v4: () => "c1365463-ce59-4b83-b61b-ef0d883e9047",
  }));
  const loggerMock = vi
    .spyOn(Logger, "debugLog")
    .mockImplementation(() => undefined);

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(date);
    configurePurchases();
    await vi.advanceTimersToNextTimerAsync();
  });

  afterEach(() => {
    loggerMock.mockReset();
    vi.useRealTimers();
  });

  test("tracks the SDKInitialized event upon configuration of the SDK", async () => {
    expect(APIPostRequest).toHaveBeenCalledWith({
      url: "http://localhost:8000/v1/events",
      json: {
        events: [
          {
            id: "c1365463-ce59-4b83-b61b-ef0d883e9047",
            type: "web_billing_sdk_initialized",
            trace_id: "c1365463-ce59-4b83-b61b-ef0d883e9047",
            timestamp_ms: date.getTime(),
            sdk_version: "0.15.1",
            app_user_id: "someAppUserId",
            user_is_anonymous: false,
          },
        ],
      },
    });
  });
});
