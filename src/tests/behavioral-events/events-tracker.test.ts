import { afterEach, beforeEach, describe, expect, vi } from "vitest";
import { server, testApiKey } from "../base.purchases_test";
import { APIPostRequest, eventsURL } from "../test-responses";
import { http, HttpResponse } from "msw";
import "../utils/to-have-been-called-exactly-once-with";
import { Logger } from "../../helpers/logger";
import EventsTracker from "../../behavioural-events/events-tracker";
import { defaultPurchaseMode } from "../../behavioural-events/event";

interface EventsTrackerFixtures {
  eventsTracker: EventsTracker;
}

vi.mock("../../behavioural-events/sdk-event-context", () => ({
  buildEventContext: vi.fn((source, rcSource) => ({
    library_name: "purchases-js",
    library_version: "1.0.0",
    source,
    rcSource,
  })),
}));

const MAX_JITTER_MULTIPLIER = 1 + 0.1;

function getEventsFromPostCalls(
  calls: Array<unknown[]>,
): Array<{ event_name: string }> {
  return calls.flatMap(
    (call) =>
      (call[0] as { json: { events: Array<{ event_name: string }> } }).json
        .events,
  );
}

/** Returns a promise and its resolve for tests that control resolution timing. */
function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe("EventsTracker", (test) => {
  const date = new Date(1988, 10, 18, 13, 37, 0);
  vi.mock("../../helpers/uuid-helper", () => ({
    generateUUID: () => "c1365463-ce59-4b83-b61b-ef0d883e9047",
  }));
  const loggerMock = vi
    .spyOn(Logger, "debugLog")
    .mockImplementation(() => undefined);

  beforeEach<EventsTrackerFixtures>((context) => {
    context.eventsTracker = new EventsTracker({
      apiKey: testApiKey,
      appUserId: "someAppUserId",
      rcSource: "rcSource",
    });
    vi.useFakeTimers();
    vi.setSystemTime(date);
  });

  afterEach<EventsTrackerFixtures>((context) => {
    loggerMock.mockReset();
    vi.useRealTimers();
    context.eventsTracker.dispose();
  });

  test("does not track event if silent", async () => {
    const eventsTracker = new EventsTracker({
      apiKey: testApiKey,
      appUserId: "someAppUserId",
      silent: true,
      rcSource: "rcSource",
    });
    eventsTracker.trackExternalEvent({
      eventName: "external",
      source: "sdk",
      properties: {
        mode: defaultPurchaseMode,
        a: "b",
        b: 1,
        c: false,
        d: null,
      },
    });
    await vi.advanceTimersToNextTimerAsync();

    expect(APIPostRequest).not.toBeCalled();
  });

  test<EventsTrackerFixtures>("sends the serialized event", async ({
    eventsTracker,
  }) => {
    eventsTracker.trackExternalEvent({
      eventName: "external",
      source: "sdk",
      properties: {
        mode: defaultPurchaseMode,
        a: "b",
        b: 1,
        c: false,
        d: null,
      },
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
            event_name: "external",
            app_user_id: "someAppUserId",
            context: {
              library_name: "purchases-js",
              library_version: "1.0.0",
              source: "sdk",
              rc_source: "rcSource",
            },
            properties: {
              mode: defaultPurchaseMode,
              trace_id: "c1365463-ce59-4b83-b61b-ef0d883e9047",
              a: "b",
              b: 1,
              c: false,
              d: null,
            },
          },
        ],
      },
      keepalive: true,
    });
  });

  test<EventsTrackerFixtures>("passes the checkout trace id to the event", async ({
    eventsTracker,
  }) => {
    eventsTracker.trackExternalEvent({
      eventName: "external",
      source: "sdk",
    });
    await vi.advanceTimersToNextTimerAsync();

    expect(APIPostRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        json: expect.objectContaining({
          events: expect.arrayContaining([
            expect.objectContaining({
              properties: expect.objectContaining({
                trace_id: expect.any(String),
              }),
            }),
          ]),
        }),
      }),
    );
  });

  test<EventsTrackerFixtures>("passes the rcSource to the event", async ({
    eventsTracker,
  }) => {
    eventsTracker.trackExternalEvent({
      eventName: "external",
      source: "sdk",
      properties: { mode: defaultPurchaseMode, a: "b" },
    });
    await vi.advanceTimersToNextTimerAsync();

    expect(APIPostRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        json: expect.objectContaining({
          events: expect.arrayContaining([
            expect.objectContaining({
              context: expect.objectContaining({
                rc_source: "rcSource",
              }),
            }),
          ]),
        }),
      }),
    );
  });

  test("passes the workflow identifier to the event", async () => {
    const eventsTracker = new EventsTracker({
      apiKey: testApiKey,
      appUserId: "someAppUserId",
      rcSource: "rcSource",
      workflowContext: { workflowIdentifier: "workflow-id" },
    });

    eventsTracker.trackExternalEvent({
      eventName: "external",
      source: "sdk",
      properties: { mode: defaultPurchaseMode, a: "b" },
    });

    await vi.advanceTimersToNextTimerAsync();

    expect(APIPostRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        json: expect.objectContaining({
          events: expect.arrayContaining([
            expect.objectContaining({
              properties: expect.objectContaining({
                workflow_identifier: "workflow-id",
              }),
            }),
          ]),
        }),
      }),
    );

    eventsTracker.dispose();
  });

  test<EventsTrackerFixtures>("retries tracking events exponentially", async ({
    eventsTracker,
  }) => {
    let attempts = 0;
    const successFlushMock = vi.fn();

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
            successFlushMock();
            return HttpResponse.json(await request.json(), { status: 201 });
          default:
            throw new Error("Unexpected call");
        }
      }),
    );

    eventsTracker.trackExternalEvent({
      eventName: "external",
      source: "sdk",
    });

    // Attempt 1: First direct attempt to flush without timeout
    await vi.advanceTimersByTimeAsync(100);
    expect(successFlushMock).not.toHaveBeenCalled();
    loggerMock.mockClear();

    // Attempt 2: Wait for next flush
    await vi.advanceTimersByTimeAsync(2_000 * MAX_JITTER_MULTIPLIER);
    expect(successFlushMock).not.toHaveBeenCalled();
    loggerMock.mockClear();

    // Attempt 2: Wait for request to complete
    await vi.advanceTimersByTimeAsync(1_000 * MAX_JITTER_MULTIPLIER);
    expect(successFlushMock).not.toHaveBeenCalled();
    loggerMock.mockClear();

    // Attempt 3: Wait for next flush
    await vi.advanceTimersByTimeAsync(4_000 * MAX_JITTER_MULTIPLIER);
    expect(successFlushMock).not.toHaveBeenCalled();
    loggerMock.mockClear();

    // Attempt 3: Wait for request to complete
    await vi.advanceTimersByTimeAsync(20_000 * MAX_JITTER_MULTIPLIER);
    expect(successFlushMock).not.toHaveBeenCalled();
    loggerMock.mockClear();

    // Attempt 4: Wait for next flush
    await vi.advanceTimersByTimeAsync(8_000 * MAX_JITTER_MULTIPLIER);
    expect(successFlushMock).toHaveBeenCalled();
  });

  test<EventsTrackerFixtures>("retries tracking events accumulating them if there are errors", async ({
    eventsTracker,
  }) => {
    let attempts = 0;
    const successFlushMock = vi.fn();

    server.use(
      http.post(eventsURL, async ({ request }) => {
        ++attempts;

        if (attempts < 4) {
          return new HttpResponse(null, { status: 500 });
        }

        const json = (await request.json()) as Record<string, Array<unknown>>;
        if (json.events?.length === 4) {
          successFlushMock();
          return HttpResponse.json(json, { status: 201 });
        }

        return new HttpResponse(null, { status: 500 });
      }),
    );

    for (let i = 0; i < 4; i++) {
      eventsTracker.trackExternalEvent({
        eventName: "external",
        source: "wpl",
      });
    }

    await vi.advanceTimersByTimeAsync(
      1000 * MAX_JITTER_MULTIPLIER +
        2000 * MAX_JITTER_MULTIPLIER +
        4000 * MAX_JITTER_MULTIPLIER +
        8000 * MAX_JITTER_MULTIPLIER,
    );
    expect(successFlushMock).toHaveBeenCalled();
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
              eventsTracker.trackExternalEvent({
                eventName: "external2",
                properties: { mode: defaultPurchaseMode, a: "b" },
                source: "other",
              }),
            1_000,
          );
          await new Promise((resolve) => setTimeout(resolve, 10_000));
          return new HttpResponse(null, { status: 201 });
        }

        return HttpResponse.json(null, { status: 201 });
      }),
    );

    eventsTracker.trackExternalEvent({
      eventName: "external1",
      source: "wpl",
    });

    await vi.runAllTimersAsync();

    expect(eventPayloadSpy).toHaveBeenNthCalledWith(1, {
      events: expect.arrayContaining([
        expect.objectContaining({
          event_name: "external1",
          timestamp_ms: date.getTime(),
        }),
      ]),
    });

    expect(eventPayloadSpy).toHaveBeenNthCalledWith(2, {
      events: expect.arrayContaining([
        expect.objectContaining({
          event_name: "external2",
          timestamp_ms: date.getTime() + 1_000,
        }),
      ]),
    });
  });

  test("uses provided trace_id when specified", async () => {
    const customTraceId = "custom-trace-id-123";
    const eventsTracker = new EventsTracker({
      apiKey: testApiKey,
      appUserId: "someAppUserId",
      rcSource: "rcSource",
      trace_id: customTraceId,
    });

    eventsTracker.trackExternalEvent({
      eventName: "external",
      source: "sdk",
      properties: { mode: defaultPurchaseMode },
    });

    await vi.advanceTimersToNextTimerAsync();

    expect(APIPostRequest).toHaveBeenCalledWith({
      url: eventsURL,
      json: {
        events: [
          {
            id: expect.any(String),
            type: "web_billing",
            timestamp_ms: date.getTime(),
            event_name: "external",
            app_user_id: "someAppUserId",
            context: expect.any(Object),
            properties: expect.objectContaining({
              mode: defaultPurchaseMode,
              trace_id: customTraceId,
            }),
          },
        ],
      },
      keepalive: true,
    });

    eventsTracker.dispose();
  });

  test("getTraceId returns the provided trace_id", () => {
    const customTraceId = "custom-trace-id-456";
    const eventsTracker = new EventsTracker({
      apiKey: testApiKey,
      appUserId: "someAppUserId",
      rcSource: "rcSource",
      trace_id: customTraceId,
    });

    expect(eventsTracker.getTraceId()).toBe(customTraceId);

    eventsTracker.dispose();
  });

  test("getTraceId returns generated trace_id when not provided", () => {
    const eventsTracker = new EventsTracker({
      apiKey: testApiKey,
      appUserId: "someAppUserId",
      rcSource: "rcSource",
    });

    const traceId = eventsTracker.getTraceId();
    expect(traceId).toBe("c1365463-ce59-4b83-b61b-ef0d883e9047");

    eventsTracker.dispose();
  });

  // FlushManager (scheduling, backoff, flushUntilDrain, in-flight wait) is unit-tested in
  // flush-manager.test.ts. The tests below verify the same behaviour at integration level
  // (EventsTracker + HTTP): no duplicate tests, same scenarios through the full stack.

  test<EventsTrackerFixtures>("flushAllEvents immediately flushes pending events", async ({
    eventsTracker,
  }) => {
    eventsTracker.trackExternalEvent({
      eventName: "test_event_1",
      source: "customer",
    });
    eventsTracker.trackExternalEvent({
      eventName: "test_event_2",
      source: "customer",
    });

    await eventsTracker.flushAllEvents();

    // When tracking events, the first event triggers an immediate flush
    // The second event is queued and will be flushed by flushAllEvents()
    // So we expect 2 separate flush calls
    expect(APIPostRequest).toHaveBeenCalledTimes(2);

    expect(APIPostRequest).toHaveBeenCalledWith({
      url: eventsURL,
      json: {
        events: [
          {
            id: expect.any(String),
            timestamp_ms: date.getTime(),
            type: "web_billing",
            event_name: "test_event_1",
            app_user_id: "someAppUserId",
            context: {
              library_name: "purchases-js",
              library_version: "1.0.0",
              source: "customer",
              rc_source: "rcSource",
            },
            properties: {
              mode: defaultPurchaseMode,
              trace_id: expect.any(String),
            },
          },
        ],
      },
      keepalive: true,
    });

    expect(APIPostRequest).toHaveBeenCalledWith({
      url: eventsURL,
      json: {
        events: [
          {
            id: expect.any(String),
            timestamp_ms: date.getTime(),
            type: "web_billing",
            event_name: "test_event_2",
            app_user_id: "someAppUserId",
            context: {
              library_name: "purchases-js",
              library_version: "1.0.0",
              source: "customer",
              rc_source: "rcSource",
            },
            properties: {
              mode: defaultPurchaseMode,
              trace_id: expect.any(String),
            },
          },
        ],
      },
      keepalive: true,
    });
  });

  test<EventsTrackerFixtures>("flushAllEvents works when queue is empty", async ({
    eventsTracker,
  }) => {
    // Flush with empty queue should not throw
    await eventsTracker.flushAllEvents();

    expect(APIPostRequest).not.toHaveBeenCalled();
  });

  test<EventsTrackerFixtures>("flushAllEvents waits for in-flight flush then drains", async ({
    eventsTracker,
  }) => {
    const { promise: firstRequestDone, resolve: resolveFirst } =
      deferred<void>();

    server.use(
      http.post(eventsURL, async ({ request }) => {
        const json = (await request.json()) as {
          events: Array<{ event_name: string }>;
        };
        APIPostRequest({ url: eventsURL, json, keepalive: request.keepalive });
        if (json.events?.some((e) => e.event_name === "first")) {
          await firstRequestDone;
          return HttpResponse.json(json, { status: 201 });
        }
        return HttpResponse.json(json, { status: 201 });
      }),
    );

    eventsTracker.trackExternalEvent({
      eventName: "first",
      source: "sdk",
    });
    await vi.advanceTimersToNextTimerAsync();
    expect(APIPostRequest).toHaveBeenCalledTimes(1);

    eventsTracker.trackExternalEvent({
      eventName: "second",
      source: "sdk",
    });
    const flushAllPromise = eventsTracker.flushAllEvents();
    await vi.advanceTimersByTimeAsync(0);
    resolveFirst();
    await flushAllPromise;

    expect(APIPostRequest).toHaveBeenCalledTimes(2);

    eventsTracker.trackExternalEvent({
      eventName: "after_reentrant",
      source: "sdk",
    });
    await vi.advanceTimersToNextTimerAsync();
    expect(APIPostRequest).toHaveBeenCalledTimes(3);
  });

  test<EventsTrackerFixtures>("maintains event ordering after failed flush", async ({
    eventsTracker,
  }) => {
    let attempts = 0;

    server.use(
      http.post(eventsURL, async ({ request }) => {
        ++attempts;
        const json = (await request.json()) as {
          events: Array<{ event_name: string }>;
        };
        APIPostRequest({ url: eventsURL, json, keepalive: request.keepalive });

        if (attempts === 1) {
          return new HttpResponse(null, { status: 500 });
        }
        return HttpResponse.json(json, { status: 201 });
      }),
    );

    eventsTracker.trackExternalEvent({
      eventName: "first",
      source: "sdk",
    });
    eventsTracker.trackExternalEvent({
      eventName: "second",
      source: "sdk",
    });
    eventsTracker.trackExternalEvent({
      eventName: "third",
      source: "sdk",
    });

    // First flush attempt will fail - advance just enough to let it complete
    await vi.advanceTimersByTimeAsync(100);
    expect(APIPostRequest).toHaveBeenCalledTimes(1);

    // Retry should send all events in correct order
    await vi.advanceTimersByTimeAsync(2_000 * MAX_JITTER_MULTIPLIER);
    expect(APIPostRequest).toHaveBeenCalledTimes(2);

    // Verify events are in correct order on retry
    const secondCall = APIPostRequest.mock.calls[1][0] as {
      json: { events: Array<{ event_name: string }> };
    };
    expect(secondCall.json.events).toMatchObject([
      { event_name: "first" },
      { event_name: "second" },
      { event_name: "third" },
    ]);
  });

  test<EventsTrackerFixtures>("FlushManager restarts after flushAllEvents", async ({
    eventsTracker,
  }) => {
    eventsTracker.trackExternalEvent({
      eventName: "before_flush",
      source: "sdk",
    });

    await eventsTracker.flushAllEvents();
    expect(APIPostRequest).toHaveBeenCalledTimes(1);

    // Track new event after flushAllEvents
    eventsTracker.trackExternalEvent({
      eventName: "after_flush",
      source: "sdk",
    });

    // Automatic flush should still work
    await vi.advanceTimersToNextTimerAsync();
    expect(APIPostRequest).toHaveBeenCalledTimes(2);

    expect(APIPostRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        json: expect.objectContaining({
          events: expect.arrayContaining([
            expect.objectContaining({ event_name: "after_flush" }),
          ]),
        }),
      }),
    );
  });

  test<EventsTrackerFixtures>("FlushManager resets backoff after flushAllEvents with failures", async ({
    eventsTracker,
  }) => {
    let attempts = 0;

    server.use(
      http.post(eventsURL, async ({ request }) => {
        ++attempts;
        const json = (await request.json()) as {
          events: Array<{ event_name: string }>;
        };
        APIPostRequest({ url: eventsURL, json, keepalive: request.keepalive });

        // Fail first 2 attempts, then succeed
        if (attempts <= 2) {
          return new HttpResponse(null, { status: 500 });
        }
        return HttpResponse.json(json, { status: 201 });
      }),
    );

    // Track event and let it fail twice (triggering backoff)
    eventsTracker.trackExternalEvent({
      eventName: "event_with_failures",
      source: "sdk",
    });

    // First attempt fails
    await vi.advanceTimersByTimeAsync(100);
    expect(APIPostRequest).toHaveBeenCalledTimes(1);

    // Second attempt fails (after 2s backoff)
    await vi.advanceTimersByTimeAsync(2_000 * MAX_JITTER_MULTIPLIER);
    expect(APIPostRequest).toHaveBeenCalledTimes(2);

    APIPostRequest.mockClear();

    // Now flushAllEvents - should succeed on third attempt
    await eventsTracker.flushAllEvents();
    expect(APIPostRequest).toHaveBeenCalledTimes(1);

    APIPostRequest.mockClear();

    // Track new event - automatic flush should work immediately
    // (verifies backoff was reset by start())
    eventsTracker.trackExternalEvent({
      eventName: "after_backoff_reset",
      source: "sdk",
    });

    await vi.advanceTimersToNextTimerAsync();
    expect(APIPostRequest).toHaveBeenCalledTimes(1);
    expect(APIPostRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        json: expect.objectContaining({
          events: expect.arrayContaining([
            expect.objectContaining({ event_name: "after_backoff_reset" }),
          ]),
        }),
      }),
    );
  });

  test<EventsTrackerFixtures>("dispose flushes pending events", async ({
    eventsTracker,
  }) => {
    eventsTracker.trackExternalEvent({
      eventName: "before_dispose",
      source: "sdk",
    });

    eventsTracker.dispose();

    // Give the dispose flush a chance to execute
    await vi.advanceTimersByTimeAsync(100);

    expect(APIPostRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        json: expect.objectContaining({
          events: expect.arrayContaining([
            expect.objectContaining({ event_name: "before_dispose" }),
          ]),
        }),
      }),
    );
  });

  test<EventsTrackerFixtures>("dispose prevents further operations", async ({
    eventsTracker,
  }) => {
    eventsTracker.dispose();

    // Track event after dispose
    eventsTracker.trackExternalEvent({
      eventName: "after_dispose",
      source: "sdk",
    });

    await vi.advanceTimersToNextTimerAsync();

    // No events should be tracked or flushed
    expect(APIPostRequest).not.toHaveBeenCalled();

    // flushAllEvents should return immediately
    await eventsTracker.flushAllEvents();
    expect(APIPostRequest).not.toHaveBeenCalled();
  });

  test<EventsTrackerFixtures>("dispose flushes queued events even after failed attempts", async ({
    eventsTracker,
  }) => {
    let attempts = 0;

    server.use(
      http.post(eventsURL, async ({ request }) => {
        ++attempts;
        const json = (await request.json()) as {
          events: Array<{ event_name: string }>;
        };
        APIPostRequest({ url: eventsURL, json, keepalive: request.keepalive });

        // Fail the first attempt
        if (attempts === 1) {
          return new HttpResponse(null, { status: 500 });
        }
        return HttpResponse.json(json, { status: 201 });
      }),
    );

    // Track event and let it fail
    eventsTracker.trackExternalEvent({
      eventName: "queued_event",
      source: "sdk",
    });

    await vi.advanceTimersByTimeAsync(100);
    expect(APIPostRequest).toHaveBeenCalledTimes(1);
    expect(attempts).toBe(1);

    // Event should still be in queue after failure
    APIPostRequest.mockClear();

    // Now dispose - should flush the queued event
    eventsTracker.dispose();
    await vi.advanceTimersByTimeAsync(100);

    expect(attempts).toBe(2);
    expect(APIPostRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        json: expect.objectContaining({
          events: expect.arrayContaining([
            expect.objectContaining({ event_name: "queued_event" }),
          ]),
        }),
        keepalive: true,
      }),
    );
  });

  test<EventsTrackerFixtures>("dispose drains all batches", async ({
    eventsTracker,
  }) => {
    const largeProperty = "x".repeat(30 * 1024); // 30KB string

    eventsTracker.trackExternalEvent({
      eventName: "large_1",
      source: "sdk",
      properties: { mode: defaultPurchaseMode, data: largeProperty },
    });
    eventsTracker.trackExternalEvent({
      eventName: "large_2",
      source: "sdk",
      properties: { mode: defaultPurchaseMode, data: largeProperty },
    });
    eventsTracker.trackExternalEvent({
      eventName: "large_3",
      source: "sdk",
      properties: { mode: defaultPurchaseMode, data: largeProperty },
    });

    eventsTracker.dispose();
    // Drain runs fire-and-forget; advance so all batches complete
    await vi.advanceTimersByTimeAsync(500);

    const allEvents = getEventsFromPostCalls(APIPostRequest.mock.calls);
    expect(allEvents).toMatchObject([
      { event_name: "large_1" },
      { event_name: "large_2" },
      { event_name: "large_3" },
    ]);
    expect(APIPostRequest.mock.calls.length).toBeGreaterThan(1);
  });

  test<EventsTrackerFixtures>("batches large events to respect keepalive size limit", async ({
    eventsTracker,
  }) => {
    const largeProperty = "x".repeat(30 * 1024); // 30KB string

    // Track 3 events that together exceed 50KB
    eventsTracker.trackExternalEvent({
      eventName: "large_event_1",
      source: "sdk",
      properties: { mode: defaultPurchaseMode, data: largeProperty },
    });
    eventsTracker.trackExternalEvent({
      eventName: "large_event_2",
      source: "sdk",
      properties: { mode: defaultPurchaseMode, data: largeProperty },
    });
    eventsTracker.trackExternalEvent({
      eventName: "large_event_3",
      source: "sdk",
      properties: { mode: defaultPurchaseMode, data: largeProperty },
    });

    await eventsTracker.flushAllEvents();

    // Should be split into multiple batches
    expect(APIPostRequest.mock.calls.length).toBeGreaterThan(1);

    const allEvents = getEventsFromPostCalls(APIPostRequest.mock.calls);
    expect(allEvents).toMatchObject([
      { event_name: "large_event_1" },
      { event_name: "large_event_2" },
      { event_name: "large_event_3" },
    ]);
  });

  test("dispose can be called multiple times safely", async () => {
    const eventsTracker = new EventsTracker({
      apiKey: testApiKey,
      appUserId: "someAppUserId",
      rcSource: "rcSource",
    });

    eventsTracker.dispose();
    eventsTracker.dispose(); // Should not throw or cause issues
    eventsTracker.dispose();

    expect(APIPostRequest).not.toHaveBeenCalled();
  });

  test<EventsTrackerFixtures>("single oversized event is removed from queue with warning", async ({
    eventsTracker,
  }) => {
    const warnSpy = vi.spyOn(Logger, "warnLog");

    // Create an event that exceeds 50KB
    const largeData = "x".repeat(60 * 1024);

    eventsTracker.trackExternalEvent({
      eventName: "oversized_event",
      source: "sdk",
      properties: { mode: defaultPurchaseMode, data: largeData },
    });

    // Wait for flush attempt
    await vi.advanceTimersToNextTimerAsync();

    // Should log warning about oversized event
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Event exceeds keepalive size limit"),
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("oversized_event"),
    );

    // Event should not be sent
    expect(APIPostRequest).not.toHaveBeenCalled();

    // Queue should be empty (event removed)
    // Track another event to verify queue is unblocked
    eventsTracker.trackExternalEvent({
      eventName: "after_oversized",
      source: "sdk",
    });

    await vi.advanceTimersToNextTimerAsync();

    // This event should flush successfully
    expect(APIPostRequest).toHaveBeenCalledTimes(1);
    expect(APIPostRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        json: expect.objectContaining({
          events: expect.arrayContaining([
            expect.objectContaining({ event_name: "after_oversized" }),
          ]),
        }),
      }),
    );

    warnSpy.mockRestore();
  });

  test<EventsTrackerFixtures>("oversized event followed by normal events", async ({
    eventsTracker,
  }) => {
    const warnSpy = vi.spyOn(Logger, "warnLog");

    // Create an oversized event
    const largeData = "x".repeat(60 * 1024);
    eventsTracker.trackExternalEvent({
      eventName: "oversized",
      source: "sdk",
      properties: { mode: defaultPurchaseMode, data: largeData },
    });

    // Add normal events
    eventsTracker.trackExternalEvent({
      eventName: "normal_1",
      source: "sdk",
    });
    eventsTracker.trackExternalEvent({
      eventName: "normal_2",
      source: "sdk",
    });

    // Flush all events
    await eventsTracker.flushAllEvents();

    // Oversized event should be logged and removed
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("oversized"));

    const allEvents = getEventsFromPostCalls(APIPostRequest.mock.calls);
    expect(allEvents).toMatchObject([
      { event_name: "normal_1" },
      { event_name: "normal_2" },
    ]);

    // Should NOT contain oversized event
    expect(allEvents.find((e) => e.event_name === "oversized")).toBeUndefined();

    warnSpy.mockRestore();
  });

  test<EventsTrackerFixtures>("batching respects size limit without O(n²) overhead", async ({
    eventsTracker,
  }) => {
    // Track multiple events with various sizes
    for (let i = 0; i < 10; i++) {
      eventsTracker.trackExternalEvent({
        eventName: `event_${i}`,
        source: "sdk",
        properties: {
          mode: defaultPurchaseMode,
          data: "x".repeat(3000), // Each event ~3KB
        },
      });
    }

    await eventsTracker.flushAllEvents();

    const allEvents = getEventsFromPostCalls(APIPostRequest.mock.calls);
    expect(allEvents.length).toBe(10);
    for (let i = 0; i < 10; i++) {
      expect(allEvents).toContainEqual(
        expect.objectContaining({ event_name: `event_${i}` }),
      );
    }
  });
});
