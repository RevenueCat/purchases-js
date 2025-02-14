import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { configurePurchases } from "./base.purchases_test";
import { APIPostRequest } from "./test-responses";
import "./utils/to-have-been-called-exactly-once-with";
import { Logger } from "../helpers/logger";
import { ErrorCode, Purchases, PurchasesError } from "../main";
import { mount } from "svelte";

vi.mock("svelte", () => ({
  mount: vi.fn(),
}));

vi.mock("uuid", () => ({
  v4: () => "c1365463-ce59-4b83-b61b-ef0d883e9047",
}));

describe("Purchases.configure()", () => {
  const date = new Date(1988, 10, 18, 13, 37, 0);

  beforeEach(async () => {
    vi.spyOn(Logger, "debugLog").mockImplementation(() => undefined);
    vi.mock("../behavioural-events/sdk-event-context", () => ({
      buildEventContext: vi.fn().mockReturnValue({}),
    }));
    vi.useFakeTimers();
    vi.setSystemTime(date);
    configurePurchases();
    await vi.advanceTimersToNextTimerAsync();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
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
            context: {},
            properties: {
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
            app_user_id: "someAppUserId",
            context: {},
            properties: {
              trace_id: "c1365463-ce59-4b83-b61b-ef0d883e9047",
              customer_email_provided_by_developer: false,
              customization_color_buttons_primary: null,
              customization_color_accent: null,
              customization_color_error: null,
              customization_color_product_info_bg: null,
              customization_color_form_bg: null,
              customization_color_page_bg: null,
              customization_font: null,
              customization_shapes: null,
              customization_show_product_description: null,
              product_currency: "USD",
              product_interval: "P1M",
              product_price: 3000000,
              selected_package_id: "$rc_monthly",
              selected_product_id: "monthly",
              selected_purchase_option: "base_option",
            },
          },
        ],
      },
    });
  });

  test("tracks the CheckoutSessionEnded event upon finishing a purchase", async () => {
    vi.mocked(mount).mockImplementation((_component, options) => {
      options.props?.onFinished("test-operation-session-id", null);
      return vi.fn();
    });

    const purchases = Purchases.getSharedInstance();
    const offerings = await purchases.getOfferings();
    const packageToBuy = offerings.current?.availablePackages[0];

    await purchases.purchase({
      rcPackage: packageToBuy!,
    });

    await vi.advanceTimersToNextTimerAsync();

    expect(APIPostRequest).toHaveBeenLastCalledWith({
      url: "http://localhost:8000/v1/events",
      json: {
        events: [
          {
            id: "c1365463-ce59-4b83-b61b-ef0d883e9047",
            type: "web_billing",
            event_name: "checkout_session_end",
            timestamp_ms: date.getTime(),
            app_user_id: "someAppUserId",
            context: {},
            properties: {
              trace_id: "c1365463-ce59-4b83-b61b-ef0d883e9047",
              outcome: "finished",
              with_redemption_info: false,
            },
          },
        ],
      },
    });
  });

  test("tracks the CheckoutSessionEnded event upon closing a purchase", async () => {
    vi.mocked(mount).mockImplementation((_component, options) => {
      options.props?.onClose();
      return vi.fn();
    });

    const purchases = Purchases.getSharedInstance();
    const offerings = await purchases.getOfferings();
    const packageToBuy = offerings.current?.availablePackages[0];

    try {
      await purchases.purchase({
        rcPackage: packageToBuy!,
      });
    } catch (error) {
      if (!(error instanceof PurchasesError)) {
        throw error;
      }
    }

    await vi.advanceTimersToNextTimerAsync();

    expect(APIPostRequest).toHaveBeenLastCalledWith({
      url: "http://localhost:8000/v1/events",
      json: {
        events: [
          {
            id: "c1365463-ce59-4b83-b61b-ef0d883e9047",
            type: "web_billing",
            event_name: "checkout_session_end",
            timestamp_ms: date.getTime(),
            app_user_id: "someAppUserId",
            context: {},
            properties: {
              trace_id: "c1365463-ce59-4b83-b61b-ef0d883e9047",
              outcome: "closed",
            },
          },
        ],
      },
    });
  });

  test("tracks the CheckoutSessionEnded event upon erroring a purchase", async () => {
    vi.mocked(mount).mockImplementation((_component, options) => {
      options.props?.onError(
        new PurchasesError(ErrorCode.UnknownError, "Unexpected error"),
      );
      return vi.fn();
    });

    const purchases = Purchases.getSharedInstance();
    const offerings = await purchases.getOfferings();
    const packageToBuy = offerings.current?.availablePackages[0];

    try {
      await purchases.purchase({
        rcPackage: packageToBuy!,
      });
    } catch (error) {
      if (!(error instanceof PurchasesError)) {
        throw error;
      }
    }

    await vi.advanceTimersToNextTimerAsync();

    expect(APIPostRequest).toHaveBeenLastCalledWith({
      url: "http://localhost:8000/v1/events",
      json: {
        events: [
          {
            id: "c1365463-ce59-4b83-b61b-ef0d883e9047",
            type: "web_billing",
            event_name: "checkout_session_end",
            timestamp_ms: date.getTime(),
            app_user_id: "someAppUserId",
            context: {},
            properties: {
              trace_id: "c1365463-ce59-4b83-b61b-ef0d883e9047",
              outcome: "errored",
              error_code: "0",
              error_message: "Unexpected error",
            },
          },
        ],
      },
    });
  });
});
