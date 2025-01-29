import {
  type BaseEvent,
  CheckoutSessionStartEvent,
  SDKInitializedEvent,
} from "./events";
import { v4 as uuid } from "uuid";
import { RC_ENDPOINT, VERSION } from "../helpers/constants";
import { HttpMethods } from "msw";
import { getHeaders } from "../networking/http-client";
import { defaultHttpConfig, type HttpConfig } from "../entities/http-config";
import { FlushManager } from "./flush-manager";
import { Logger } from "../helpers/logger";

const MIN_INTERVAL_RETRY = 2_000;
const MAX_INTERVAL_RETRY = 60_000;

export interface IEventsTracker {
  trackSDKInitialized(
    appUserId: string | null,
    isUserAnonymous: boolean,
  ): Promise<void>;
  trackCheckoutSessionStart(params: CheckoutSessionStartParams): Promise<void>;
  dispose(): void;
}

export interface CheckoutSessionStartParams {
  appUserId: string;
  userIsAnonymous: boolean;
  customizationOptions: Record<string, string | boolean> | null;
  productInterval: string | null;
  productPrice: number;
  productCurrency: string;
  selectedProduct: string;
  selectedPackage: string;
  selectedPurchaseOption: string;
}

export default class EventsTracker implements IEventsTracker {
  private readonly eventsQueue: Array<BaseEvent> = [];
  private readonly traceId: string = uuid();
  private readonly eventsUrl: string;
  private readonly flushManager: FlushManager;

  constructor(
    private readonly apiKey: string,
    private readonly httpConfig: HttpConfig = defaultHttpConfig,
  ) {
    Logger.debugLog(`Events tracker created for traceId ${this.traceId}`);

    this.eventsUrl = `${this.httpConfig.proxyURL || RC_ENDPOINT}/v1/events`;
    this.flushManager = new FlushManager(
      MIN_INTERVAL_RETRY,
      MAX_INTERVAL_RETRY,
      this.flushEvents.bind(this),
    );
  }

  public async trackSDKInitialized(
    appUserId: string | null,
    userIsAnonymous: boolean,
  ) {
    Logger.debugLog("Tracking SDK Initialization");
    const event = new SDKInitializedEvent({
      traceId: this.traceId,
      appUserId,
      userIsAnonymous,
      sdkVersion: VERSION,
    });
    this.trackEvent(event);
  }

  public async trackCheckoutSessionStart(params: CheckoutSessionStartParams) {
    const checkoutSessionId = uuid();

    const event = new CheckoutSessionStartEvent({
      traceId: this.traceId,
      checkoutSessionId: checkoutSessionId,
      ...params,
    });
    this.trackEvent(event);
  }

  public dispose() {
    this.flushManager.stop();
  }

  private trackEvent(event: BaseEvent): void {
    Logger.debugLog(
      `Queueing event ${event.type} with properties ${JSON.stringify(event)}`,
    );
    this.eventsQueue.push(event);
    this.flushManager.tryFlush();
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
