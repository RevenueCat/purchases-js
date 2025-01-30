import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { configurePurchases } from "./base.purchases_test";
import { APIPostRequest } from "./test-responses";
import "./utils/to-have-been-called-exactly-once-with";
import { Logger } from "../helpers/logger";
import type { Purchases } from "../main";

describe("Purchases.configure()", () => {
  let purchases: Purchases;
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
    purchases = configurePurchases();
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

  test("tracks the CheckoutSessionStart event upon starting the purchase flow", async () => {
    loggerMock.mockReset();
    APIPostRequest.mockReset();

    const offerings = await purchases.getOfferings();
    const packageToBuy = offerings.current!.availablePackages[0];
    const productToBuy = packageToBuy!.rcBillingProduct;

    purchases.purchase({ rcPackage: packageToBuy! });
    await vi.advanceTimersToNextTimerAsync();

    expect(APIPostRequest).toHaveBeenCalledWith({
      url: "http://localhost:8000/v1/events",
      json: {
        events: [
          {
            id: "c1365463-ce59-4b83-b61b-ef0d883e9047",
            type: "web_billing_checkout_session_start",
            trace_id: "c1365463-ce59-4b83-b61b-ef0d883e9047",
            timestamp_ms: date.getTime(),
            app_user_id: "someAppUserId",
            user_is_anonymous: false,
            checkout_session_id: "c1365463-ce59-4b83-b61b-ef0d883e9047",
            customization_options: null,
            product_currency: productToBuy.currentPrice.currency,
            product_interval: productToBuy.normalPeriodDuration,
            product_price: productToBuy.currentPrice.amountMicros,
            selected_package: packageToBuy.identifier,
            selected_product: productToBuy.identifier,
            selected_purchase_option: productToBuy.defaultPurchaseOption!.id,
          },
        ],
      },
    });
  });
});
