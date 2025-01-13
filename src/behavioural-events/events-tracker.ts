import type { BaseEvent, TrackedEvent } from "./event-types";
import { v4 as uuid } from "uuid";

export default class EventsTracker {
  private readonly eventsQueue: Array<TrackedEvent> = [];
  private flushingMutex: boolean = false;
  private readonly traceId: string = uuid();

  constructor() {
    console.debug(`Events tracker created for traceId ${this.traceId}`);
  }

  /**
   * @public
   * Enqueues the event to be tracked.
   * This method does not wait for the event to be tracked in order to avoid blocking
   * the function is called into.
   *
   * It will create a promise internally that will be resolved with no one listening.
   */
  public trackEvent(event: BaseEvent): void {
    console.debug(
      `Queueing event ${event.type} with properties ${JSON.stringify(event)}`,
    );
    this.eventsQueue.push({
      traceId: this.traceId,
      localTimeStamp: new Date().getTime(),
      localTimeStampISO: new Date().toISOString(),
      eventOrderInTrace: this.eventsQueue.length,
      baseEvent: event,
    });
    this.flushEvents();
  }

  public async flushEvents(): Promise<void> {
    if (this.eventsQueue.length === 0) {
      console.debug(`Nothing to flush`);
      return;
    }
    if (this.flushingMutex) {
      setTimeout(() => this.flushEvents(), 100);
    }
    this.flushingMutex = true;
    if (this.eventsQueue.length > 0) {
      // TODO: Implement the logic to send the events to the server.
      console.debug(`Flushing ${this.eventsQueue.length} events`);
    }
    this.flushingMutex = false;
  }
}
