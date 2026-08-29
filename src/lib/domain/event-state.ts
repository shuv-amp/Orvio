import { applyPublishedScore } from "./leaderboard";
import { sanitizeUserText } from "./sanitize";
import type {
  Announcement,
  AuditEvent,
  EventMetrics,
  RecoveryProposal,
  Team,
} from "./types";

/**
 * The live slice of an event that every role workspace reads from.
 *
 * State transitions live here, as one pure reducer, instead of being spread
 * across component callbacks. That keeps each consequential change — a scan,
 * a finalized score, a broadcast, an approved recovery — testable on its own
 * and guarantees the audit trail is written by the same code path that
 * changes the numbers, so the two cannot drift apart.
 */
export interface EventState {
  metrics: EventMetrics;
  announcements: Announcement[];
  audits: AuditEvent[];
  teams: Team[];
}

/**
 * Identity and clock values are supplied by the caller rather than read from
 * `crypto` or `Date` inside the reducer, so every transition is deterministic
 * and reproducible in tests.
 */
interface Stamp {
  id: string;
  at: string;
}

export type EventAction =
  | ({ type: "check-in-accepted"; ticketSuffix: string; gate: string } & Stamp)
  | ({
      type: "score-finalized";
      teamId: string;
      teamName: string;
      score: number;
      judge: string;
      rubricVersion: string;
    } & Stamp)
  | ({
      type: "broadcast-sent";
      audience: string;
      body: string;
      actor: string;
    } & Stamp)
  | ({
      type: "recovery-approved";
      proposal: RecoveryProposal;
      actor: string;
    } & Stamp);

const MAX_ANNOUNCEMENT_BODY = 300;

/** Human-readable consequence of approving each recovery proposal. */
export interface RecoveryOutcome {
  title: string;
  audience: string;
  detail: string;
}

/**
 * Map an approved proposal to the announcement and audit copy it produces.
 * Exported so the organizer view and the reducer cannot describe the same
 * approval differently.
 */
export function recoveryOutcome(proposal: RecoveryProposal): RecoveryOutcome {
  switch (proposal.id) {
    case "recovery-gate-surge":
      return {
        title: "Express gate activated",
        audience: "Unchecked attendees",
        detail: "Gate B opened · targeted directions sent",
      };
    case "recovery-venue-relocation":
      return {
        title: "Gemini clinic relocated",
        audience: "Clinic attendees",
        detail: "Main Hall B confirmed · schedule and signage updated",
      };
    default:
      return {
        title: "Judging queue rebalanced",
        audience: "Assigned judges",
        detail: "5 reviews rebalanced · affected judges notified",
      };
  }
}

function withAudit(
  state: EventState,
  entry: Omit<AuditEvent, "id" | "time"> & Stamp,
): AuditEvent[] {
  const { id, at, ...rest } = entry;
  return [{ id, time: at, ...rest }, ...state.audits];
}

/**
 * Apply one consequential event.
 *
 * Unknown actions return the same state reference, so an unhandled case can
 * never silently corrupt the live slice.
 */
export function eventReducer(
  state: EventState,
  action: EventAction,
): EventState {
  switch (action.type) {
    case "check-in-accepted":
      return {
        ...state,
        metrics: {
          ...state.metrics,
          // Attendance is capped by registration; a scan can never invent one.
          checkedIn: Math.min(
            state.metrics.totalParticipants,
            state.metrics.checkedIn + 1,
          ),
          scanThroughput: state.metrics.scanThroughput + 3,
        },
        audits: withAudit(state, {
          id: action.id,
          at: action.at,
          actor: action.gate,
          action: "QR verified",
          detail: `Ticket ••••${action.ticketSuffix} accepted · replay lock stored`,
        }),
      };

    case "score-finalized":
      return {
        ...state,
        teams: applyPublishedScore(state.teams, action.teamId, action.score),
        metrics: {
          ...state.metrics,
          pendingReviews: Math.max(0, state.metrics.pendingReviews - 1),
          completedReviews: state.metrics.completedReviews + 1,
        },
        audits: withAudit(state, {
          id: action.id,
          at: action.at,
          actor: action.judge,
          action: "Score finalized",
          detail: `${action.teamName} · ${action.score}/100 · ${action.rubricVersion}`,
        }),
      };

    case "broadcast-sent": {
      const body = sanitizeUserText(action.body, MAX_ANNOUNCEMENT_BODY);
      return {
        ...state,
        announcements: [
          {
            id: action.id,
            title: "Operations update",
            body,
            audience: action.audience,
            time: action.at,
            urgent: true,
            reach: 0,
          },
          ...state.announcements,
        ],
        audits: withAudit(state, {
          id: `${action.id}-audit`,
          at: action.at,
          actor: action.actor,
          action: "Targeted broadcast sent",
          detail: `${action.audience} · delivery tracking started`,
        }),
      };
    }

    case "recovery-approved": {
      const { proposal } = action;
      const outcome = recoveryOutcome(proposal);
      return {
        ...state,
        metrics: {
          ...state.metrics,
          activeJudges:
            proposal.id === "recovery-judge-dropout"
              ? state.metrics.activeJudges + 1
              : state.metrics.activeJudges,
          scanThroughput:
            proposal.id === "recovery-gate-surge"
              ? 29
              : state.metrics.scanThroughput,
          announcementReach: proposal.after.reach,
        },
        announcements: [
          {
            id: action.id,
            title: outcome.title,
            body: sanitizeUserText(
              proposal.announcement,
              MAX_ANNOUNCEMENT_BODY,
            ),
            audience: outcome.audience,
            time: action.at,
            urgent: true,
            reach: proposal.after.reach,
          },
          ...state.announcements,
        ],
        audits: withAudit(state, {
          id: `${action.id}-audit`,
          at: action.at,
          actor: action.actor,
          action: "Recovery approved",
          detail: outcome.detail,
        }),
      };
    }

    default:
      return state;
  }
}
