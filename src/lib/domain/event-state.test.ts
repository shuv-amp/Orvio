import { describe, expect, it } from "vitest";
import {
  eventReducer,
  recoveryOutcome,
  type EventAction,
  type EventState,
} from "./event-state";
import { simulateIncident } from "./pulse";
import { announcements, auditEvents, initialMetrics, teams } from "./seed";
import type { RecoveryProposal } from "./types";

function baseState(): EventState {
  return {
    metrics: { ...initialMetrics },
    announcements: [...announcements],
    audits: [...auditEvents],
    teams: [...teams],
  };
}

const stamp = { id: "fixed-id", at: "14:30" };

describe("eventReducer", () => {
  it("returns the same reference for an unknown action", () => {
    const state = baseState();
    const unknown = { type: "not-a-real-action", ...stamp } as unknown;
    expect(eventReducer(state, unknown as EventAction)).toBe(state);
  });

  it("never mutates the state it was given", () => {
    const state = baseState();
    const snapshot = structuredClone(state);
    eventReducer(state, {
      type: "check-in-accepted",
      ticketSuffix: "1042",
      gate: "North Gate 01",
      ...stamp,
    });
    expect(state).toEqual(snapshot);
  });
});

describe("check-in-accepted", () => {
  it("increments attendance and throughput and records the scan", () => {
    const next = eventReducer(baseState(), {
      type: "check-in-accepted",
      ticketSuffix: "1042",
      gate: "North Gate 01",
      ...stamp,
    });
    expect(next.metrics.checkedIn).toBe(initialMetrics.checkedIn + 1);
    expect(next.metrics.scanThroughput).toBe(initialMetrics.scanThroughput + 3);
    expect(next.audits[0]).toMatchObject({
      id: "fixed-id",
      actor: "North Gate 01",
      action: "QR verified",
      time: "14:30",
    });
    expect(next.audits[0].detail).toContain("1042");
  });

  it("never reports more attendance than registrations", () => {
    const state = baseState();
    state.metrics = {
      ...state.metrics,
      checkedIn: state.metrics.totalParticipants,
    };
    const next = eventReducer(state, {
      type: "check-in-accepted",
      ticketSuffix: "1042",
      gate: "North Gate 01",
      ...stamp,
    });
    expect(next.metrics.checkedIn).toBe(state.metrics.totalParticipants);
  });
});

describe("score-finalized", () => {
  it("publishes the aggregate, re-ranks, and logs the judge", () => {
    const next = eventReducer(baseState(), {
      type: "score-finalized",
      teamId: "t-3",
      teamName: "CivicLens",
      score: 99,
      judge: "Judge Arjun",
      rubricVersion: "rubric v3",
      ...stamp,
    });
    expect(next.teams[0].id).toBe("t-3");
    expect(next.teams[0].score).toBe(99);
    expect(next.audits[0].action).toBe("Score finalized");
    expect(next.audits[0].detail).toContain("CivicLens");
    expect(next.audits[0].detail).toContain("rubric v3");
  });

  it("moves one review from pending to completed", () => {
    const next = eventReducer(baseState(), {
      type: "score-finalized",
      teamId: "t-1",
      teamName: "Project Aster",
      score: 92,
      judge: "Judge Arjun",
      rubricVersion: "rubric v3",
      ...stamp,
    });
    expect(next.metrics.pendingReviews).toBe(initialMetrics.pendingReviews - 1);
    expect(next.metrics.completedReviews).toBe(
      initialMetrics.completedReviews + 1,
    );
  });

  it("does not drive pending reviews below zero", () => {
    const state = baseState();
    state.metrics = { ...state.metrics, pendingReviews: 0 };
    const next = eventReducer(state, {
      type: "score-finalized",
      teamId: "t-1",
      teamName: "Project Aster",
      score: 92,
      judge: "Judge Arjun",
      rubricVersion: "rubric v3",
      ...stamp,
    });
    expect(next.metrics.pendingReviews).toBe(0);
  });
});

describe("broadcast-sent", () => {
  it("prepends the announcement and writes a matching audit entry", () => {
    const next = eventReducer(baseState(), {
      type: "broadcast-sent",
      audience: "Unchecked attendees",
      body: "Use the express lane at Gate B.",
      actor: "Shuvam (Organizer)",
      ...stamp,
    });
    expect(next.announcements[0]).toMatchObject({
      id: "fixed-id",
      audience: "Unchecked attendees",
      urgent: true,
      reach: 0,
    });
    expect(next.audits[0].action).toBe("Targeted broadcast sent");
    expect(next.audits[0].id).not.toBe(next.announcements[0].id);
  });

  it("sanitizes organizer-authored copy before it is stored", () => {
    const next = eventReducer(baseState(), {
      type: "broadcast-sent",
      audience: "All participants",
      body: "  Gate   B  is  open  ",
      actor: "Shuvam (Organizer)",
      ...stamp,
    });
    expect(next.announcements[0].body).toBe("Gate B is open");
  });

  it("caps the stored body length", () => {
    const next = eventReducer(baseState(), {
      type: "broadcast-sent",
      audience: "All participants",
      body: "x".repeat(900),
      actor: "Shuvam (Organizer)",
      ...stamp,
    });
    expect(next.announcements[0].body).toHaveLength(300);
  });
});

describe("recovery-approved", () => {
  const proposals: RecoveryProposal[] = [
    simulateIncident("judge-dropout", initialMetrics),
    simulateIncident("gate-surge", initialMetrics),
    simulateIncident("venue-relocation", initialMetrics),
  ];

  it.each(proposals)("publishes the outcome for %#", (proposal) => {
    const next = eventReducer(baseState(), {
      type: "recovery-approved",
      proposal,
      actor: "Shuvam (Organizer)",
      ...stamp,
    });
    const outcome = recoveryOutcome(proposal);
    expect(next.announcements[0].title).toBe(outcome.title);
    expect(next.announcements[0].audience).toBe(outcome.audience);
    expect(next.announcements[0].reach).toBe(proposal.after.reach);
    expect(next.audits[0]).toMatchObject({
      action: "Recovery approved",
      detail: outcome.detail,
      actor: "Shuvam (Organizer)",
    });
    expect(next.metrics.announcementReach).toBe(proposal.after.reach);
  });

  it("adds a judge back only for the judge dropout scenario", () => {
    const judge = eventReducer(baseState(), {
      type: "recovery-approved",
      proposal: proposals[0],
      actor: "Shuvam (Organizer)",
      ...stamp,
    });
    const gate = eventReducer(baseState(), {
      type: "recovery-approved",
      proposal: proposals[1],
      actor: "Shuvam (Organizer)",
      ...stamp,
    });
    expect(judge.metrics.activeJudges).toBe(initialMetrics.activeJudges + 1);
    expect(gate.metrics.activeJudges).toBe(initialMetrics.activeJudges);
    expect(gate.metrics.scanThroughput).toBe(29);
  });
});

describe("recoveryOutcome", () => {
  it("falls back to the judging outcome for an unrecognised proposal id", () => {
    const outcome = recoveryOutcome({
      ...simulateIncident("judge-dropout", initialMetrics),
      id: "recovery-unknown",
    });
    expect(outcome.title).toBe("Judging queue rebalanced");
  });
});
