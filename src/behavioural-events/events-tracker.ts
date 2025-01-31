import { v4 as uuid } from "uuid";
import { RC_ENDPOINT } from "../helpers/constants";
import { HttpMethods } from "msw";
import { getHeaders } from "../networking/http-client";
import { defaultHttpConfig, type HttpConfig } from "../entities/http-config";
import { FlushManager } from "./flush-manager";
import { Logger } from "../helpers/logger";
import { type EventProperties, Event } from "./event";

const MIN_INTERVAL_RETRY = 2_000;
const MAX_INTERVAL_RETRY = 60_000;

export interface TrackEventProps {
  eventName: string;
  properties?: EventProperties;
}

export interface EventsTrackerProps {
  apiKey: string;
  appUserId: string;
  userIsAnonymous: boolean;
  httpConfig?: HttpConfig;
}

export interface IEventsTracker {
  updateUser(props: UserEventProps): Promise<void>;
  generateCheckoutSessionId(): Promise<void>;
  trackEvent(props: TrackEventProps): void;
  dispose(): void;
}

export interface UserEventProps {
  appUserId: string;
  userIsAnonymous: boolean;
}

export default class EventsTracker implements IEventsTracker {
  private readonly apiKey: string;
  private readonly eventsQueue: Array<Event> = [];
  private readonly eventsUrl: string;
  private readonly flushManager: FlushManager;
  private readonly traceId: string = uuid();
  private userProps: UserEventProps;
  private checkoutSessionId: string | null = null;

  constructor(props: EventsTrackerProps) {
    Logger.debugLog(`Events tracker created for traceId ${this.traceId}`);

    const httpConfig = props.httpConfig || defaultHttpConfig;

    this.apiKey = props.apiKey;
    this.eventsUrl = `${httpConfig.proxyURL || RC_ENDPOINT}/v1/events`;
    this.userProps = {
      appUserId: props.appUserId,
      userIsAnonymous: props.userIsAnonymous,
    };
    this.flushManager = new FlushManager(
      MIN_INTERVAL_RETRY,
      MAX_INTERVAL_RETRY,
      this.flushEvents.bind(this),
    );
  }

  public async updateUser(props: UserEventProps) {
    this.userProps = props;
  }

  public async generateCheckoutSessionId() {
    this.checkoutSessionId = uuid();
  }

  public trackEvent(props: TrackEventProps): void {
    try {
      Logger.debugLog(
        `Queueing event ${props.eventName} with properties ${JSON.stringify(props)}`,
      );
      const event = new Event({
        eventName: props.eventName,
        traceId: this.traceId,
        checkoutSessionId: this.checkoutSessionId,
        appUserId: this.userProps.appUserId,
        userIsAnonymous: this.userProps.userIsAnonymous,
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
