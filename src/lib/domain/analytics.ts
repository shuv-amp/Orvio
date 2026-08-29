import type { EventMetrics } from "./types";

/** Attendance as a 0–100 percentage, never dividing by zero. */
export function attendancePercent(checkedIn: number, total: number): number {
  return Math.round((checkedIn / Math.max(1, total)) * 1000) / 10;
}

/**
 * Completed-review share of the judging load. O(1) so the organizer
 * analytics strip never scans raw score documents.
 */
export function judgingProgressPercent(
  completedReviews: number,
  pendingReviews: number,
): number {
  const total = Math.max(1, completedReviews + pendingReviews);
  return Math.round((completedReviews / total) * 100);
}

/** O(1) organizer strip: attendance, judging progress, reach, matched count. */
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
