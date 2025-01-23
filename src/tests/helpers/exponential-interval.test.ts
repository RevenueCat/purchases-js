import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { describe, type MockedFunction } from "vitest";
import { ExponentialInterval } from "../../helpers/exponential-interval";

describe("ExponentialInterval", () => {
  let interval: ExponentialInterval;
  let callbackSpy: MockedFunction<() => void>;

  beforeEach(() => {
    vi.useFakeTimers();
    callbackSpy = vi.fn();
    interval = new ExponentialInterval(1_000, 10_000, callbackSpy);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should start with the initial delay", () => {
    vi.advanceTimersByTime(1_000);
    expect(callbackSpy).toHaveBeenCalledTimes(1);
  });

  it("should increase delay exponentially when next is called", () => {
    vi.advanceTimersByTime(1_000);
    expect(callbackSpy).toHaveBeenCalledTimes(1);
    callbackSpy.mockClear();

    interval.increaseInterval();
    vi.advanceTimersByTime(2_000);
    expect(callbackSpy).toHaveBeenCalledTimes(1);
    callbackSpy.mockClear();

    interval.increaseInterval();
    vi.advanceTimersByTime(4_000);
    expect(callbackSpy).toHaveBeenCalledTimes(1);
    callbackSpy.mockClear();

    interval.increaseInterval();
    vi.advanceTimersByTime(8_000);
    expect(callbackSpy).toHaveBeenCalledTimes(1);
  });

  it("should respect maxDelay when increasing interval", () => {
    interval.increaseInterval(); // 2_000
    interval.increaseInterval(); // 4_000
    interval.increaseInterval(); // 8_000
    interval.increaseInterval(); // 10_000
    interval.increaseInterval(); // 10_000
    interval.increaseInterval(); // 10_000

    vi.advanceTimersByTime(60_000);
    expect(callbackSpy).toHaveBeenCalledTimes(6);
  });

  it("should reset to initial delay when reset is called", () => {
    interval.increaseInterval();
    vi.advanceTimersByTime(2_000);
    expect(callbackSpy).toHaveBeenCalledTimes(1);
    callbackSpy.mockClear();

    interval.resetInterval(1_000);
    vi.advanceTimersByTime(1_000);
    expect(callbackSpy).toHaveBeenCalledTimes(1);
  });

  it("should accept custom initial delay", () => {
    interval = new ExponentialInterval(500, 60_000, callbackSpy);
    vi.advanceTimersByTime(500);
    expect(callbackSpy).toHaveBeenCalledTimes(1);
  });
});
