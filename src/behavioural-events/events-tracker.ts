import { type BaseEvent, SDKInitializedEvent } from "./events";
import { v4 as uuid } from "uuid";
import { RC_ENDPOINT, VERSION } from "../helpers/constants";
import { HttpMethods } from "msw";
import { getHeaders } from "../networking/http-client";
import { defaultHttpConfig, type HttpConfig } from "../entities/http-config";
import { RetryWithBackoff } from "../helpers/retry-with-backoff";
import { Trace } from "./trace";
import { Logger } from "../helpers/logger";

const MIN_INTERVAL_RETRY = 2_000;
const MAX_INTERVAL_RETRY = 60_000;

export default class EventsTracker {
  private readonly trace: Trace;
  private readonly eventsQueue: Array<BaseEvent> = [];
  private flushingMutex: boolean = false;
  private readonly traceId: string = uuid();
  private readonly baseUrl: string = RC_ENDPOINT;
  private readonly retry: RetryWithBackoff;

  constructor(
    private readonly apiKey: string,
    private readonly httpConfig: HttpConfig = defaultHttpConfig,
  ) {
    Logger.debugLog(`Events tracker created for traceId ${this.traceId}`);

    this.trace = new Trace();
    this.retry = new RetryWithBackoff(
      MIN_INTERVAL_RETRY,
      MAX_INTERVAL_RETRY,
      () => {
        this.flushEvents();
      },
    );
  }

  /**
   * @public
   * Enqueues the event to be tracked.
   * This method does not wait for the event to be tracked in order to avoid blocking
   * the function is called into.
   *
   * It will create a promise internally that will be resolved with no one listening.
   */
  public trackEvent(event: BaseEvent): void {
    Logger.debugLog(
      `Queueing event ${event.type} with properties ${JSON.stringify(event)}`,
    );
    this.eventsQueue.push(event);
    this.flushEvents();
  }

  public flushEvents() {
    Logger.debugLog("Flushing events");
    if (this.eventsQueue.length === 0) {
      Logger.debugLog(`Nothing to flush`);
      return;
    }
    if (this.flushingMutex) {
      Logger.debugLog("Already flushing");
      return;
    }

    this.flushingMutex = true;
    Logger.debugLog("Acquired flushing mutex");
    this.postEvents(this.eventsQueue)
      .then((response) => {
        if (response.status === 200 || response.status === 201) {
          Logger.debugLog("Events flushed successfully");
          this.eventsQueue.splice(0, this.eventsQueue.length);
          this.retry.reset();
        } else {
          Logger.debugLog("Events failed to flush due to server error");
          this.retry.backoff();
        }
      })
      .catch((error) => {
        Logger.debugLog(`Error while flushing events: ${error}`);
        this.retry.backoff();
      })
      .finally(() => {
        Logger.debugLog("Releasing flushing mutex");
        this.flushingMutex = false;
      });
  }

  public async postEvents(events: Array<BaseEvent>): Promise<Response> {
    const URL = `${this.httpConfig.proxyURL || this.baseUrl}/v1/events`;
    Logger.debugLog(`Posting ${events.length} events to ${URL}`);
    return await fetch(URL, {
      method: HttpMethods.POST,
      headers: getHeaders(this.apiKey),
      body: JSON.stringify({ events: events }),
    });
  }

  public trackSDKInitialized(appUserId: string | null) {
    Logger.debugLog("Tracking SDK Initialization");
    const event = new SDKInitializedEvent(this.trace, VERSION, appUserId);
    this.trackEvent(event);
  }

  public dispose() {
    this.retry.stop();
  }
}
