import { describe, expect, test } from "vitest";
import { configurePurchases } from "./base.purchases_test";
import { APIPostRequest } from "./test-responses";

const waitSomeTime = async (howMuch: number) => {
  // events fire and forget so we need to wait for them to be processed
  // in order to check they have been flushed
  const waitPromise = new Promise((resolve) => setTimeout(resolve, howMuch));
  await waitPromise;
};

describe("Purchases.configure()", () => {
  test("tracks the SDKInitialized event", async () => {
    configurePurchases();
    await waitSomeTime(2000);
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
  }, 10000);
});
