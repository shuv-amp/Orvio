import { describe, expect, it } from "vitest";
import {
  analyticsSnapshot,
  attendancePercent,
  judgingProgressPercent,
} from "./analytics";
import { initialMetrics } from "./seed";

describe("organizer analytics", () => {
  it("computes attendance without a hardcoded percentage", () => {
    expect(attendancePercent(438, 512)).toBe(85.5);
    expect(attendancePercent(0, 0)).toBe(0);
  });

  it("computes judging progress from completed and pending reviews", () => {
    expect(judgingProgressPercent(78, 37)).toBe(68);
    expect(judgingProgressPercent(0, 0)).toBe(0);
  });

  it("updates the snapshot when check-ins change", () => {
    const afterScan = analyticsSnapshot({
      ...initialMetrics,
      checkedIn: initialMetrics.checkedIn + 1,
    });
    expect(afterScan.attendance).toBeGreaterThan(
      analyticsSnapshot(initialMetrics).attendance,
    );
  });
});
