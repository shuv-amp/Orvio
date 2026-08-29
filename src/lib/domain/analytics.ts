import type { EventMetrics, Team } from "./types";

/** Attendance as a 0–100 percentage, never dividing by zero. */
export function attendancePercent(checkedIn: number, total: number): number {
  return Math.round((checkedIn / Math.max(1, total)) * 1000) / 10;
}

/**
 * Completed-review share of the judging load. O(1) so the organizer
 * analytics view never scans raw score documents.
 */
export function judgingProgressPercent(
  completedReviews: number,
  pendingReviews: number,
): number {
  const total = Math.max(1, completedReviews + pendingReviews);
  return Math.round((completedReviews / total) * 100);
}

/** Share of registered participants who are on a team. */
export function teamFormationPercent(total: number, unmatched: number): number {
  const matched = Math.max(0, total - unmatched);
  return Math.round((matched / Math.max(1, total)) * 100);
}

/**
 * Gate headroom: scanning capacity as a percentage of arrival demand.
 * Above 100 means the gate is keeping up; below means a queue is forming.
 */
export function gateHeadroomPercent(
  scanThroughput: number,
  arrivalRate: number,
): number {
  return Math.round((scanThroughput / Math.max(1, arrivalRate)) * 100);
}

/** How many teams have every required review in. */
export function fullyReviewedTeams(teams: Team[], required = 3): number {
  return teams.filter((team) => team.judged >= required).length;
}

/** One row of the organizer analytics view. */
export interface AnalyticsRow {
  id: string;
  label: string;
  value: number;
  unit: "percent" | "count";
  /** Plain-language reading of the number, so colour is never the only cue. */
  detail: string;
  /** Drives the meter fill; always clamped to 0–100. */
  fill: number;
}

function clamp(value: number): number {
  return Math.min(100, Math.max(0, value));
}

/**
 * Attendance and engagement tracking for the organizer.
 *
 * Every row is O(1) over the live metric slice, apart from one linear pass
 * over the team list, so opening this view costs the same whether the event
 * has fifty attendees or five thousand.
 */
export function analyticsRows(
  metrics: EventMetrics,
  teams: Team[],
): AnalyticsRow[] {
  const attendance = attendancePercent(
    metrics.checkedIn,
    metrics.totalParticipants,
  );
  const formation = teamFormationPercent(
    metrics.totalParticipants,
    metrics.unmatchedParticipants,
  );
  const judging = judgingProgressPercent(
    metrics.completedReviews,
    metrics.pendingReviews,
  );
  const headroom = gateHeadroomPercent(
    metrics.scanThroughput,
    metrics.arrivalRate,
  );
  const reviewed = fullyReviewedTeams(teams);

  return [
    {
      id: "attendance",
      label: "Attendance",
      value: attendance,
      unit: "percent",
      detail: `${metrics.checkedIn} of ${metrics.totalParticipants} registered attendees have checked in.`,
      fill: clamp(attendance),
    },
    {
      id: "formation",
      label: "Team formation",
      value: formation,
      unit: "percent",
      detail: `${metrics.unmatchedParticipants} participants still need a team.`,
      fill: clamp(formation),
    },
    {
      id: "judging",
      label: "Judging progress",
      value: judging,
      unit: "percent",
      detail: `${metrics.completedReviews} reviews complete, ${metrics.pendingReviews} outstanding across ${metrics.activeJudges} judges.`,
      fill: clamp(judging),
    },
    {
      id: "reach",
      label: "Announcement reach",
      value: metrics.announcementReach,
      unit: "percent",
      detail: `Last critical update was sent ${metrics.announcementAgeMinutes} minutes ago.`,
      fill: clamp(metrics.announcementReach),
    },
    {
      id: "headroom",
      label: "Gate headroom",
      value: headroom,
      unit: "percent",
      detail: `Scanning ${metrics.scanThroughput} per minute against ${metrics.arrivalRate} arriving.`,
      fill: clamp(headroom),
    },
    {
      id: "reviewed",
      label: "Fully reviewed teams",
      value: reviewed,
      unit: "count",
      detail: `${reviewed} of ${teams.length} teams have all three reviews in.`,
      fill: clamp((reviewed / Math.max(1, teams.length)) * 100),
    },
  ];
}

/** Compact snapshot used by the control tower tiles. */
export function analyticsSnapshot(metrics: EventMetrics): {
  attendance: number;
  judging: number;
  reach: number;
  matched: number;
} {
  return {
    attendance: attendancePercent(metrics.checkedIn, metrics.totalParticipants),
    judging: judgingProgressPercent(
      metrics.completedReviews,
      metrics.pendingReviews,
    ),
    reach: metrics.announcementReach,
    matched: metrics.totalParticipants - metrics.unmatchedParticipants,
  };
}
