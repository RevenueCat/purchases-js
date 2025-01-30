import { camelToUnderscore } from "../helpers/camel-to-underscore";
import { v4 as uuidv4 } from "uuid";

enum EventType {
  SdkInitialized = "web_billing_sdk_initialized",
  CheckoutSessionStart = "web_billing_checkout_session_start",
  BillingEmailEntryImpression = "web_billing_billing_email_entry_impression",
  BillingEmailEntrySubmit = "web_billing_billing_email_entry_submit",
  BillingEmailEntryDismiss = "web_billing_billing_email_entry_dismiss",
  BillingEmailEntryError = "web_billing_billing_email_entry_error",
}

interface EventData extends Record<string, unknown> {
  traceId: string;
  appUserId: string | null;
  userIsAnonymous: boolean;
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

interface CheckoutSessionEventData extends EventData {
  checkoutSessionId: string;
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

export class BillingEmailEntryImpressionEvent extends BaseEvent {
  constructor(props: CheckoutSessionEventData) {
    super(EventType.BillingEmailEntryImpression, props);
  }
}

export class BillingEmailEntrySubmitEvent extends BaseEvent {
  constructor(props: CheckoutSessionEventData) {
    super(EventType.BillingEmailEntrySubmit, props);
  }
}

export class BillingEmailEntryDismissEvent extends BaseEvent {
  constructor(props: CheckoutSessionEventData) {
    super(EventType.BillingEmailEntryDismiss, props);
  }
}

interface BillingEmailEntryErrorEventProps extends CheckoutSessionEventData {
  errorCode: number | null;
  errorMessage: string;
}

export class BillingEmailEntryErrorEvent extends BaseEvent {
  constructor(props: BillingEmailEntryErrorEventProps) {
    super(EventType.BillingEmailEntryError, props);
  }
}
