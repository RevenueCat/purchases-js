import { type BaseEvent, SDKInitializedEvent } from "./events";
import { v4 as uuid } from "uuid";
import { RC_ENDPOINT, VERSION } from "../helpers/constants";
import { HttpMethods } from "msw";
import { getHeaders } from "../networking/http-client";
import { defaultHttpConfig, type HttpConfig } from "../entities/http-config";
import { FlushManager } from "./flush-manager";
import { Trace } from "./trace";
import { Logger } from "../helpers/logger";

const MIN_INTERVAL_RETRY = 2_000;
const MAX_INTERVAL_RETRY = 60_000;

export default class EventsTracker {
  private readonly trace: Trace;
  private readonly eventsQueue: Array<BaseEvent> = [];
  private readonly traceId: string = uuid();
  private readonly baseUrl: string = RC_ENDPOINT;
  private readonly flushManager: FlushManager;

  constructor(
    private readonly apiKey: string,
    private readonly httpConfig: HttpConfig = defaultHttpConfig,
  ) {
    Logger.debugLog(`Events tracker created for traceId ${this.traceId}`);

    this.trace = new Trace();
    this.flushManager = new FlushManager(
      MIN_INTERVAL_RETRY,
      MAX_INTERVAL_RETRY,
      this.flushEvents.bind(this),
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
    this.flushManager.tryFlush();
  }

  public trackSDKInitialized(appUserId: string | null) {
    Logger.debugLog("Tracking SDK Initialization");
    const event = new SDKInitializedEvent(this.trace, VERSION, appUserId);
    this.trackEvent(event);
  }

  public dispose() {
    this.flushManager.stop();
  }

  private async flushEvents(): Promise<void> {
    Logger.debugLog("Flushing events");

    if (this.eventsQueue.length === 0) {
      Logger.debugLog(`Nothing to flush`);
      return;
    }

    await this.postEvents(this.eventsQueue)
      .then((response) => {
        if (response.status === 200 || response.status === 201) {
          Logger.debugLog("Events flushed successfully");
          this.eventsQueue.splice(0, this.eventsQueue.length);
          return true;
        } else {
          Logger.debugLog("Events failed to flush due to server error");
          throw new Error("Events failed to flush due to server error");
        }
      })
      .catch((error) => {
        Logger.debugLog("Error while flushing events");
        throw error;
      });
  }

  private postEvents(events: Array<BaseEvent>): Promise<Response> {
    const URL = `${this.httpConfig.proxyURL || this.baseUrl}/v1/events`;
    Logger.debugLog(`Posting ${events.length} events to ${URL}`);
    return fetch(URL, {
      method: HttpMethods.POST,
      headers: getHeaders(this.apiKey),
      body: JSON.stringify({ events: events }),
    });
  }
}
