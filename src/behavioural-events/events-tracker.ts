import {
  type BaseEvent,
  BillingEmailEntryDismissEvent,
  BillingEmailEntryErrorEvent,
  BillingEmailEntryImpressionEvent,
  BillingEmailEntrySubmitEvent,
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

export interface EventsTrackerProps {
  apiKey: string;
  appUserId: string;
  userIsAnonymous: boolean;
  httpConfig?: HttpConfig;
}

export interface IEventsTracker {
  updateUser(props: UserEventProps): Promise<void>;
  trackSDKInitialized(): Promise<void>;
  trackCheckoutSessionStart(
    props: CheckoutSessionStartEventProps,
  ): Promise<void>;
  trackBillingEmailEntryImpression(): Promise<void>;
  trackBillingEmailEntrySubmit(): Promise<void>;
  trackBillingEmailEntryDismiss(): Promise<void>;
  trackBillingEmailEntryError(
    props: BillingEmailEntryErrorEventProps,
  ): Promise<void>;
  dispose(): void;
}

export interface UserEventProps {
  appUserId: string;
  userIsAnonymous: boolean;
}

export interface CheckoutSessionStartEventProps {
  customizationOptions: {
    colorButtonsPrimary: string;
    colorAccent: string;
    colorError: string;
    colorProductInfoBg: string;
    colorFormBg: string;
    colorPageBg: string;
    font: string;
    shapes: string;
    showProductDescription: boolean;
  } | null;
  productInterval: string | null;
  productPrice: number;
  productCurrency: string;
  selectedProduct: string;
  selectedPackage: string;
  selectedPurchaseOption: string;
}

export interface BillingEmailEntryErrorEventProps {
  errorCode: number | null;
  errorMessage: string;
}

export default class EventsTracker implements IEventsTracker {
  private readonly apiKey: string;
  private readonly eventsQueue: Array<BaseEvent> = [];
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

  public async trackSDKInitialized() {
    Logger.debugLog("Tracking SDK Initialization");
    const event = new SDKInitializedEvent({
      traceId: this.traceId,
      ...this.userProps,
      sdkVersion: VERSION,
    });
    this.trackEvent(event);
  }

  public async trackCheckoutSessionStart(
    props: CheckoutSessionStartEventProps,
  ) {
    this.checkoutSessionId = uuid();

    const event = new CheckoutSessionStartEvent({
      traceId: this.traceId,
      checkoutSessionId: this.checkoutSessionId,
      ...this.userProps,
      ...props,
    });
    this.trackEvent(event);
  }

  public async trackBillingEmailEntryImpression() {
    const event = new BillingEmailEntryImpressionEvent({
      checkoutSessionId: this.checkoutSessionId!,
      traceId: this.traceId,
      ...this.userProps,
    });
    this.trackEvent(event);
  }

  public async trackBillingEmailEntrySubmit() {
    const event = new BillingEmailEntrySubmitEvent({
      checkoutSessionId: this.checkoutSessionId!,
      traceId: this.traceId,
      ...this.userProps,
    });
    this.trackEvent(event);
  }

  public async trackBillingEmailEntryDismiss() {
    const event = new BillingEmailEntryDismissEvent({
      checkoutSessionId: this.checkoutSessionId!,
      traceId: this.traceId,
      ...this.userProps,
    });
    this.trackEvent(event);
  }

  public async trackBillingEmailEntryError(
    props: BillingEmailEntryErrorEventProps,
  ) {
    const event = new BillingEmailEntryErrorEvent({
      checkoutSessionId: this.checkoutSessionId!,
      traceId: this.traceId,
      ...this.userProps,
      ...props,
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
