import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { describe, type MockedFunction } from "vitest";
import type { FlushCallback } from "../../behavioural-events/flush-manager";
import { FlushManager } from "../../behavioural-events/flush-manager";

/** Returns a promise and its resolve function for tests that control resolution timing. */
function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe("FlushManager", () => {
  let callbackSpy: MockedFunction<FlushCallback>;
  let flushManager: FlushManager;

  beforeEach(() => {
    vi.useFakeTimers();
    callbackSpy = vi.fn().mockReturnValue(Promise.resolve(true));
    flushManager = new FlushManager(1_000, 10_000, 0, callbackSpy);
  });

  afterEach(() => {
    flushManager.stop();
    vi.useRealTimers();
  });

  test("expedites the callback when not backing off", async () => {
    flushManager.tryFlush();
    await vi.advanceTimersToNextTimerAsync();
    flushManager.tryFlush();
    await vi.advanceTimersToNextTimerAsync();
    flushManager.tryFlush();
    await vi.advanceTimersToNextTimerAsync();

    expect(callbackSpy).toHaveBeenCalledTimes(3);
  });

  test("does not expedite the callback when it is backing off", async () => {
    callbackSpy.mockReturnValue(
      Promise.reject(new Error("Mocked error")) as Promise<boolean>,
    );
    flushManager.tryFlush();
    expect(callbackSpy).toHaveBeenCalledTimes(1);
    callbackSpy.mockClear();

    flushManager.tryFlush();
    await vi.advanceTimersByTimeAsync(500);
    expect(callbackSpy).not.toHaveBeenCalled();
  });

  test("reschedules the callback when it is already running adding jitter", async () => {
    callbackSpy.mockReturnValueOnce(
      new Promise<boolean>((resolve) =>
        setTimeout(() => resolve(true), 10_000),
      ),
    );
    callbackSpy.mockReturnValueOnce(Promise.resolve(true));

    // Immediate flush
    flushManager.tryFlush();
    expect(callbackSpy).toHaveBeenCalledTimes(1);
    callbackSpy.mockClear();

    // Scheduled flush
    flushManager.tryFlush();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(callbackSpy).not.toHaveBeenCalled();
    callbackSpy.mockClear();
    await vi.advanceTimersByTimeAsync(9_000);
    expect(callbackSpy).toHaveBeenCalledTimes(1);
  });

  test("should increase delay exponentially when erroring repeatedly", async () => {
    callbackSpy.mockImplementation(() => {
      throw new Error("Mocked error");
    });
    flushManager.tryFlush();
    await vi.advanceTimersByTimeAsync(1_000 + 2_000 + 4_000 + 8_000 + 16_000);
    expect(callbackSpy).toHaveBeenCalledTimes(6);
  });

  test("should respect maxDelay when backoff is called", async () => {
    callbackSpy.mockImplementation(() => {
      throw new Error("Mocked error");
    });

    flushManager.tryFlush();

    await vi.advanceTimersByTimeAsync(
      1_000 + 2_000 + 4_000 + 8_000 + 10_000 + 10_000 + 10_000 + 10_000,
    );

    expect(callbackSpy).toHaveBeenCalledTimes(9);
  });

  test("should reset to initial delay when callback succeeds", async () => {
    callbackSpy.mockImplementationOnce(() => {
      throw new Error("Mocked error");
    });
    callbackSpy.mockImplementationOnce(() => {
      throw new Error("Mocked Error");
    });
    callbackSpy.mockImplementationOnce(() => {
      throw new Error("Mocked Error");
    });

    flushManager.tryFlush();

    await vi.advanceTimersByTimeAsync(1000 + 2_000 + 4_000);
    expect(callbackSpy).toHaveBeenCalledTimes(4);
  });

  test("adds jitter to the delay", async () => {
    const mathRandomSpy = vi.spyOn(Math, "random").mockReturnValue(1);

    flushManager = new FlushManager(1_000, 10_000, 0.1, callbackSpy);

    // Immediate flush
    flushManager.tryFlush();
    expect(callbackSpy).toHaveBeenCalledTimes(1);
    callbackSpy.mockClear();

    // Scheduled flush
    flushManager.tryFlush();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(callbackSpy).not.toHaveBeenCalled();

    // Scheduled flush adding jitter
    flushManager.tryFlush();
    await vi.advanceTimersByTimeAsync(101);
    expect(callbackSpy).toHaveBeenCalledTimes(1);

    mathRandomSpy.mockRestore();
  });

  test("start() resets backoff delay after failures", async () => {
    callbackSpy.mockImplementation(() => {
      throw new Error("Mocked error");
    });

    // Trigger backoff by failing multiple times
    flushManager.tryFlush();
    await vi.advanceTimersByTimeAsync(1_000 + 2_000 + 4_000);
    expect(callbackSpy).toHaveBeenCalledTimes(4);

    // Current delay should be 8000ms (exponential backoff)
    callbackSpy.mockClear();

    // Stop and restart - should reset backoff
    flushManager.stop();
    flushManager.start();

    // Now success should work immediately
    callbackSpy.mockReturnValue(Promise.resolve(true));
    flushManager.tryFlush();
    expect(callbackSpy).toHaveBeenCalledTimes(1);

    // Next attempt should use initial delay (1000ms), not backed-off delay
    callbackSpy.mockClear();
    flushManager.tryFlush();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(callbackSpy).toHaveBeenCalledTimes(1);
  });

  test("flushImmediately() clears timeout and runs callback once", async () => {
    flushManager.tryFlush();
    expect(callbackSpy).toHaveBeenCalledTimes(1);
    callbackSpy.mockClear();

    await vi.advanceTimersByTimeAsync(0);
    const result = flushManager.flushImmediately();
    expect(callbackSpy).toHaveBeenCalledTimes(1);
    await expect(result).resolves.toBe(true);
  });

  test("flushImmediately() returns callback result", async () => {
    callbackSpy.mockReturnValue(Promise.resolve(false));
    await expect(flushManager.flushImmediately()).resolves.toBe(false);

    callbackSpy.mockReturnValue(Promise.resolve(true));
    await expect(flushManager.flushImmediately()).resolves.toBe(true);
  });

  test("flushUntilDrain() runs callback until it returns true", async () => {
    let callCount = 0;
    callbackSpy.mockImplementation(async () => {
      callCount++;
      return callCount >= 3;
    });

    await flushManager.flushUntilDrain();

    expect(callCount).toBe(3);
  });

  test("flushUntilDrain() waits for in-flight flush before draining", async () => {
    const { promise: firstPromise, resolve: resolveFirst } =
      deferred<boolean>();
    callbackSpy
      .mockReturnValueOnce(firstPromise)
      .mockReturnValueOnce(Promise.resolve(true));

    flushManager.tryFlush();
    expect(callbackSpy).toHaveBeenCalledTimes(1);

    const drainPromise = flushManager.flushUntilDrain();
    await vi.advanceTimersByTimeAsync(0);
    resolveFirst(true);
    await drainPromise;

    expect(callbackSpy).toHaveBeenCalledTimes(2);
  });

  test("flushUntilDrain() restarts manager after drain", async () => {
    callbackSpy.mockReturnValue(Promise.resolve(true));
    await flushManager.flushUntilDrain();

    callbackSpy.mockClear();
    flushManager.tryFlush();
    await vi.advanceTimersToNextTimerAsync();
    expect(callbackSpy).toHaveBeenCalledTimes(1);
  });

  test("flushUntilDrain() restarts manager after callback throws", async () => {
    callbackSpy.mockImplementation(() => {
      throw new Error("Mocked error");
    });

    await flushManager.flushUntilDrain();

    callbackSpy.mockReturnValue(Promise.resolve(true));
    callbackSpy.mockClear();
    flushManager.tryFlush();
    await vi.advanceTimersToNextTimerAsync();
    expect(callbackSpy).toHaveBeenCalledTimes(1);
  });

  test("flushUntilDrain passes options to callback on each call", async () => {
    const options = { ignoreDisposed: true };
    callbackSpy.mockImplementation(async (opts) => {
      expect(opts).toBe(options);
      return true;
    });
    await flushManager.flushUntilDrain(options);
    expect(callbackSpy).toHaveBeenCalledWith(options);
  });
});
