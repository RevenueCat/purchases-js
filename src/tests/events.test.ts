import { afterAll, describe, expect, test, vi } from "vitest";
import { server, configurePurchases } from "./base.purchases_test";
import { APIPostRequest, eventsURL } from "./test-responses";
import { http, HttpResponse } from "msw";

describe("Purchases.configure()", () => {
  const consoleMock = vi
    .spyOn(console, "debug")
    .mockImplementation(() => undefined);

  afterAll(() => {
    consoleMock.mockReset();
  });

  test("tracks the SDKInitialized event", async () => {
    configurePurchases();

    await vi.waitFor(() => {
      expect(consoleMock).toHaveBeenCalledWith("Events flushed successfully");
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

  test("ignores request errors when tracking the events", async () => {
    server.use(
      http.post(eventsURL, async () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    configurePurchases();

    await vi.waitFor(() =>
      expect(consoleMock).toHaveBeenCalledWith(
        "Events failed to flush due to server error",
      ),
    );
  });
});
