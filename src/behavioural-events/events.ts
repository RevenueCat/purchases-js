import { v4 as uuidv4 } from "uuid";
import { type Trace } from "./trace";

type EventType = "web_billing_sdk_initialized";

export abstract class BaseEvent {
  public readonly id: string;
  public readonly timestamp: number;
  public readonly type: string;
  public readonly traceId: string;
  public readonly traceIndex: number;
  public readonly appUserId: string | null;

  protected constructor(
    type: EventType,
    trace: Trace,
    appUserId: string | null,
  ) {
    this.id = uuidv4();
    this.timestamp = Date.now();
    this.type = type;
    this.traceId = trace.trace_id;
    this.traceIndex = trace.nextTraceIndex();
    this.appUserId = appUserId;
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      timestamp: this.timestamp,
      type: this.type,
      trace_id: this.traceId,
      trace_index: this.traceIndex,
      app_user_id: this.appUserId,
    };
  }
}

export class SDKInitializedEvent extends BaseEvent {
  public readonly sdkVersion: string;

  constructor(trace: Trace, sdkVersion: string, appUserId: string | null) {
    super("web_billing_sdk_initialized", trace, appUserId);
    this.sdkVersion = sdkVersion;
  }

  public toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      sdk_version: this.sdkVersion,
    };
  }
}
