export type EventType = "sdk_initialized";

export interface BaseEvent {
  type: EventType;
}

export interface SDKInitializedEvent extends BaseEvent {
  type: "sdk_initialized";
  sdkVersion: string;
}

export interface TrackedEvent {
  traceId: string;
  localTimeStamp: number;
  localTimeStampISO: string;
  eventOrderInTrace: number;
  baseEvent: BaseEvent;
}
