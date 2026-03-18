import { generateUUID } from "../helpers/uuid-helper";
import { RC_ANALYTICS_ENDPOINT } from "../helpers/constants";
import { HttpMethods } from "msw";
import { getHeaders } from "../networking/http-client";
import { FlushManager, type FlushOptions } from "./flush-manager";
import { Logger } from "../helpers/logger";
import { defaultPurchaseMode, Event, type EventProperties } from "./event";
import { PaywallEvent, type PaywallEventData } from "./paywall-event";
import type { SDKEvent } from "./sdk-events";
import {
  buildEventContext,
  type SDKEventContextSource,
} from "./sdk-event-context";
import type { WorkflowContext } from "../entities/purchases-config";
import type { HttpConfig } from "../entities/http-config";

const MIN_INTERVAL_RETRY = 2_000;
const MAX_INTERVAL_RETRY = 5 * 60_000;
const JITTER_PERCENT = 0.1;
const MAX_KEEPALIVE_BATCH_SIZE = 50 * 1024;

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
  trace_id?: string;
  httpConfig?: HttpConfig;
}

export interface IEventsTracker {
  getTraceId(): string;

  updateUser(appUserId: string): Promise<void>;

  trackSDKEvent(props: SDKEvent): void;

  trackExternalEvent(props: TrackEventProps): void;

  trackPaywallEvent(data: PaywallEventData): void;

  dispose(): void;

  flushAllEvents(): Promise<void>;
}

export default class EventsTracker implements IEventsTracker {
  private readonly apiKey: string;
  private readonly eventsQueue: Array<Event | PaywallEvent> = [];
  private readonly eventsUrl: string;
  private readonly flushManager: FlushManager;
  private readonly traceId: string;
  private appUserId: string;
  private readonly isSilent: boolean;
  private rcSource: string | null;
  private readonly workflowContext?: WorkflowContext;
  private isDisposed: boolean = false;

  constructor(props: EventsTrackerProps) {
    this.apiKey = props.apiKey;
    this.eventsUrl = `${props.httpConfig?.eventsURL ?? RC_ANALYTICS_ENDPOINT}/v1/events`;
    this.appUserId = props.appUserId;
    this.isSilent = props.silent || false;
    this.rcSource = props.rcSource;
    this.workflowContext = props.workflowContext;
    this.traceId = props.trace_id || generateUUID();
    this.flushManager = new FlushManager(
      MIN_INTERVAL_RETRY,
      MAX_INTERVAL_RETRY,
      JITTER_PERCENT,
      this.doFlush.bind(this),
    );
  }

  public async updateUser(appUserId: string) {
    this.appUserId = appUserId;
  }

  public getTraceId() {
    return this.traceId;
  }

  public trackSDKEvent(props: SDKEvent): void {
    this.trackEvent({ ...props, source: "sdk" });
  }

  public trackExternalEvent(props: TrackEventProps): void {
    this.trackEvent({ ...props });
  }

  public trackPaywallEvent(data: PaywallEventData): void {
    if (this.isSilent) {
      Logger.verboseLog("Skipping event tracking, the EventsTracker is silent");
      return;
    }
    try {
      const event = new PaywallEvent(data);
      Logger.debugLog(
        `[PaywallEvent] Queuing ${data.type} (queue size: ${this.eventsQueue.length + 1}, url: ${this.eventsUrl})`,
      );
      Logger.debugLog(
        `[PaywallEvent] Payload: ${JSON.stringify(event.toJSON())}`,
      );
      this.eventsQueue.push(event);
      this.flushManager.tryFlush();
    } catch (error) {
      Logger.errorLog(
        `Error while tracking paywall event ${data.type}: ${error}`,
      );
    }
  }

  private trackEvent(props: TrackEventProps) {
    if (this.isSilent) {
      Logger.verboseLog("Skipping event tracking, the EventsTracker is silent");
      return;
    }
    try {
      const event = new Event({
        eventName: props.eventName,
        traceId: this.traceId,
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
    if (this.isDisposed) {
      return;
    }

    this.flushManager.stop();

    if (this.eventsQueue.length > 0) {
      this.flushManager
        .flushUntilDrain({ ignoreDisposed: true })
        .catch((error) => {
          Logger.debugLog(`Failed to flush events on dispose: ${error}`);
        });
    }

    this.isDisposed = true;
  }

  public async flushAllEvents(): Promise<void> {
    if (this.isDisposed) {
      return;
    }

    await this.flushManager.flushUntilDrain();

    if (!this.isDisposed && this.eventsQueue.length > 0) {
      this.flushManager.schedule();
    }
  }

  private estimateSingleEventSize(event: Event | PaywallEvent): number {
    try {
      return JSON.stringify(event).length;
    } catch {
      return MAX_KEEPALIVE_BATCH_SIZE; // Worst case assumption
    }
  }

  /**
   * Builds a batch of events that fits within browser keepalive size limit.
   * Browsers impose ~64KB limit on fetch() requests with keepalive:true.
   * https://developer.mozilla.org/en-US/docs/Web/API/RequestInit#keepalive
   * Returns null if the first event exceeds the limit (and removes it from queue).
   */
  private batchEventsForKeepalive(): Array<Event | PaywallEvent> | null {
    const eventsToFlush: Array<Event | PaywallEvent> = [];
    let batchSize = 16; // Account for {"events":[]} wrapper overhead

    for (const event of this.eventsQueue) {
      const eventSize = this.estimateSingleEventSize(event);
      const separator = eventsToFlush.length > 0 ? 1 : 0;
      const newBatchSize = batchSize + eventSize + separator;

      if (newBatchSize <= MAX_KEEPALIVE_BATCH_SIZE) {
        eventsToFlush.push(event);
        batchSize = newBatchSize;
      } else if (eventsToFlush.length === 0) {
        // First event exceeds limit - remove it to unblock queue
        Logger.warnLog(
          `Event exceeds keepalive size limit (${eventSize} bytes)`,
        );
        this.eventsQueue.shift();
        return null;
      } else {
        break;
      }
    }

    return eventsToFlush;
  }

  private doFlush(options?: FlushOptions): Promise<boolean> {
    if (!options?.ignoreDisposed && this.isDisposed) {
      return Promise.resolve(true);
    }

    if (this.eventsQueue.length === 0) {
      return Promise.resolve(true);
    }

    const eventsToFlush = this.batchEventsForKeepalive();
    if (!eventsToFlush) {
      return Promise.resolve(this.eventsQueue.length === 0);
    }

    // Only remove from queue after successful delivery
    const body = JSON.stringify({ events: eventsToFlush });
    Logger.debugLog(
      `[EventsTracker] Flushing ${eventsToFlush.length} event(s) to ${this.eventsUrl}`,
    );
    Logger.debugLog(`[EventsTracker] Body: ${body}`);
    return fetch(this.eventsUrl, {
      method: HttpMethods.POST,
      headers: getHeaders(this.apiKey),
      body,
      keepalive: true,
    })
      .then((response) => {
        Logger.debugLog(`[EventsTracker] Flush response: ${response.status}`);
        if (response.status === 200 || response.status === 201) {
          this.eventsQueue.splice(0, eventsToFlush.length);

          if (this.eventsQueue.length > 0) {
            this.flushManager.schedule();
          }
          return this.eventsQueue.length === 0;
        }
        Logger.debugLog("Events failed to flush due to server error");
        throw new Error("Events failed to flush due to server error");
      })
      .catch((error) => {
        Logger.debugLog(`[EventsTracker] Flush error: ${error}`);
        throw error;
      });
  }
}
