export class RetryWithBackoff {
  private readonly initialDelay: number;
  private timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  private currentDelay: number;
  private readonly maxDelay: number;
  private readonly callback: () => void;

  constructor(initialDelay: number, maxDelay: number, callback: () => void) {
    this.timeoutHandle = undefined;
    this.initialDelay = initialDelay;
    this.currentDelay = initialDelay;
    this.maxDelay = maxDelay;
    this.callback = callback;
    this.schedule();
  }

  private schedule() {
    this.timeoutHandle = setTimeout(() => {
      console.debug(`Executing callback after ${this.currentDelay}ms delay`);
      try {
        this.callback();
      } catch (error) {
        console.error("Error in RetryWithBackoff callback:", error);
      }
      this.schedule();
    }, this.currentDelay);
  }

  public backoff() {
    clearTimeout(this.timeoutHandle);
    this.currentDelay = Math.min(this.currentDelay * 2, this.maxDelay);
    console.debug(`Backing off to ${this.currentDelay}ms delay`);
    this.schedule();
  }

  public reset() {
    if (this.currentDelay !== this.initialDelay) {
      clearTimeout(this.timeoutHandle);
      this.currentDelay = this.initialDelay;
      console.debug(`Resetting to initial ${this.currentDelay}ms delay`);
      this.schedule();
    }
  }

  public stop() {
    clearTimeout(this.timeoutHandle);
  }
}
