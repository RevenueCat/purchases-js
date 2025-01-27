export class Mutex {
  private isLocked: boolean = false;
  private queue: Array<() => void> = [];

  async lock(): Promise<void> {
    if (this.isLocked) {
      await new Promise<void>((resolve) => this.queue.push(resolve));
    }
    this.isLocked = true;
  }

  unlock(): void {
    if (!this.isLocked) {
      throw new Error("Mutex is not locked");
    }
    this.isLocked = false;
    if (this.queue.length > 0) {
      const nextResolve = this.queue.shift();
      if (nextResolve) {
        this.isLocked = true;
        nextResolve();
      }
    }
  }
}
