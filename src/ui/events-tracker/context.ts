import { type IEventsTracker } from "../..//behavioural-events/events-tracker";

export const eventsTrackerContextKey = "rcb-ui-tracking";

export interface EventsTrackerContext {
  eventsTracker: IEventsTracker;
  appUserId: string;
  userIsAnonymous: boolean;
}
