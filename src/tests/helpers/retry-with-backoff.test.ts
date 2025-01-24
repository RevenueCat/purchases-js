import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { describe, type MockedFunction } from "vitest";
import { RetryWithBackoff } from "../../helpers/retry-with-backoff";

describe("RetryWithBackoff", () => {
  let retry: RetryWithBackoff;
  let callbackSpy: MockedFunction<() => void>;

  beforeEach(() => {
    vi.useFakeTimers();
    callbackSpy = vi.fn();
    retry = new RetryWithBackoff(1_000, 10_000, callbackSpy);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should start with the initial delay", () => {
    vi.advanceTimersByTime(1_000);
    expect(callbackSpy).toHaveBeenCalledTimes(1);
  });

  it("should increase delay exponentially when backoff is called", () => {
    vi.advanceTimersByTime(1_000);
    expect(callbackSpy).toHaveBeenCalledTimes(1);
    callbackSpy.mockClear();

    retry.backoff();
    vi.advanceTimersByTime(2_000);
    expect(callbackSpy).toHaveBeenCalledTimes(1);
    callbackSpy.mockClear();

    retry.backoff();
    vi.advanceTimersByTime(4_000);
    expect(callbackSpy).toHaveBeenCalledTimes(1);
    callbackSpy.mockClear();

    retry.backoff();
    vi.advanceTimersByTime(8_000);
    expect(callbackSpy).toHaveBeenCalledTimes(1);
  });

  it("should respect maxDelay when backoff is called", () => {
    retry.backoff(); // 2_000
    retry.backoff(); // 4_000
    retry.backoff(); // 8_000
    retry.backoff(); // 10_000
    retry.backoff(); // 10_000
    retry.backoff(); // 10_000

    vi.advanceTimersByTime(60_000);
    expect(callbackSpy).toHaveBeenCalledTimes(6);
  });

  it("should reset to initial delay when reset is called", () => {
    retry.backoff();
    retry.backoff();
    retry.backoff();
    vi.advanceTimersByTime(2_000);
    expect(callbackSpy).toHaveBeenCalledTimes(0);
    callbackSpy.mockClear();

    retry.reset();
    vi.advanceTimersByTime(1_000);
    expect(callbackSpy).toHaveBeenCalledTimes(1);
  });

  it("should accept custom initial delay", () => {
    retry = new RetryWithBackoff(500, 60_000, callbackSpy);
    vi.advanceTimersByTime(500);
    expect(callbackSpy).toHaveBeenCalledTimes(1);
  });
});
