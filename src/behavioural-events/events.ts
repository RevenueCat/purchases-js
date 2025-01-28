import { camelToUnderscore } from "../helpers/camel-to-underscore";
import { v4 as uuidv4 } from "uuid";

enum EventType {
  WEB_BILLING_SDK_INITIALIZED = "web_billing_sdk_initialized",
}

interface EventData extends Record<string, unknown> {
  traceId: string;
  appUserId: string | null;
}

interface SDKInitializedEventData extends EventData {
  sdkVersion: string;
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

export class SDKInitializedEvent extends BaseEvent {
  public readonly data: SDKInitializedEventData;

  constructor(props: SDKInitializedEventData) {
    super(EventType.WEB_BILLING_SDK_INITIALIZED);
    this.data = props;
  }

  public toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(this.data),
    };
  }
}
