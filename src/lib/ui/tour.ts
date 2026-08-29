import type { CommandSection, CommandView } from "./commands";

/**
 * The guided demo.
 *
 * The topbar used to show a "Demo guide" button that did nothing. These steps
 * make it real: each one moves the app to the screen it describes and points
 * at the element being talked about, so the golden path can be walked without
 * a script in someone's hand.
 */
export interface TourStep {
  id: string;
  title: string;
  body: string;
  /** Workspace this step belongs to. */
  view: CommandView;
  /** Organizer sub-section, when the step is inside the control tower. */
  section?: CommandSection;
  /** Element the spotlight points at, matched with `querySelector`. */
  target: string;
}

export const TOUR_STEPS: readonly TourStep[] = [
  {
    id: "pulse",
    title: "Start with what is about to break",
    body: "Event Pulse turns four live constraints into ranked risks. Each card shows the metric, the threshold it crossed, and the next safe action — no opaque alerting.",
    view: "organizer",
    section: "overview",
    target: "[data-tour='pulse']",
  },
  {
    id: "recovery",
    title: "Model a disruption before attendees feel it",
    body: "Pick judge, gate, or venue. Orvio projects the before and after, drafts the announcement, and stops. A human approves every consequential change.",
    view: "organizer",
    section: "overview",
    target: "[data-tour='recovery']",
  },
  {
    id: "match",
    title: "Explainable team formation",
    body: "Recommendations break down into skill coverage, shared interests, role complement, and availability. Participants keep the final say through a structured swap.",
    view: "participant",
    target: "[data-tour='match']",
  },
  {
    id: "pass",
    title: "A signed pass that carries no personal data",
    body: "The QR holds an event id, ticket id, nonce, audience, and expiry. Scanning it twice is rejected by a server-side replay lock, online or offline.",
    view: "participant",
    target: "[data-tour='pass']",
  },
  {
    id: "scanner",
    title: "Check-in that survives a dead network",
    body: "Go offline, scan, then reconnect. The queued pass verifies against the same replay lock, and a second scan of the same pass is refused.",
    view: "scanner",
    target: "[data-tour='scan-stage']",
  },
  {
    id: "judging",
    title: "Structured judging, immutable result",
    body: "Rubric v3 is locked, feedback must cite evidence, and finalizing publishes an aggregate that the live leaderboard re-ranks immediately.",
    view: "judge",
    target: "[data-tour='rubric']",
  },
];

/** Clamp a step index to the tour, so a stale index can never render nothing. */
export function clampStep(index: number): number {
  if (!Number.isFinite(index)) return 0;
  return Math.min(Math.max(Math.trunc(index), 0), TOUR_STEPS.length - 1);
}

/** Next index, or `null` when the tour is finished. */
export function nextStep(index: number): number | null {
  const next = clampStep(index) + 1;
  return next < TOUR_STEPS.length ? next : null;
}

/** Previous index, or `null` when already on the first step. */
export function previousStep(index: number): number | null {
  const previous = clampStep(index) - 1;
  return previous >= 0 ? previous : null;
}

/** "Step 2 of 6", announced alongside the step title. */
export function stepProgressLabel(index: number): string {
  return `Step ${clampStep(index) + 1} of ${TOUR_STEPS.length}`;
}
