import { Logger } from "../helpers/logger";

export class FlushManager {
  private readonly initialDelay: number;
  private readonly maxDelay: number;
  private readonly callback: () => Promise<void>;
  private currentDelay: number;
  private timeoutId: ReturnType<typeof setTimeout> | undefined = undefined;
  private executingCallback: boolean = false;

  constructor(
    initialDelay: number,
    maxDelay: number,
    callback: () => Promise<void>,
  ) {
    this.initialDelay = initialDelay;
    this.currentDelay = initialDelay;
    this.maxDelay = maxDelay;
    this.callback = callback;
  }

  public tryFlush() {
    if (this.backingOff()) {
      Logger.log(`Backing off, not flushing`);
      return;
    }

    Logger.log(`Flushing immediately`);
    this.clearTimeout();
    this.executeCallbackRecursively();
  }

  public stop() {
    this.clearTimeout();
  }

  public schedule(delay?: number) {
    if (this.timeoutId !== undefined) {
      Logger.log(`Already scheduled`);
      return;
    }

    Logger.log(`Scheduling callback after ${this.currentDelay}ms delay`);
    this.timeoutId = setTimeout(() => {
      this.timeoutId = undefined;
      Logger.log(`Executing callback after ${this.currentDelay}ms delay`);
      this.executeCallbackRecursively();
    }, delay || this.currentDelay);
  }

  private backoff() {
    const delay = this.currentDelay;
    const newDelay = Math.min(this.currentDelay * 2, this.maxDelay);
    Logger.log(`Backing next off to ${delay}ms delay`);
    this.clearTimeout();
    this.currentDelay = newDelay;
    this.schedule(delay);
  }

  private reset() {
    if (this.currentDelay !== this.initialDelay) {
      Logger.log(`Resetting to initial ${this.initialDelay}ms delay`);
      this.clearTimeout();
      this.currentDelay = this.initialDelay;
    }
  }

  private async executeCallbackRecursively() {
    if (this.executingCallback) {
      Logger.debugLog("Callback already running, rescheduling");
      this.schedule();
      return;
    }

    this.executingCallback = true;

    try {
      await this.callback();
      this.reset();
    } catch {
      this.backoff();
    } finally {
      this.executingCallback = false;
    }
  }

  private backingOff() {
    return this.currentDelay > this.initialDelay;
  }

  private clearTimeout() {
    clearTimeout(this.timeoutId);
    this.timeoutId = undefined;
  }
}
