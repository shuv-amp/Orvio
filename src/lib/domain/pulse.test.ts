import { describe, expect, it } from "vitest";
import { initialMetrics } from "./seed";
import {
  deriveSignals,
  simulateGateSurge,
  simulateIncident,
  simulateJudgeDropout,
  simulateVenueRelocation,
} from "./pulse";

describe("Event Pulse", () => {
  it("detects all four documented risks from seeded metrics", () => {
    const signals = deriveSignals(initialMetrics);
    expect(signals.map((signal) => signal.type)).toEqual([
      "queue",
      "teams",
      "judging",
      "communication",
    ]);
    expect(
      signals.filter((signal) => signal.severity === "critical").length,
    ).toBeGreaterThanOrEqual(3);
  });

  it("keeps simulation in draft until human approval", () => {
    const proposal = simulateJudgeDropout(initialMetrics);
    expect(proposal.status).toBe("draft");
    expect(proposal.after.completionMinutes).toBeLessThan(
      proposal.before.completionMinutes,
    );
    expect(proposal.source).toBe("deterministic-fallback");
  });

  it.each([
    ["gate-surge", simulateGateSurge],
    ["venue-relocation", simulateVenueRelocation],
  ] as const)(
    "builds a bounded %s proposal with an honest comparison",
    (type, simulate) => {
      const proposal = simulate(initialMetrics);
      expect(proposal.status).toBe("draft");
      expect(proposal.comparison.afterValue).toBeLessThan(
        proposal.comparison.beforeValue,
      );
      expect(proposal.actions).toHaveLength(4);
      expect(simulateIncident(type, initialMetrics).id).toBe(proposal.id);
    },
  );

  it("reports healthy signals when operations have enough capacity", () => {
    const signals = deriveSignals({
      ...initialMetrics,
      arrivalRate: 10,
      scanThroughput: 20,
      unmatchedParticipants: 5,
      teamCutoffMinutes: 60,
      pendingReviews: 4,
      minutesRemaining: 120,
      announcementReach: 98,
    });
    expect(signals.every((signal) => signal.severity === "healthy")).toBe(true);
  });

  it("handles zero scanners and judges without division errors", () => {
    const signals = deriveSignals({
      ...initialMetrics,
      scanThroughput: 0,
      activeJudges: 0,
    });
    expect(signals.every((signal) => !signal.value.includes("Infinity"))).toBe(
      true,
    );
  });
});
