import { Logger } from "../helpers/logger";

export class FlushManager {
  private readonly initialDelay: number;
  private readonly maxDelay: number;
  private readonly jitterPercent: number;
  private readonly callback: () => Promise<void>;
  private currentDelay: number;
  private timeoutId: ReturnType<typeof setTimeout> | undefined = undefined;
  private executingCallback: boolean = false;

  constructor(
    initialDelay: number,
    maxDelay: number,
    jitterPercent: number,
    callback: () => Promise<void>,
  ) {
    this.initialDelay = initialDelay;
    this.currentDelay = initialDelay;
    this.maxDelay = maxDelay;
    this.jitterPercent = jitterPercent;
    this.callback = callback;
  }

  public tryFlush() {
    if (this.backingOff()) {
      Logger.debugLog(`Backing off, not flushing`);
      return;
    }

    this.clearTimeout();
    this.executeCallbackWithRetries();
  }

  public stop() {
    this.clearTimeout();
  }

  public schedule(delay?: number) {
    if (this.timeoutId !== undefined) {
      return;
    }

    const delayWithJitter = this.addJitter(delay || this.currentDelay);
    this.timeoutId = setTimeout(() => {
      this.timeoutId = undefined;
      this.executeCallbackWithRetries();
    }, delayWithJitter);
  }

  private backoff() {
    const delay = this.currentDelay;
    const newDelay = Math.min(this.currentDelay * 2, this.maxDelay);
    Logger.debugLog(`Backing next off to ${delay}ms delay`);
    this.clearTimeout();
    this.currentDelay = newDelay;
    this.schedule(delay);
  }

  private reset() {
    if (this.currentDelay !== this.initialDelay) {
      this.clearTimeout();
      this.currentDelay = this.initialDelay;
    }
  }

  private async executeCallbackWithRetries() {
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

  private addJitter(interval: number): number {
    const jitter = interval * this.jitterPercent;
    const min = interval - jitter;
    const max = interval + jitter;
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
}
