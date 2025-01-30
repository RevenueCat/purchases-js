import { camelToUnderscore } from "../helpers/camel-to-underscore";
import { v4 as uuidv4 } from "uuid";

enum EventType {
  SDK_INITIALIZED = "web_billing_sdk_initialized",
  CHECKOUT_SESSION_START = "web_billing_checkout_session_start",
}

interface EventData extends Record<string, unknown> {
  traceId: string;
  appUserId: string | null;
  userIsAnonymous: boolean;
}

interface CheckoutSessionEventData extends EventData {
  checkoutSessionId: string;
}

export abstract class BaseEvent {
  public readonly id: string;
  public readonly timestampMs: number;
  public readonly type: string;

  protected constructor(type: EventType) {
    this.id = uuidv4();
    this.timestampMs = Date.now();
    this.type = type;
  }

  public toJSON(data: Record<string, unknown>): Record<string, unknown> {
    return {
      id: this.id,
      timestamp_ms: this.timestampMs,
      type: this.type,
      ...camelToUnderscore(data),
    };
  }
}

interface SDKInitializedEventData extends EventData {
  sdkVersion: string;
}

export class SDKInitializedEvent extends BaseEvent {
  public readonly data: SDKInitializedEventData;

  constructor(props: SDKInitializedEventData) {
    super(EventType.SDK_INITIALIZED);
    this.data = props;
  }

  public toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(this.data),
    };
  }
}

interface CustomizationOptionsEventData {
  colorButtonsPrimary: string;
  colorAccent: string;
  colorError: string;
  colorProductInfoBg: string;
  colorFormBg: string;
  colorPageBg: string;
  font: string;
  shapes: string;
  showProductDescription: boolean;
}

export interface CheckoutSessionStartEventData
  extends CheckoutSessionEventData {
  customizationOptions: CustomizationOptionsEventData | null;
  productInterval: string | null;
  productPrice: number;
  productCurrency: string;
  selectedProduct: string;
  selectedPackage: string;
  selectedPurchaseOption: string;
}

export class CheckoutSessionStartEvent extends BaseEvent {
  public readonly data: CheckoutSessionStartEventData;

  constructor(props: CheckoutSessionStartEventData) {
    super(EventType.CHECKOUT_SESSION_START);
    this.data = props;
  }

  public toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(this.data),
    };
  }
}
