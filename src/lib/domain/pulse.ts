import type { EventMetrics, EventSignal, RecoveryProposal } from "./types";

export function deriveSignals(metrics: EventMetrics): EventSignal[] {
  const queueRatio = metrics.arrivalRate / Math.max(1, metrics.scanThroughput);
  const unmatchedRatio = metrics.unmatchedParticipants / Math.max(1, metrics.totalParticipants);
  const judgingMinutes = (metrics.pendingReviews * metrics.averageReviewMinutes) / Math.max(1, metrics.activeJudges);

  return [
    {
      id: "signal-queue",
      type: "queue",
      title: "North Gate congestion",
      severity: queueRatio > 1.2 ? "critical" : queueRatio > 1 ? "watch" : "healthy",
      value: `${metrics.arrivalRate}/min arriving · ${metrics.scanThroughput}/min scanned`,
      evidence: `Arrival demand is ${Math.round((queueRatio - 1) * 100)}% above current throughput.`,
      recommendation: "Open the volunteer scanner lane and route pre-verified attendees to Gate B.",
    },
    {
      id: "signal-teams",
      type: "teams",
      title: "Team formation cutoff",
      severity: unmatchedRatio > 0.1 && metrics.teamCutoffMinutes < 30 ? "critical" : unmatchedRatio > 0.05 ? "watch" : "healthy",
      value: `${metrics.unmatchedParticipants} people · ${metrics.teamCutoffMinutes} min left`,
      evidence: `${Math.round(unmatchedRatio * 100)}% of registered participants remain unmatched.`,
      recommendation: "Open Match Lab recommendations and invite participants into teams with complementary gaps.",
    },
    {
      id: "signal-judging",
      type: "judging",
      title: "Judging completion risk",
      severity: judgingMinutes > metrics.minutesRemaining ? "critical" : judgingMinutes > metrics.minutesRemaining * 0.8 ? "watch" : "healthy",
      value: `${Math.ceil(judgingMinutes)} min projected · ${metrics.minutesRemaining} min available`,
      evidence: `${metrics.pendingReviews} reviews are distributed across ${metrics.activeJudges} active judges.`,
      recommendation: "Rebalance unstarted assignments while preserving conflict-of-interest constraints.",
    },
    {
      id: "signal-comms",
      type: "communication",
      title: "Critical update reach",
      severity: metrics.announcementReach < 60 && metrics.announcementAgeMinutes >= 10 ? "critical" : metrics.announcementReach < 80 ? "watch" : "healthy",
      value: `${metrics.announcementReach}% reached · ${metrics.announcementAgeMinutes} min ago`,
      evidence: `${100 - metrics.announcementReach}% have not acknowledged the schedule update.`,
      recommendation: "Escalate to push and target only attendees who have not acknowledged the update.",
    },
  ];
}

export function simulateJudgeDropout(metrics: EventMetrics): RecoveryProposal {
  const overloadedJudges = Math.max(1, Math.ceil(metrics.pendingReviews / 10));
  const beforeMinutes = Math.ceil((metrics.pendingReviews * metrics.averageReviewMinutes) / Math.max(1, metrics.activeJudges - 1));
  const afterMinutes = Math.ceil((metrics.pendingReviews * (metrics.averageReviewMinutes - 1)) / Math.max(1, metrics.activeJudges));

  return {
    id: "recovery-judge-dropout",
    incident: "Judge unavailable with 37 reviews pending",
    status: "draft",
    before: { completionMinutes: beforeMinutes, overloadedJudges, reach: metrics.announcementReach },
    after: { completionMinutes: afterMinutes, overloadedJudges: 0, reach: 96 },
    actions: [
      "Return 5 unstarted assignments to the available judge pool",
      "Allocate two reviews each to the three judges with the lowest remaining load",
      "Protect existing conflict-of-interest exclusions and finalized scores",
      "Notify affected judges and update the organizer timeline",
    ],
    announcement: "Judging assignments were rebalanced after an availability change. Your finalized reviews are unchanged; please refresh your queue for new assignments.",
    source: "deterministic-fallback",
  };
}
