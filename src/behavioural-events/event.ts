import { camelToUnderscore } from "../helpers/camel-to-underscore";
import { v4 as uuidv4 } from "uuid";

export type EventData = {
  eventName: string;
  traceId: string;
  checkoutSessionId: string | null;
  appUserId: string;
  userIsAnonymous: boolean;
  properties: EventProperties;
};

type EventPropertyValue =
  | string
  | number
  | boolean
  | null
  | EventPropertyArray
  | EventProperties;

export interface EventProperties {
  [key: string]: EventPropertyValue;
}

type EventPropertyArray = Array<EventPropertyValue>;

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

  public toJSON(): Record<
    string,
    string | number | boolean | null | EventProperties
  > {
    return {
      id: this.id,
      timestamp_ms: this.timestampMs,
      type: this.EVENT_TYPE,
      event_name: this.data.eventName,
      trace_id: this.data.traceId,
      checkout_session_id: this.data.checkoutSessionId,
      app_user_id: this.data.appUserId,
      user_is_anonymous: this.data.userIsAnonymous,
      properties: camelToUnderscore(this.data.properties) as EventProperties,
    };
  }
}
