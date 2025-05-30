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

vi.mock("../../behavioural-events/sdk-event-context", () => ({
  buildEventContext: vi.fn((source, rcSource) => ({
    library_name: "purchases-js",
    library_version: "1.0.0",
    source,
    rcSource,
  })),
}));

const MAX_JITTER_MULTIPLIER = 1 + 0.1;

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
              trace_id: "c1365463-ce59-4b83-b61b-ef0d883e9047",
              a: "b",
              b: 1,
              c: false,
              d: null,
            },
          },
        ],
      },
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
      properties: { a: "b" },
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
      source: "wpl",
    });

    // Attempt 1: First direct attempt to flush without timeout
    await vi.advanceTimersByTimeAsync(100 * MAX_JITTER_MULTIPLIER);
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
                properties: { a: "b" },
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
});
