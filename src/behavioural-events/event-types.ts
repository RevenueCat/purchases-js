export type EventName = "SDK_INITIALIZED";

export interface BaseEvent {
  type: "rc_billing_event";
}

export interface TrackedEvent extends BaseEvent {
  event_name: EventName;
  //traceId: string;
  //localTimeStamp: number;
  //localTimeStampISO: string;
  //eventOrderInTrace: number;
  //baseEvent: BaseEvent;
}

export interface SDKInitializedEvent extends TrackedEvent {
  event_name: "SDK_INITIALIZED";
  sdk_version: string;
}
