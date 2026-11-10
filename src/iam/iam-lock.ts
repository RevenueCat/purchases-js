/**
 * Runs IAM session operations (login, refresh, logout) one at a time.
 *
 * khepri's refresh grace window mints a new successor for every concurrent
 * refresh of the same token, so two tabs refreshing at once would fork the
 * session. A Web Lock serializes them across tabs; callers re-read storage
 * inside the lock so the tab that waited picks up the winner's session.
 * Without Web Locks the operations are still serialized within this tab.
 */
export class IamLock {
  private tail: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly name: string,
    private readonly locks: LockManager | null = defaultLockManager(),
  ) {}

  run<T>(operation: () => Promise<T>): Promise<T> {
    const locks = this.locks;
    const exclusive = locks
      ? () => locks.request(this.name, operation)
      : operation;
    const result = this.tail.then(exclusive, exclusive);
    this.tail = result.catch(() => undefined);
    return result;
  }
}

function defaultLockManager(): LockManager | null {
  if (typeof navigator === "undefined") {
    return null;
  }
  return navigator.locks ?? null;
}
