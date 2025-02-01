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
    context.eventsTracker = new EventsTracker({
      apiKey: testApiKey,
      appUserId: "someAppUserId",
      userIsAnonymous: false,
    });
    vi.useFakeTimers();
    vi.setSystemTime(date);
  });

  afterEach<EventsTrackerFixtures>((context) => {
    loggerMock.mockReset();
    vi.useRealTimers();
    context.eventsTracker.dispose();
  });

  test<EventsTrackerFixtures>("sends the serialized event", async ({
    eventsTracker,
  }) => {
    eventsTracker.trackEvent({
      eventName: "sdk_initialized",
      properties: { a: "b" },
    });
    await vi.advanceTimersToNextTimerAsync();

    expect(APIPostRequest).toHaveBeenCalledWith({
      url: eventsURL,
      json: {
        events: [
          {
            id: "c1365463-ce59-4b83-b61b-ef0d883e9047",
            type: "web_billing",
            timestamp_ms: date.getTime(),
            event_name: "sdk_initialized",
            user: {
              app_user_id: "someAppUserId",
              user_is_anonymous: false,
            },
            properties: {
              a: "b",
              trace_id: "c1365463-ce59-4b83-b61b-ef0d883e9047",
              checkout_session_id: null,
            },
          },
        ],
      },
    });
  });

  test<EventsTrackerFixtures>("passes the user props to the event", async ({
    eventsTracker,
  }) => {
    eventsTracker.updateUser({
      appUserId: "newAppUserId",
      userIsAnonymous: true,
    });
    eventsTracker.trackEvent({
      eventName: "sdk_initialized",
      properties: { a: "b" },
    });
    await vi.advanceTimersToNextTimerAsync();

    expect(APIPostRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        json: expect.objectContaining({
          events: expect.arrayContaining([
            expect.objectContaining({
              user: {
                app_user_id: "newAppUserId",
                user_is_anonymous: true,
              },
            }),
          ]),
        }),
      }),
    );
  });

  test<EventsTrackerFixtures>("passes the checkout session id to the event", async ({
    eventsTracker,
  }) => {
    eventsTracker.generateCheckoutSessionId();
    eventsTracker.trackEvent({
      eventName: "sdk_initialized",
      properties: { a: "b" },
    });
    await vi.advanceTimersToNextTimerAsync();

    expect(APIPostRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        json: expect.objectContaining({
          events: expect.arrayContaining([
            expect.objectContaining({
              properties: expect.objectContaining({
                checkout_session_id: expect.any(String),
              }),
            }),
          ]),
        }),
      }),
    );
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

    eventsTracker.trackEvent({
      eventName: "sdk_initialized",
      properties: { a: "b" },
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
      eventsTracker.trackEvent({
        eventName: "sdk_initialized",
        properties: { a: "b" },
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

    eventsTracker.trackEvent({
      eventName: "sdk_initialized",
      properties: { a: "b" },
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
              eventsTracker.trackEvent({
                eventName: "checkout_session_start",
                properties: { a: "b" },
              }),
            1_000,
          );
          await new Promise((resolve) => setTimeout(resolve, 10_000));
          return new HttpResponse(null, { status: 201 });
        }

        return HttpResponse.json(null, { status: 201 });
      }),
    );

    eventsTracker.trackEvent({
      eventName: "sdk_initialized",
      properties: { a: "b" },
    });

    await vi.runAllTimersAsync();

    expect(eventPayloadSpy).toHaveBeenNthCalledWith(1, {
      events: expect.arrayContaining([
        expect.objectContaining({
          event_name: "sdk_initialized",
          timestamp_ms: date.getTime(),
        }),
      ]),
    });

    expect(eventPayloadSpy).toHaveBeenNthCalledWith(2, {
      events: expect.arrayContaining([
        expect.objectContaining({
          event_name: "checkout_session_start",
          timestamp_ms: date.getTime() + 1_000,
        }),
      ]),
    });
  });
});
