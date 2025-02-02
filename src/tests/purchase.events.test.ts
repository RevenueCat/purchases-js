import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { configurePurchases } from "./base.purchases_test";
import { APIPostRequest } from "./test-responses";
import "./utils/to-have-been-called-exactly-once-with";
import { Logger } from "../helpers/logger";
import { Purchases } from "../main";

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
            type: "web_billing",
            event_name: "sdk_initialized",
            timestamp_ms: date.getTime(),
            app_user_id: "someAppUserId",
            properties: {
              checkout_session_id: null,
              sdk_version: "0.15.1",
              trace_id: "c1365463-ce59-4b83-b61b-ef0d883e9047",
            },
          },
        ],
      },
    });
  });

  test("tracks the CheckoutSessionStarted event upon starting a purchase", async () => {
    const purchases = Purchases.getSharedInstance();
    const offerings = await purchases.getOfferings();
    const packageToBuy = offerings.current?.availablePackages[0];

    // Currently we hold on the purchase UI, so we add a timeout to not hold the test forever.
    // We're just checking that the request happened as expected.
    purchases.purchase({
      rcPackage: packageToBuy!,
    });

    await vi.advanceTimersToNextTimerAsync();

    expect(APIPostRequest).toHaveBeenCalledWith({
      url: "http://localhost:8000/v1/events",
      json: {
        events: [
          {
            id: "c1365463-ce59-4b83-b61b-ef0d883e9047",
            type: "web_billing",
            event_name: "checkout_session_start",
            timestamp_ms: date.getTime(),
            user: {
              app_user_id: "someAppUserId",
              user_is_anonymous: false,
            },
            properties: {
              trace_id: "c1365463-ce59-4b83-b61b-ef0d883e9047",
              checkout_session_id: "c1365463-ce59-4b83-b61b-ef0d883e9047",
              customer_email_provided: false,
              customization_options: null,
              product_currency: "USD",
              product_interval: "P1M",
              product_price: 3000000,
              selected_package: "$rc_monthly",
              selected_product: "monthly",
              selected_purchase_option: "base_option",
            },
          },
        ],
      },
    });
  });
});
