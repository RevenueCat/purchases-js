import { camelToUnderscore } from "../helpers/camel-to-underscore";
import { generateUUID } from "../helpers/uuid-helper";

export type EventData = {
  eventName: string;
  traceId: string;
  appUserId: string;
  properties: EventProperties;
  context: EventContext;
  workflowIdentifier?: string;
};

type EventContextSingleValue = string | number | boolean;

type EventContextValue =
  | null
  | EventContextSingleValue
  | Array<EventContextValue>;

export type EventContext = {
  [key: string]: EventContextValue;
};

type EventPropertySingleValue = string | number | boolean;

type EventPropertyValue =
  | null
  | EventPropertySingleValue
  | Array<EventPropertyValue>;

export type SDKEventPurchaseMode =
  | "sdk_checkout"
  | "external_checkout"
  | "express_purchase_button";

export const defaultPurchaseMode: SDKEventPurchaseMode = "sdk_checkout";

export interface EventProperties {
  [key: string]: EventPropertyValue;
}

type EventPayload = {
  id: string;
  timestamp_ms: number;
  type: string;
  event_name: string;
  app_user_id: string;
  context: EventContext;
  properties: EventProperties;
};

export class Event {
  EVENT_TYPE = "web_billing";

  public readonly id: string;
  public readonly timestampMs: number;
  public readonly data: EventData;

  public constructor(data: EventData) {
    this.id = generateUUID();
    this.timestampMs = Date.now();
    this.data = data;
  }

  public toJSON(): EventPayload {
    return camelToUnderscore({
      id: this.id,
      timestampMs: this.timestampMs,
      type: this.EVENT_TYPE,
      eventName: this.data.eventName,
      appUserId: this.data.appUserId,
      context: {
        ...this.data.context,
      },
      properties: {
        ...this.data.properties,
        traceId: this.data.traceId,
        ...(this.data.workflowIdentifier !== undefined
          ? { workflowIdentifier: this.data.workflowIdentifier }
          : {}),
      },
    }) as EventPayload;
  }
}
