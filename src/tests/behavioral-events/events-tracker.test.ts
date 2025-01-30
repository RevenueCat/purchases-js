import { afterEach, beforeEach, describe, expect, vi } from "vitest";
import { server, testApiKey } from "../base.purchases_test";
import { APIPostRequest, eventsURL } from "../test-responses";
import { http, HttpResponse } from "msw";
import "../utils/to-have-been-called-exactly-once-with";
import { Logger } from "../../helpers/logger";
import EventsTracker from "../../behavioural-events/events-tracker";

interface EventsTrackerFixtures {
  eventsTracker: EventsTracker;
}

describe("EventsTracker", (test) => {
  const date = new Date(1988, 10, 18, 13, 37, 0);
  vi.mock("uuid", () => ({
    v4: () => "c1365463-ce59-4b83-b61b-ef0d883e9047",
  }));
  const loggerMock = vi
    .spyOn(Logger, "debugLog")
    .mockImplementation(() => undefined);

  beforeEach<EventsTrackerFixtures>((context) => {
    context.eventsTracker = new EventsTracker(testApiKey);
    vi.useFakeTimers();
    vi.setSystemTime(date);
  });

  afterEach<EventsTrackerFixtures>((context) => {
    loggerMock.mockReset();
    vi.useRealTimers();
    context.eventsTracker.dispose();
  });

  function trackCheckoutSessionStart(eventsTracker: EventsTracker) {
    eventsTracker.trackCheckoutSessionStart({
      appUserId: "someAppUserId",
      userIsAnonymous: false,
      customizationOptions: {
        colorButtonsPrimary: "#000000",
        colorAccent: "#000000",
        colorError: "#000000",
        colorProductInfoBg: "#000000",
        colorFormBg: "#000000",
        colorPageBg: "#000000",
        font: "Arial",
        shapes: "rounded",
        showProductDescription: true,
      },
      productInterval: "monthly",
      productPrice: 10,
      productCurrency: "USD",
      selectedProduct: "product1",
      selectedPackage: "package1",
      selectedPurchaseOption: "purchase_option1",
    });
  }

  test<EventsTrackerFixtures>("tracks the SDKInitialized event", async ({
    eventsTracker,
  }) => {
    eventsTracker.trackSDKInitialized({
      appUserId: "someAppUserId",
      userIsAnonymous: false,
    });

    await vi.advanceTimersToNextTimerAsync();

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

  test<EventsTrackerFixtures>("tracks the CheckoutSessionStart event", async ({
    eventsTracker,
  }) => {
    trackCheckoutSessionStart(eventsTracker);
    await vi.advanceTimersToNextTimerAsync();

    expect(APIPostRequest).toHaveBeenCalledWith({
      url: "http://localhost:8000/v1/events",
      json: {
        events: [
          {
            id: "c1365463-ce59-4b83-b61b-ef0d883e9047",
            checkout_session_id: "c1365463-ce59-4b83-b61b-ef0d883e9047",
            type: "web_billing_checkout_session_start",
            trace_id: "c1365463-ce59-4b83-b61b-ef0d883e9047",
            timestamp_ms: date.getTime(),
            app_user_id: "someAppUserId",
            user_is_anonymous: false,
            customization_options: {
              color_buttons_primary: "#000000",
              color_accent: "#000000",
              color_error: "#000000",
              color_product_info_bg: "#000000",
              color_form_bg: "#000000",
              color_page_bg: "#000000",
              font: "Arial",
              shapes: "rounded",
              show_product_description: true,
            },
            product_interval: "monthly",
            product_price: 10,
            product_currency: "USD",
            selected_product: "product1",
            selected_package: "package1",
            selected_purchase_option: "purchase_option1",
          },
        ],
      },
    });
  });

  test<EventsTrackerFixtures>("tracks the BillingEmailEntryImpression event", async ({
    eventsTracker,
  }) => {
    trackCheckoutSessionStart(eventsTracker);
    loggerMock.mockClear();
    APIPostRequest.mockClear();
    eventsTracker.trackBillingEmailEntryImpression({
      appUserId: "someAppUserId",
      userIsAnonymous: false,
    });

    await vi.advanceTimersToNextTimerAsync();

    expect(APIPostRequest).toHaveBeenCalledWith({
      url: "http://localhost:8000/v1/events",
      json: {
        events: [
          {
            id: "c1365463-ce59-4b83-b61b-ef0d883e9047",
            type: "web_billing_billing_email_entry_impression",
            trace_id: "c1365463-ce59-4b83-b61b-ef0d883e9047",
            timestamp_ms: date.getTime(),
            app_user_id: "someAppUserId",
            user_is_anonymous: false,
            checkout_session_id: "c1365463-ce59-4b83-b61b-ef0d883e9047",
          },
        ],
      },
    });
  });

  test<EventsTrackerFixtures>("tracks the BillingEmailEntrySubmit event", async ({
    eventsTracker,
  }) => {
    trackCheckoutSessionStart(eventsTracker);
    loggerMock.mockClear();
    APIPostRequest.mockClear();
    eventsTracker.trackBillingEmailEntrySubmit({
      appUserId: "someAppUserId",
      userIsAnonymous: false,
    });

    await vi.advanceTimersToNextTimerAsync();

    expect(APIPostRequest).toHaveBeenCalledWith({
      url: "http://localhost:8000/v1/events",
      json: {
        events: [
          {
            id: "c1365463-ce59-4b83-b61b-ef0d883e9047",
            type: "web_billing_billing_email_entry_submit",
            trace_id: "c1365463-ce59-4b83-b61b-ef0d883e9047",
            timestamp_ms: date.getTime(),
            app_user_id: "someAppUserId",
            user_is_anonymous: false,
            checkout_session_id: "c1365463-ce59-4b83-b61b-ef0d883e9047",
          },
        ],
      },
    });
  });

  test<EventsTrackerFixtures>("tracks the BillingEmailEntryError event", async ({
    eventsTracker,
  }) => {
    trackCheckoutSessionStart(eventsTracker);
    loggerMock.mockClear();
    APIPostRequest.mockClear();
    eventsTracker.trackBillingEmailEntryError({
      appUserId: "someAppUserId",
      userIsAnonymous: false,
      errorCode: 8,
      errorMessage: "someErrorMessage",
    });

    await vi.advanceTimersToNextTimerAsync();

    expect(APIPostRequest).toHaveBeenCalledWith({
      url: "http://localhost:8000/v1/events",
      json: {
        events: [
          {
            id: "c1365463-ce59-4b83-b61b-ef0d883e9047",
            type: "web_billing_billing_email_entry_error",
            trace_id: "c1365463-ce59-4b83-b61b-ef0d883e9047",
            timestamp_ms: date.getTime(),
            app_user_id: "someAppUserId",
            user_is_anonymous: false,
            checkout_session_id: "c1365463-ce59-4b83-b61b-ef0d883e9047",
            error_code: 8,
            error_message: "someErrorMessage",
          },
        ],
      },
    });
  });

  test<EventsTrackerFixtures>("tracks the BillingEmailEntryDismiss event", async ({
    eventsTracker,
  }) => {
    trackCheckoutSessionStart(eventsTracker);
    loggerMock.mockClear();
    APIPostRequest.mockClear();
    eventsTracker.trackBillingEmailEntryDismiss({
      appUserId: "someAppUserId",
      userIsAnonymous: false,
    });

    await vi.advanceTimersToNextTimerAsync();

    expect(APIPostRequest).toHaveBeenCalledWith({
      url: "http://localhost:8000/v1/events",
      json: {
        events: [
          {
            id: "c1365463-ce59-4b83-b61b-ef0d883e9047",
            type: "web_billing_billing_email_entry_dismiss",
            trace_id: "c1365463-ce59-4b83-b61b-ef0d883e9047",
            timestamp_ms: date.getTime(),
            app_user_id: "someAppUserId",
            user_is_anonymous: false,
            checkout_session_id: "c1365463-ce59-4b83-b61b-ef0d883e9047",
          },
        ],
      },
    });
  });

  test<EventsTrackerFixtures>("retries tracking events exponentially", async ({
    eventsTracker,
  }) => {
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

    eventsTracker.trackSDKInitialized({
      appUserId: "someAppUserId",
      userIsAnonymous: false,
    });

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

  test<EventsTrackerFixtures>("retries tracking events accumulating them if there are errors", async ({
    eventsTracker,
  }) => {
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

    for (let i = 0; i < 4; i++) {
      eventsTracker.trackSDKInitialized({
        appUserId: "someAppUserId",
        userIsAnonymous: false,
      });
    }

    await vi.advanceTimersByTimeAsync(1000 + 2000 + 4000 + 8000);
    expect(loggerMock).toHaveBeenCalledWith("Events flushed successfully");
  });

  test<EventsTrackerFixtures>("retries tracking events exponentially", async ({
    eventsTracker,
  }) => {
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

    eventsTracker.trackSDKInitialized({
      appUserId: "someAppUserId",
      userIsAnonymous: false,
    });

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

  test<EventsTrackerFixtures>("does not lose events due to race conditions on the request", async ({
    eventsTracker,
  }) => {
    const eventPayloadSpy = vi.fn();
    let attempts = 0;

    server.use(
      http.post(eventsURL, async ({ request }) => {
        ++attempts;

        const json = await request.json();
        eventPayloadSpy(json);

        if (attempts === 1) {
          setTimeout(
            () =>
              eventsTracker.trackSDKInitialized({
                appUserId: "someAppUserId",
                userIsAnonymous: false,
              }),
            1_000,
          );
          await new Promise((resolve) => setTimeout(resolve, 10_000));
          return new HttpResponse(null, { status: 201 });
        }

        return HttpResponse.json(null, { status: 201 });
      }),
    );

    eventsTracker.trackSDKInitialized({
      appUserId: "someAppUserId",
      userIsAnonymous: false,
    });

    await vi.runAllTimersAsync();

    expect(eventPayloadSpy).toHaveBeenNthCalledWith(1, {
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
    });

    expect(eventPayloadSpy).toHaveBeenNthCalledWith(2, {
      events: [
        {
          id: "c1365463-ce59-4b83-b61b-ef0d883e9047",
          type: "web_billing_sdk_initialized",
          trace_id: "c1365463-ce59-4b83-b61b-ef0d883e9047",
          timestamp_ms: date.getTime() + 1_000,
          sdk_version: "0.15.1",
          app_user_id: "someAppUserId",
          user_is_anonymous: false,
        },
      ],
    });
  });
});
