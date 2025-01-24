import { v4 as uuidv4 } from "uuid";
import { type Trace } from "./trace";

type EventType = "rcb_sdk_initialized";

export abstract class BaseEvent {
  public readonly id: string;
  public readonly timestamp: number;
  public readonly type: string;
  public readonly traceId: string;
  public readonly traceIndex: number;

  protected constructor(type: EventType, trace: Trace) {
    this.id = uuidv4();
    this.timestamp = Date.now();
    this.type = type;
    this.traceId = trace.trace_id;
    this.traceIndex = trace.nextTraceIndex();
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      timestamp: this.timestamp,
      type: this.type,
      trace_id: this.traceId,
      trace_index: this.traceIndex,
    };
  }
}

export class SDKInitializedEvent extends BaseEvent {
  public readonly sdkVersion: string;

  constructor(trace: Trace, sdkVersion: string) {
    super("rcb_sdk_initialized", trace);
    this.sdkVersion = sdkVersion;
  }

  public toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      sdk_version: this.sdkVersion,
    };
  }
}
