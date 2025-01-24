export class RetryWithBackoff {
  private readonly initialInterval: number;
  private intervalHandle: ReturnType<typeof setTimeout> | undefined;
  private interval: number;
  private readonly maxInterval: number;
  private readonly callback: () => void;

  constructor(
    initialInterval: number,
    maxInterval: number,
    callback: () => void,
  ) {
    this.intervalHandle = undefined;
    this.initialInterval = initialInterval;
    this.interval = initialInterval;
    this.maxInterval = maxInterval;
    this.callback = callback;
    this.startInterval();
  }

  private startInterval() {
    this.intervalHandle = setInterval(() => {
      console.debug(`Interval flush after ${this.interval} ms`);
      this.callback();
    }, this.interval);
  }

  public increaseInterval() {
    clearInterval(this.intervalHandle);
    this.interval = Math.min(this.interval * 2, this.maxInterval);
    console.debug(`Increasing interval to ${this.interval} ms`);
    this.startInterval();
  }

  public resetInterval() {
    if (this.interval !== this.initialInterval) {
      clearInterval(this.intervalHandle);
      this.interval = this.initialInterval;
      console.debug(`Resetting interval to ${this.interval} ms`);
      this.startInterval();
    }
  }

  public dispose() {
    clearInterval(this.intervalHandle);
  }
}
