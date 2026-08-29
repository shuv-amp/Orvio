import { afterEach, describe, expect, it, vi } from "vitest";
import {
  allowRequest,
  clearRateLimitsForTesting,
  limitFor,
} from "./rate-limit";

afterEach(() => {
  clearRateLimitsForTesting();
  vi.useRealTimers();
});

describe("bounded rate limiting", () => {
  it("enforces a fixed-window request limit", () => {
    expect(allowRequest("scanner", 2)).toBe(true);
    expect(allowRequest("scanner", 2)).toBe(true);
    expect(allowRequest("scanner", 2)).toBe(false);
  });

  it("allows traffic after the window expires", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-29T10:00:00Z"));
    expect(allowRequest("scanner", 1, 1_000)).toBe(true);
    expect(allowRequest("scanner", 1, 1_000)).toBe(false);
    vi.advanceTimersByTime(1_001);
    expect(allowRequest("scanner", 1, 1_000)).toBe(true);
  });

  it("fails closed for new keys when cardinality reaches its cap", () => {
    for (let index = 0; index < 5_000; index += 1)
      expect(allowRequest(`source-${index}`)).toBe(true);
    expect(allowRequest("attacker-new-source")).toBe(false);
  });
});

describe("limitFor", () => {
  it("keeps the strict production allowance for a real identity", () => {
    expect(limitFor(false, 20)).toBe(20);
    expect(limitFor(false, 10)).toBe(10);
  });

  it("widens the allowance for the shared synthetic demo identity", () => {
    expect(limitFor(true, 20)).toBe(120);
    expect(limitFor(true, 10)).toBe(60);
  });

  it("is always at least as large as the production allowance", () => {
    for (const base of [1, 5, 10, 30, 100]) {
      expect(limitFor(true, base)).toBeGreaterThanOrEqual(
        limitFor(false, base),
      );
    }
  });
});
