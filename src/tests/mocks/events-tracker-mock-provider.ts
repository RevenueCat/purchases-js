import type { IEventsTracker } from "../../behavioural-events/events-tracker";
import { vi } from "vitest";

export function createEventsTrackerMock() {
  return {
    updateUser: vi.fn(),
    trackSDKEvent: vi.fn(),
    trackExternalEvent: vi.fn(),
    dispose: vi.fn(),
  } as unknown as IEventsTracker;
}
