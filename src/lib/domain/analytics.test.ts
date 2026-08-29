import { describe, expect, it } from "vitest";
import {
  analyticsRows,
  analyticsSnapshot,
  attendancePercent,
  fullyReviewedTeams,
  gateHeadroomPercent,
  judgingProgressPercent,
  teamFormationPercent,
} from "./analytics";
import { initialMetrics, teams } from "./seed";
import type { EventMetrics } from "./types";

describe("attendancePercent", () => {
  it("reports one decimal place", () => {
    expect(attendancePercent(438, 512)).toBe(85.5);
  });

  it("never divides by zero", () => {
    expect(attendancePercent(0, 0)).toBe(0);
  });

  it("handles the full and empty ends", () => {
    expect(attendancePercent(50, 50)).toBe(100);
    expect(attendancePercent(0, 50)).toBe(0);
  });
});

describe("judgingProgressPercent", () => {
  it("is the completed share of the total load", () => {
    expect(judgingProgressPercent(78, 37)).toBe(68);
    expect(judgingProgressPercent(10, 10)).toBe(50);
  });

  it("reports complete when nothing is pending", () => {
    expect(judgingProgressPercent(12, 0)).toBe(100);
  });

  it("does not divide by zero with no reviews at all", () => {
    expect(judgingProgressPercent(0, 0)).toBe(0);
  });
});

describe("teamFormationPercent", () => {
  it("counts matched participants against the roster", () => {
    expect(teamFormationPercent(512, 61)).toBe(88);
    expect(teamFormationPercent(100, 0)).toBe(100);
  });

  it("never reports a negative share", () => {
    expect(teamFormationPercent(10, 50)).toBe(0);
  });

  it("does not divide by zero on an empty roster", () => {
    expect(teamFormationPercent(0, 0)).toBe(0);
  });
});

describe("gateHeadroomPercent", () => {
  it("is under one hundred when a queue is forming", () => {
    expect(gateHeadroomPercent(20, 26)).toBe(77);
  });

  it("is at or above one hundred when the gate keeps up", () => {
    expect(gateHeadroomPercent(26, 26)).toBe(100);
    expect(gateHeadroomPercent(40, 20)).toBe(200);
  });

  it("does not divide by a zero arrival rate", () => {
    expect(gateHeadroomPercent(10, 0)).toBe(1000);
  });
});

describe("fullyReviewedTeams", () => {
  it("counts only teams with every required review", () => {
    expect(fullyReviewedTeams(teams)).toBe(
      teams.filter((team) => team.judged >= 3).length,
    );
  });

  it("respects a different review requirement", () => {
    expect(fullyReviewedTeams(teams, 1)).toBe(teams.length);
    expect(fullyReviewedTeams(teams, 99)).toBe(0);
  });

  it("returns zero for no teams", () => {
    expect(fullyReviewedTeams([])).toBe(0);
  });
});

describe("analyticsRows", () => {
  const rows = analyticsRows(initialMetrics, teams);

  it("returns one row per tracked measure with a unique id", () => {
    expect(rows).toHaveLength(6);
    expect(new Set(rows.map((row) => row.id)).size).toBe(rows.length);
  });

  it("keeps every meter fill inside the drawable range", () => {
    for (const row of rows) {
      expect(row.fill).toBeGreaterThanOrEqual(0);
      expect(row.fill).toBeLessThanOrEqual(100);
    }
  });

  it("clamps the fill when a value exceeds one hundred percent", () => {
    const surplus: EventMetrics = {
      ...initialMetrics,
      scanThroughput: 90,
      arrivalRate: 10,
    };
    const headroom = analyticsRows(surplus, teams).find(
      (row) => row.id === "headroom",
    );
    expect(headroom?.value).toBe(900);
    expect(headroom?.fill).toBe(100);
  });

  it("bands every row and keeps the word as the primary cue", () => {
    for (const row of rows) {
      expect(["healthy", "watch", "critical"]).toContain(row.tone);
    }
  });

  it("flags the gate as critical when arrivals outpace scanning", () => {
    const squeezed = analyticsRows(
      { ...initialMetrics, scanThroughput: 10, arrivalRate: 40 },
      teams,
    );
    expect(squeezed.find((row) => row.id === "headroom")?.tone).toBe(
      "critical",
    );
  });

  it("reports a healthy gate once scanning keeps up", () => {
    const clear = analyticsRows(
      { ...initialMetrics, scanThroughput: 40, arrivalRate: 20 },
      teams,
    );
    expect(clear.find((row) => row.id === "headroom")?.tone).toBe("healthy");
  });

  it("gives every row a sentence, so colour is never the only cue", () => {
    for (const row of rows) {
      expect(row.detail.length).toBeGreaterThan(20);
      expect(row.detail.endsWith(".")).toBe(true);
    }
  });

  it("agrees with the control tower snapshot", () => {
    const snapshot = analyticsSnapshot(initialMetrics);
    expect(rows.find((row) => row.id === "attendance")?.value).toBe(
      snapshot.attendance,
    );
    expect(rows.find((row) => row.id === "judging")?.value).toBe(
      snapshot.judging,
    );
    expect(rows.find((row) => row.id === "reach")?.value).toBe(snapshot.reach);
  });

  it("survives an empty event without dividing by zero", () => {
    const empty: EventMetrics = {
      ...initialMetrics,
      totalParticipants: 0,
      checkedIn: 0,
      unmatchedParticipants: 0,
      completedReviews: 0,
      pendingReviews: 0,
      arrivalRate: 0,
    };
    for (const row of analyticsRows(empty, [])) {
      expect(Number.isFinite(row.value)).toBe(true);
      expect(Number.isFinite(row.fill)).toBe(true);
    }
  });
});

describe("analyticsSnapshot", () => {
  it("summarises the live slice for the control tower tiles", () => {
    expect(analyticsSnapshot(initialMetrics)).toEqual({
      attendance: 85.5,
      judging: 68,
      reach: initialMetrics.announcementReach,
      matched:
        initialMetrics.totalParticipants - initialMetrics.unmatchedParticipants,
    });
  });
});
