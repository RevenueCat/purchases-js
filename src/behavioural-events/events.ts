import { v4 as uuidv4 } from "uuid";

type EventType = "web_billing_sdk_initialized";

export abstract class BaseEvent {
  public readonly id: string;
  public readonly timestampMs: number;
  public readonly type: string;
  public readonly traceId: string;
  public readonly appUserId: string | null;

  protected constructor(
    type: EventType,
    traceId: string,
    appUserId: string | null,
  ) {
    this.id = uuidv4();
    this.timestampMs = Date.now();
    this.type = type;
    this.traceId = traceId;
    this.appUserId = appUserId;
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      timestamp_ms: this.timestampMs,
      type: this.type,
      trace_id: this.traceId,
      app_user_id: this.appUserId,
    };
  }
}

export class SDKInitializedEvent extends BaseEvent {
  public readonly sdkVersion: string;

  constructor(traceId: string, appUserId: string | null, sdkVersion: string) {
    super("web_billing_sdk_initialized", traceId, appUserId);
    this.sdkVersion = sdkVersion;
  }

  public toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      sdk_version: this.sdkVersion,
    };
  }
}
