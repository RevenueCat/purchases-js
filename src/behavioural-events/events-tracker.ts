import { RC_ANALYTICS_ENDPOINT } from "../helpers/constants";
import { HttpMethods } from "msw";
import { getHeaders } from "../networking/http-client";
import { FlushManager } from "./flush-manager";
import { Logger } from "../helpers/logger";
import { defaultPurchaseMode, Event, type EventProperties } from "./event";
import type { SDKEvent } from "./sdk-events";
import {
  buildEventContext,
  type SDKEventContextSource,
} from "./sdk-event-context";
import type { WorkflowContext } from "../entities/purchases-config";
import { TraceIdManager } from "../helpers/trace-id-manager";

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
  rcSource: string | null;
  silent?: boolean;
  workflowContext?: WorkflowContext;
}

export interface IEventsTracker {
  getTraceId(): string;

  updateUser(appUserId: string): Promise<void>;

  trackSDKEvent(props: SDKEvent): void;

  trackExternalEvent(props: TrackEventProps): void;

  dispose(): void;
}

export default class EventsTracker implements IEventsTracker {
  private readonly apiKey: string;
  private readonly eventsQueue: Array<Event> = [];
  private readonly eventsUrl: string;
  private readonly flushManager: FlushManager;
  private readonly traceIdManager: TraceIdManager;
  private appUserId: string;
  private readonly isSilent: boolean;
  private rcSource: string | null;
  private readonly workflowContext?: WorkflowContext;

  constructor(props: EventsTrackerProps) {
    this.apiKey = props.apiKey;
    this.eventsUrl = `${RC_ANALYTICS_ENDPOINT}/v1/events`;
    this.appUserId = props.appUserId;
    this.isSilent = props.silent || false;
    this.rcSource = props.rcSource;
    this.workflowContext = props.workflowContext;
    this.traceIdManager = new TraceIdManager(
      props.workflowContext?.workflowIdentifier,
    );
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

  public getTraceId() {
    return this.traceIdManager.getTraceId();
  }

  public trackSDKEvent(props: SDKEvent): void {
    this.trackEvent({ ...props, source: "sdk" });
  }

  public trackExternalEvent(props: TrackEventProps): void {
    this.trackEvent({ ...props });
  }

  private trackEvent(props: TrackEventProps) {
    if (this.isSilent) {
      Logger.verboseLog("Skipping event tracking, the EventsTracker is silent");
      return;
    }
    try {
      const event = new Event({
        eventName: props.eventName,
        traceId: this.traceIdManager.getTraceId(),
        appUserId: this.appUserId,
        context: buildEventContext(props.source, this.rcSource),
        workflowIdentifier: this.workflowContext?.workflowIdentifier,
        properties: props.properties || {
          mode: defaultPurchaseMode,
        },
      });
      this.eventsQueue.push(event);
      this.flushManager.tryFlush();
    } catch (error) {
      Logger.errorLog(
        `Error while tracking event ${props.eventName}: ${error}`,
      );
    }
  }

  public dispose() {
    this.flushManager.stop();
  }

  private flushEvents(): Promise<void> {
    if (this.eventsQueue.length === 0) {
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
