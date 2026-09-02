import type { IEventsTracker } from "../../behavioural-events/events-tracker";
import {
  PaywallEvent,
  type PaywallEventData,
} from "../../behavioural-events/paywall-event";
import { vi } from "vitest";

export function createEventsTrackerMock() {
  return {
    updateUser: vi.fn(),
    trackSDKEvent: vi.fn(),
    trackExternalEvent: vi.fn(),
    trackPaywallEvent: vi.fn(
      (data: PaywallEventData) => new PaywallEvent(data),
    ),
    trackCustomPaywallImpression: vi.fn(),
    dispose: vi.fn(),
  } as unknown as IEventsTracker;
}
