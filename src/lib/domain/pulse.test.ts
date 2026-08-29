import { describe, expect, it } from "vitest";
import { initialMetrics } from "./seed";
import { deriveSignals, simulateJudgeDropout } from "./pulse";

describe("Event Pulse", () => {
  it("detects all four documented risks from seeded metrics", () => {
    const signals = deriveSignals(initialMetrics);
    expect(signals.map((signal) => signal.type)).toEqual(["queue", "teams", "judging", "communication"]);
    expect(signals.filter((signal) => signal.severity === "critical").length).toBeGreaterThanOrEqual(3);
  });

  it("keeps simulation in draft until human approval", () => {
    const proposal = simulateJudgeDropout(initialMetrics);
    expect(proposal.status).toBe("draft");
    expect(proposal.after.completionMinutes).toBeLessThan(proposal.before.completionMinutes);
    expect(proposal.source).toBe("deterministic-fallback");
  });
});
