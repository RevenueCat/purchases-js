import { describe, expect, test, vi } from "vitest";
import { IamLock } from "../../iam/iam-lock";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => (resolve = r));
  return { promise, resolve };
}

describe("IamLock", () => {
  test("runs operations one at a time without Web Locks", async () => {
    const lock = new IamLock("test", null);
    const first = deferred();
    const order: string[] = [];

    const a = lock.run(async () => {
      order.push("a:start");
      await first.promise;
      order.push("a:end");
    });
    const b = lock.run(async () => {
      order.push("b");
    });

    await Promise.resolve();
    expect(order).toEqual(["a:start"]);
    first.resolve();
    await Promise.all([a, b]);
    expect(order).toEqual(["a:start", "a:end", "b"]);
  });

  test("keeps running after an operation fails", async () => {
    const lock = new IamLock("test", null);

    await expect(
      lock.run(async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    await expect(lock.run(async () => "next")).resolves.toBe("next");
  });

  test("uses the Web Lock with its name when available", async () => {
    const request = vi.fn((_name: string, callback: () => Promise<unknown>) =>
      callback(),
    );
    const lock = new IamLock("revenuecat.iam.key", {
      request,
    } as unknown as LockManager);

    await expect(lock.run(async () => "value")).resolves.toBe("value");
    expect(request).toHaveBeenCalledWith(
      "revenuecat.iam.key",
      expect.any(Function),
    );
  });
});
