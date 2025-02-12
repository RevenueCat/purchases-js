import { v4 as uuid } from "uuid";
import { RC_ANALYTICS_ENDPOINT } from "../helpers/constants";
import { HttpMethods } from "msw";
import { getHeaders } from "../networking/http-client";
import { FlushManager } from "./flush-manager";
import { Logger } from "../helpers/logger";
import { type EventProperties, Event } from "./event";
import type { SDKEvent } from "./sdk-events";
import {
  buildEventContext,
  type SDKEventContextSource,
} from "./sdk-event-context";

const MIN_INTERVAL_RETRY = 2_000;
const MAX_INTERVAL_RETRY = 5 * 60_000;
const JITTER_PERCENT = 0.1;
export interface TrackEventProps {
  eventName: string;
  source: SDKEventContextSource;
  properties?: EventProperties;
}

export interface EventsTrackerProps {
  apiKey: string;
  appUserId: string;
}

export interface IEventsTracker {
  addTrackingQueryParameters(stringUrl: string): string;
  updateUser(appUserId: string): Promise<void>;
  generateCheckoutSessionId(): void;
  trackSDKEvent(props: SDKEvent): void;
  trackExternalEvent(props: TrackEventProps): void;
  dispose(): void;
}

export default class EventsTracker implements IEventsTracker {
  private readonly apiKey: string;
  private readonly eventsQueue: Array<Event> = [];
  private readonly eventsUrl: string;
  private readonly flushManager: FlushManager;
  private readonly traceId: string = uuid();
  private appUserId: string;
  private checkoutSessionId: string | null = null;

  constructor(props: EventsTrackerProps) {
    Logger.debugLog(`Events tracker created for traceId ${this.traceId}`);

    this.apiKey = props.apiKey;
    this.eventsUrl = `${RC_ANALYTICS_ENDPOINT}/v1/events`;
    this.appUserId = props.appUserId;
    this.flushManager = new FlushManager(
      MIN_INTERVAL_RETRY,
      MAX_INTERVAL_RETRY,
      JITTER_PERCENT,
      this.flushEvents.bind(this),
    );
  }

  public async updateUser(appUserId: string) {
    this.appUserId = appUserId;
  }

  public generateCheckoutSessionId() {
    this.checkoutSessionId = uuid();
  }

  public addTrackingQueryParameters(stringUrl: string) {
    const url = new URL(stringUrl);

    if (url.protocol === "http:" || url.protocol === "https:") {
      url.searchParams.set("trace_id", this.traceId);
      if (this.checkoutSessionId) {
        url.searchParams.set("checkout_session_id", this.checkoutSessionId);
      }
    }
    return url.toString();
  }

  public trackSDKEvent(props: SDKEvent): void {
    this.trackEvent({ ...props, source: "sdk" });
  }

  public trackExternalEvent(props: TrackEventProps): void {
    this.trackEvent({ ...props });
  }

  private trackEvent(props: TrackEventProps) {
    try {
      Logger.debugLog(
        `Queueing event ${props.eventName} with properties ${JSON.stringify(props)}`,
      );
      const event = new Event({
        eventName: props.eventName,
        traceId: this.traceId,
        checkoutSessionId: this.checkoutSessionId,
        appUserId: this.appUserId,
        context: buildEventContext(props.source),
        properties: props.properties || {},
      });
      this.eventsQueue.push(event);
      this.flushManager.tryFlush();
    } catch {
      Logger.errorLog(`Error while tracking event ${props.eventName}`);
    }
  }

  public dispose() {
    this.flushManager.stop();
  }

  private flushEvents(): Promise<void> {
    Logger.debugLog("Flushing events");

    if (this.eventsQueue.length === 0) {
      Logger.debugLog(`Nothing to flush`);
      return Promise.resolve();
    }

    const eventsToFlush = [...this.eventsQueue];

    return fetch(this.eventsUrl, {
      method: HttpMethods.POST,
      headers: getHeaders(this.apiKey),
      body: JSON.stringify({ events: eventsToFlush }),
    })
      .then((response) => {
        if (response.status === 200 || response.status === 201) {
          Logger.debugLog("Events flushed successfully");
          this.eventsQueue.splice(0, eventsToFlush.length);
          return;
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
}
