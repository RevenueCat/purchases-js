import { Logger } from "../helpers/logger";

export interface FlushOptions {
  /**
   * When true, the callback should flush until the queue is empty even if the
   * tracker is disposed. Used by dispose() so the same drain path sends all batches.
   */
  ignoreDisposed?: boolean;
}

/**
 * Callback returns true when the queue is empty (no more work to flush).
 */
export type FlushCallback = (options?: FlushOptions) => Promise<boolean>;

export class FlushManager {
  private readonly initialDelay: number;
  private readonly maxDelay: number;
  private readonly jitterPercent: number;
  private readonly callback: FlushCallback;
  private currentDelay: number;
  private timeoutId: ReturnType<typeof setTimeout> | undefined = undefined;
  private executingCallback: boolean = false;
  private stopped: boolean = false;
  private currentFlushPromise: Promise<void> | null = null;

  constructor(
    initialDelay: number,
    maxDelay: number,
    jitterPercent: number,
    callback: FlushCallback,
  ) {
    this.initialDelay = initialDelay;
    this.currentDelay = initialDelay;
    this.maxDelay = maxDelay;
    this.jitterPercent = jitterPercent;
    this.callback = callback;
  }

  public tryFlush() {
    if (this.stopped) {
      return;
    }

    if (this.backingOff()) {
      Logger.debugLog(`Backing off, not flushing`);
      return;
    }

    this.clearTimeout();
    this.executeCallbackWithRetries().catch(() => {
      // Rejection already handled in executeCallbackWithRetries (backoff)
    });
  }

  public start() {
    this.stopped = false;
    this.currentDelay = this.initialDelay; // Reset backoff state
  }

  public stop() {
    this.stopped = true;
    this.clearTimeout();
  }

  /**
   * Clears any scheduled flush and runs the callback once.
   * Returns the callback result (true = queue empty).
   * Runs the callback even when stopped (used by flushUntilDrain).
   */
  public flushImmediately(options?: FlushOptions): Promise<boolean> {
    this.clearTimeout();
    return this.executeCallbackWithRetries(options);
  }

  /**
   * Waits for any in-flight flush, then stops scheduling, runs the callback until it reports queue empty (or throws), then starts again.
   */
  public async flushUntilDrain(options?: FlushOptions): Promise<void> {
    const inFlight = this.currentFlushPromise;
    if (inFlight) {
      try {
        await inFlight;
      } catch {
        // Ignore errors; callback already handled backoff
      }
    }

    this.stop();
    try {
      let queueEmpty = false;
      while (!queueEmpty) {
        queueEmpty = await this.flushImmediately(options);
      }
    } finally {
      this.start();
    }
  }

  public schedule(delay?: number) {
    if (this.stopped) {
      return;
    }

    if (this.timeoutId !== undefined) {
      return;
    }

    const delayWithJitter = this.addJitter(delay || this.currentDelay);
    this.timeoutId = setTimeout(() => {
      this.timeoutId = undefined;
      this.executeCallbackWithRetries().catch(() => {
        // Rejection already handled in executeCallbackWithRetries (backoff)
      });
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

  private async executeCallbackWithRetries(
    options?: FlushOptions,
  ): Promise<boolean> {
    if (this.executingCallback) {
      Logger.debugLog("Callback already running, rescheduling");
      this.schedule();
      return true;
    }

    this.executingCallback = true;
    let callbackPromise: Promise<boolean>;
    try {
      callbackPromise = Promise.resolve(this.callback(options));
    } catch (e) {
      callbackPromise = Promise.reject(e);
    }
    // Exposed promise resolves when flush completes (success or failure) to avoid unhandled rejections
    this.currentFlushPromise = callbackPromise.then(
      () => undefined,
      () => undefined,
    );

    try {
      const queueEmpty = await callbackPromise;
      this.reset();
      return queueEmpty;
    } catch {
      this.backoff();
      return true; // Treat error as "stop draining" to avoid infinite retry in flushUntilDrain
    } finally {
      this.executingCallback = false;
      this.currentFlushPromise = null;
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
