import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { describe, type MockedFunction } from "vitest";
import { FlushManager } from "../../behavioural-events/flush-manager";

describe("RepeatWithBackoff", () => {
  let callbackSpy: MockedFunction<() => Promise<void>>;
  let flushManager: FlushManager;

  beforeEach(() => {
    vi.useFakeTimers();
    callbackSpy = vi.fn().mockReturnValue(Promise.resolve());
    flushManager = new FlushManager(1_000, 10_000, callbackSpy);
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
    callbackSpy.mockReturnValue(Promise.reject(new Error("Mocked error")));
    flushManager.tryFlush();
    expect(callbackSpy).toHaveBeenCalledTimes(1);
    callbackSpy.mockClear();

    flushManager.tryFlush();
    await vi.advanceTimersByTimeAsync(500);
    expect(callbackSpy).not.toHaveBeenCalled();
  });

  test("reschedules the callback when it is already running", async () => {
    callbackSpy.mockReturnValueOnce(
      new Promise((resolve) => setTimeout(() => resolve(), 10_000)),
    );
    callbackSpy.mockReturnValueOnce(Promise.resolve());

    // Immediate flush
    flushManager.tryFlush();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(callbackSpy).toHaveBeenCalledTimes(1);
    callbackSpy.mockClear();

    // Scheduled flush
    flushManager.tryFlush();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(callbackSpy).not.toHaveBeenCalled();
    callbackSpy.mockClear();
    await vi.advanceTimersByTimeAsync(8_000);
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
});
