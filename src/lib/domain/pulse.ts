import type {
  EventMetrics,
  EventSignal,
  IncidentType,
  RecoveryProposal,
} from "./types";

/**
 * Derive the four operational signals from live counters. Thresholds
 * in this module are fixed and deterministic.
 */
export function deriveSignals(metrics: EventMetrics): EventSignal[] {
  const queueRatio = metrics.arrivalRate / Math.max(1, metrics.scanThroughput);
  const unmatchedRatio =
    metrics.unmatchedParticipants / Math.max(1, metrics.totalParticipants);
  const judgingMinutes =
    (metrics.pendingReviews * metrics.averageReviewMinutes) /
    Math.max(1, metrics.activeJudges);

  return [
    {
      id: "signal-queue",
      type: "queue",
      title: "North Gate congestion",
      severity:
        queueRatio > 1.2 ? "critical" : queueRatio > 1 ? "watch" : "healthy",
      value: `${metrics.arrivalRate}/min arriving · ${metrics.scanThroughput}/min scanned`,
      evidence: `Arrival demand is ${Math.round((queueRatio - 1) * 100)}% above current throughput.`,
      recommendation:
        "Open the volunteer scanner lane and route pre-verified attendees to Gate B.",
    },
    {
      id: "signal-teams",
      type: "teams",
      title: "Team formation cutoff",
      severity:
        unmatchedRatio > 0.1 && metrics.teamCutoffMinutes < 30
          ? "critical"
          : unmatchedRatio > 0.05
            ? "watch"
            : "healthy",
      value: `${metrics.unmatchedParticipants} people · ${metrics.teamCutoffMinutes} min left`,
      evidence: `${Math.round(unmatchedRatio * 100)}% of registered participants remain unmatched.`,
      recommendation:
        "Open Match Lab recommendations and invite participants into teams with complementary gaps.",
    },
    {
      id: "signal-judging",
      type: "judging",
      title: "Judging completion risk",
      severity:
        judgingMinutes > metrics.minutesRemaining
          ? "critical"
          : judgingMinutes > metrics.minutesRemaining * 0.8
            ? "watch"
            : "healthy",
      value: `${Math.ceil(judgingMinutes)} min projected · ${metrics.minutesRemaining} min available`,
      evidence: `${metrics.pendingReviews} reviews are distributed across ${metrics.activeJudges} active judges.`,
      recommendation:
        "Rebalance unstarted assignments while preserving conflict-of-interest constraints.",
    },
    {
      id: "signal-comms",
      type: "communication",
      title: "Critical update reach",
      severity:
        metrics.announcementReach < 60 && metrics.announcementAgeMinutes >= 10
          ? "critical"
          : metrics.announcementReach < 80
            ? "watch"
            : "healthy",
      value: `${metrics.announcementReach}% reached · ${metrics.announcementAgeMinutes} min ago`,
      evidence: `${100 - metrics.announcementReach}% have not acknowledged the schedule update.`,
      recommendation:
        "Escalate to push and target only attendees who have not acknowledged the update.",
    },
  ];
}

export function simulateJudgeDropout(metrics: EventMetrics): RecoveryProposal {
  const overloadedJudges = Math.max(1, Math.ceil(metrics.pendingReviews / 10));
  const beforeMinutes = Math.ceil(
    (metrics.pendingReviews * metrics.averageReviewMinutes) /
      Math.max(1, metrics.activeJudges - 1),
  );
  const afterMinutes = Math.ceil(
    (metrics.pendingReviews * (metrics.averageReviewMinutes - 1)) /
      Math.max(1, metrics.activeJudges),
  );

  return {
    id: "recovery-judge-dropout",
    incident: "Judge unavailable with 37 reviews pending",
    status: "draft",
    before: {
      completionMinutes: beforeMinutes,
      overloadedJudges,
      reach: metrics.announcementReach,
    },
    after: { completionMinutes: afterMinutes, overloadedJudges: 0, reach: 96 },
    comparison: {
      label: "Projected judging completion",
      beforeValue: beforeMinutes,
      afterValue: afterMinutes,
      unit: "min",
      beforeNote: `${overloadedJudges} judges overloaded`,
      afterNote: "Balanced review queue",
    },
    actions: [
      "Return 5 unstarted assignments to the available judge pool",
      "Allocate two reviews each to the three judges with the lowest remaining load",
      "Protect existing conflict-of-interest exclusions and finalized scores",
      "Notify affected judges and update the organizer timeline",
    ],
    announcement:
      "Judging assignments were rebalanced after an availability change. Your finalized reviews are unchanged; please refresh your queue for new assignments.",
    source: "deterministic-fallback",
  };
}

export function simulateGateSurge(metrics: EventMetrics): RecoveryProposal {
  const queueGrowth = Math.max(0, metrics.arrivalRate - metrics.scanThroughput);
  return {
    id: "recovery-gate-surge",
    incident: `North Gate demand exceeds capacity by ${queueGrowth} people/min`,
    status: "draft",
    before: {
      completionMinutes: Math.ceil(80 / Math.max(1, queueGrowth)),
      overloadedJudges: 0,
      reach: metrics.announcementReach,
    },
    after: { completionMinutes: 4, overloadedJudges: 0, reach: 91 },
    comparison: {
      label: "Estimated queue clearance",
      beforeValue: Math.ceil(80 / Math.max(1, queueGrowth)),
      afterValue: 4,
      unit: "min",
      beforeNote: `${queueGrowth} people/min accumulating`,
      afterNote: "Express lane absorbing demand",
    },
    actions: [
      "Open the pre-verified express scanner at Gate B",
      "Move one floating volunteer to North Gate for the next 12 minutes",
      "Route checked-in workshop attendees away from the entrance corridor",
      "Send directions only to attendees who have not yet checked in",
    ],
    announcement:
      "North Gate is busy. If your pass is ready, use the express scanner at Gate B; volunteers will guide you. Your registration remains unchanged.",
    source: "deterministic-fallback",
  };
}

export function simulateVenueRelocation(
  metrics: EventMetrics,
): RecoveryProposal {
  return {
    id: "recovery-venue-relocation",
    incident: "Gemini clinic room unavailable 20 minutes before start",
    status: "draft",
    before: {
      completionMinutes: 31,
      overloadedJudges: 0,
      reach: metrics.announcementReach,
    },
    after: { completionMinutes: 8, overloadedJudges: 0, reach: 97 },
    comparison: {
      label: "Attendee update completion",
      beforeValue: 31,
      afterValue: 8,
      unit: "min",
      beforeNote: `${metrics.announcementReach}% baseline reach`,
      afterNote: "Targeted update and signage",
    },
    actions: [
      "Move the clinic to Main Hall B, which has verified capacity and accessibility",
      "Update the participant schedule and venue signage as one atomic operation",
      "Notify only registered clinic attendees and assigned volunteers",
      "Escalate non-acknowledgements to push after five minutes",
    ],
    announcement:
      "The Gemini clinic has moved to Main Hall B. The start time is unchanged, the route is step-free, and volunteers are positioned at the previous room.",
    source: "deterministic-fallback",
  };
}

/** Dispatch a labeled incident to its deterministic recovery draft. */
export function simulateIncident(
  type: IncidentType,
  metrics: EventMetrics,
): RecoveryProposal {
  if (type === "gate-surge") return simulateGateSurge(metrics);
  if (type === "venue-relocation") return simulateVenueRelocation(metrics);
  return simulateJudgeDropout(metrics);
}
