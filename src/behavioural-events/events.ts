import { camelToUnderscore } from "../helpers/camel-to-underscore";
import { v4 as uuidv4 } from "uuid";

enum EventType {
  SdkInitialized = "web_billing_sdk_initialized",
  CheckoutSessionStart = "web_billing_checkout_session_start",
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
  public readonly data: EventData;

  protected constructor(type: EventType, data: EventData) {
    this.id = uuidv4();
    this.timestampMs = Date.now();
    this.type = type;
    this.data = data;
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      timestamp_ms: this.timestampMs,
      type: this.type,
      ...camelToUnderscore(this.data),
    };
  }
}

interface SDKInitializedEventData extends EventData {
  sdkVersion: string;
}

export class SDKInitializedEvent extends BaseEvent {
  constructor(props: SDKInitializedEventData) {
    super(EventType.SdkInitialized, props);
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
  constructor(props: CheckoutSessionStartEventData) {
    super(EventType.CheckoutSessionStart, props);
  }
}
