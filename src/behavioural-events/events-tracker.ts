import type { SDKInitializedEvent, TrackedEvent } from "./event-types";
import { v4 as uuid } from "uuid";
import { RC_ENDPOINT, VERSION } from "../helpers/constants";
import { HttpMethods } from "msw";
import { getHeaders } from "../networking/http-client";
import { defaultHttpConfig, type HttpConfig } from "../entities/http-config";

export default class EventsTracker {
  private readonly eventsQueue: Array<TrackedEvent> = [];
  private flushingMutex: boolean = false;
  private readonly traceId: string = uuid();
  private readonly intervalHandle: number = -1;
  private readonly baseUrl: string = RC_ENDPOINT;

  constructor(
    private readonly apiKey: string,
    private readonly httpConfig: HttpConfig = defaultHttpConfig,
  ) {
    console.debug(`Events tracker created for traceId ${this.traceId}`);

    // This interval will flush the events every 5 seconds
    // since we don't await the flush when calling trackEvent
    // this interval will retry in case of failure
    // using the mutex and posting only if there are events in the queue.
    this.intervalHandle = setInterval(() => {
      console.debug("Interval flush");
      this.flushEvents();
    }, 5000);
  }

  /**
   * @public
   * Enqueues the event to be tracked.
   * This method does not wait for the event to be tracked in order to avoid blocking
   * the function is called into.
   *
   * It will create a promise internally that will be resolved with no one listening.
   */
  public trackEvent(event: TrackedEvent): void {
    console.debug(
      `Queueing event ${event.type} with properties ${JSON.stringify(event)}`,
    );
    this.eventsQueue.push(event);

    this.flushEvents();
  }

  public flushEvents() {
    console.debug("Flushing events");
    if (this.eventsQueue.length === 0) {
      console.debug(`Nothing to flush`);
      return;
    }
    if (this.flushingMutex) {
      console.debug("Already flushing");
      return;
    }

    this.flushingMutex = true;
    console.debug("Acquired flushing mutex");
    if (this.eventsQueue.length > 0) {
      this.postQueuedEvents(this.eventsQueue)
        .then((response) => {
          if (response.status === 200 || response.status === 201) {
            console.debug(`Events flushed successfully`);
            this.eventsQueue.splice(0, this.eventsQueue.length);
          }
        })
        .catch((error) => {
          console.debug("Error while flushing events", error);
        })
        .finally(() => {
          console.debug("Releasing flushing mutex");
          this.flushingMutex = false;
        });
    }
  }

  public async postQueuedEvents(
    queuedEvents: Array<TrackedEvent>,
  ): Promise<Response> {
    const URL = `${this.httpConfig.proxyURL || this.baseUrl}/v1/events`;
    console.debug(`Posting ${queuedEvents.length} events to ${URL}`);
    return await fetch(URL, {
      method: HttpMethods.POST,
      headers: getHeaders(this.apiKey),
      body: JSON.stringify({ events: queuedEvents }),
    });
  }

  public trackSDKInitialized() {
    console.debug("Tracking SDK Initialization");
    const event: SDKInitializedEvent = {
      type: "rc_billing_event",
      event_name: "SDK_INITIALIZED",
      sdk_version: VERSION,
    };
    this.trackEvent(event);
  }

  public dispose() {
    clearInterval(this.intervalHandle);
  }
}
