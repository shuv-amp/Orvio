import { describe, expect, it } from "vitest";
import { initialMetrics, metricHistory, teams } from "./seed";
import { ALLOWED_INTERESTS, ALLOWED_ROLES } from "./registration";

/**
 * The dashboard prints a headline number and draws a sparkline beside it. If
 * the two ever disagree the tile is lying, so the relationship between the
 * series and the metric is asserted here rather than trusted.
 */
describe("metricHistory", () => {
  const series = Object.entries(metricHistory);

  it("gives every metric the same number of samples", () => {
    const lengths = new Set(series.map(([, values]) => values.length));
    expect(lengths.size).toBe(1);
    expect(series[0][1].length).toBeGreaterThanOrEqual(2);
  });

  it.each(series)("keeps %s non-negative", (_label, values) => {
    for (const value of values) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(value)).toBe(true);
    }
  });

  it("ends each series on the value the tile prints", () => {
    const last = <T>(values: readonly T[]) => values[values.length - 1];
    expect(last(metricHistory.checkedIn)).toBe(initialMetrics.checkedIn);
    expect(last(metricHistory.matched)).toBe(
      initialMetrics.totalParticipants - initialMetrics.unmatchedParticipants,
    );
    expect(last(metricHistory.announcementReach)).toBe(
      initialMetrics.announcementReach,
    );
    expect(last(metricHistory.judgingProgress)).toBe(
      Math.round(
        (initialMetrics.completedReviews /
          (initialMetrics.completedReviews + initialMetrics.pendingReviews)) *
          100,
      ),
    );
  });
});

describe("initialMetrics", () => {
  it("never reports more attendance than registrations", () => {
    expect(initialMetrics.checkedIn).toBeLessThanOrEqual(
      initialMetrics.totalParticipants,
    );
    expect(initialMetrics.unmatchedParticipants).toBeLessThanOrEqual(
      initialMetrics.totalParticipants,
    );
  });

  it("expresses reach as a percentage", () => {
    expect(initialMetrics.announcementReach).toBeGreaterThanOrEqual(0);
    expect(initialMetrics.announcementReach).toBeLessThanOrEqual(100);
  });
});

describe("teams", () => {
  it("uses a unique id per team and per member", () => {
    const ids = teams.map((team) => team.id);
    expect(new Set(ids).size).toBe(ids.length);
    const memberIds = teams.flatMap((team) =>
      team.members.map((member) => member.id),
    );
    expect(new Set(memberIds).size).toBe(memberIds.length);
  });

  it("keeps published scores inside the rubric range", () => {
    for (const team of teams) {
      expect(team.score).toBeGreaterThanOrEqual(0);
      expect(team.score).toBeLessThanOrEqual(100);
      expect(team.judged).toBeLessThanOrEqual(3);
    }
  });

  it("draws seeded member interests from the registration taxonomy", () => {
    const allowed = new Set<string>(ALLOWED_INTERESTS);
    for (const team of teams) {
      for (const member of team.members) {
        for (const interest of member.interests) {
          expect(allowed.has(interest)).toBe(true);
        }
      }
    }
  });

  it("keeps availability a normalised fraction", () => {
    for (const team of teams) {
      for (const member of team.members) {
        expect(member.availability).toBeGreaterThan(0);
        expect(member.availability).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe("ALLOWED_ROLES", () => {
  it("has no duplicates", () => {
    expect(new Set(ALLOWED_ROLES).size).toBe(ALLOWED_ROLES.length);
  });
});
