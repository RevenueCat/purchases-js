import { camelToUnderscore } from "../helpers/camel-to-underscore";
import { v4 as uuidv4 } from "uuid";
import { buildEventContext } from "./sdk-event-context";

export type EventData = {
  eventName: string;
  traceId: string;
  checkoutSessionId: string | null;
  appUserId: string;
  properties: EventProperties;
};

type EventPropertySingleValue = string | number | boolean;

type EventPropertyValue =
  | null
  | EventPropertySingleValue
  | Array<EventPropertyValue>;

export interface EventProperties {
  [key: string]: EventPropertyValue;
}

type EventContextSingleValue = string | number | boolean;

type EventContextValue =
  | null
  | EventContextSingleValue
  | Array<EventContextValue>;

export type EventContext = {
  [key: string]: EventContextValue;
};

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
    this.id = uuidv4();
    this.timestampMs = Date.now();
    this.data = data;
  }

  public toJSON(): EventPayload {
    return {
      id: this.id,
      timestamp_ms: this.timestampMs,
      type: this.EVENT_TYPE,
      event_name: this.data.eventName,
      app_user_id: this.data.appUserId,
      context: {
        ...(camelToUnderscore(buildEventContext()) as EventContext),
      },
      properties: {
        ...(camelToUnderscore(this.data.properties) as EventProperties),
        trace_id: this.data.traceId,
        checkout_session_id: this.data.checkoutSessionId,
      },
    };
  }
}
