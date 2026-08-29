"use client";

import {
  Activity,
  CircleGauge,
  FlaskConical,
  PlayCircle,
  Radio,
  Scale,
  UserRound,
  Users,
} from "lucide-react";
import { useMemo } from "react";
import { analyticsSnapshot } from "@/lib/domain/analytics";
import { deriveSignals } from "@/lib/domain/pulse";
import { metricHistory } from "@/lib/domain/seed";
import type {
  Announcement,
  AuditEvent,
  EventMetrics,
  IncidentType,
  RecoveryProposal,
  Team,
} from "@/lib/domain/types";
import { MetricCard } from "../../ui/metric-card";
import type { OrganizerSection, ShowToast } from "../../types";
import { Leaderboard } from "../leaderboard";
import { AnalyticsWorkspace } from "./analytics-workspace";
import { AuditWorkspace } from "./audit-workspace";
import { BroadcastWorkspace } from "./broadcast-workspace";
import { RecoveryCard } from "./recovery-card";
import { SignalList } from "./signal-list";
import { SignalsWorkspace } from "./signals-workspace";

export function OrganizerView({
  section,
  metrics,
  announcements,
  audits,
  teams,
  proposal,
  incidentType,
  setIncidentType,
  simulating,
  onSimulate,
  onApprove,
  onSendBroadcast,
  onOpenAudit,
  startTour,
  toast,
}: {
  section: OrganizerSection;
  metrics: EventMetrics;
  announcements: Announcement[];
  audits: AuditEvent[];
  teams: Team[];
  proposal: RecoveryProposal | null;
  incidentType: IncidentType;
  setIncidentType: (incident: IncidentType) => void;
  simulating: boolean;
  onSimulate: () => void;
  onApprove: () => void;
  onSendBroadcast: (audience: string, body: string) => void;
  onOpenAudit: () => void;
  startTour: () => void;
  toast: ShowToast;
}) {
  const signals = useMemo(() => deriveSignals(metrics), [metrics]);

  if (section === "signals") return <SignalsWorkspace metrics={metrics} />;
  if (section === "audit") return <AuditWorkspace audits={audits} />;
  if (section === "analytics")
    return <AnalyticsWorkspace metrics={metrics} teams={teams} />;
  if (section === "broadcasts") {
    return (
      <BroadcastWorkspace
        announcements={announcements}
        onSend={onSendBroadcast}
        toast={toast}
      />
    );
  }

  const criticalCount = signals.filter(
    (signal) => signal.severity === "critical",
  ).length;
  // One source of truth for these percentages, shared with the analytics view.
  const snapshot = analyticsSnapshot(metrics);

  return (
    <div className="view-stack">
      <section className="hero-row">
        <div>
          <p className="eyebrow">
            <Activity size={13} aria-hidden="true" />
            Live operations
          </p>
          <h2>Good afternoon, Shuvam.</h2>
          <p className="hero-sub">
            Orvio found <strong>{criticalCount} risks</strong> that need
            attention before they become incidents.
          </p>
        </div>
        <div className="hero-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={startTour}
          >
            <PlayCircle size={16} aria-hidden="true" />
            Demo guide
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={onSimulate}
            disabled={simulating}
          >
            <FlaskConical size={16} aria-hidden="true" />
            {simulating ? "Simulating…" : "Simulate disruption"}
          </button>
        </div>
      </section>

      <section className="metric-grid" aria-label="Live event metrics">
        <MetricCard
          label="Checked in"
          value={String(metrics.checkedIn)}
          suffix={`/ ${metrics.totalParticipants}`}
          detail={`${snapshot.attendance}% attendance`}
          series={metricHistory.checkedIn}
          icon={Users}
          tone="indigo"
        />
        <MetricCard
          label="Team readiness"
          value={String(snapshot.matched)}
          suffix="matched"
          detail={`${metrics.unmatchedParticipants} need a team`}
          series={metricHistory.matched}
          icon={UserRound}
          tone="amber"
        />
        <MetricCard
          label="Judging progress"
          value={String(snapshot.judging)}
          suffix="%"
          detail={`${metrics.pendingReviews} reviews remaining`}
          series={metricHistory.judgingProgress}
          icon={Scale}
          tone="violet"
        />
        <MetricCard
          label="Announcement reach"
          value={String(metrics.announcementReach)}
          suffix="%"
          detail="Live acknowledgement"
          series={metricHistory.announcementReach}
          icon={Radio}
          tone="green"
        />
      </section>

      <section className="content-grid">
        <div className="panel pulse-panel" data-tour="pulse">
          <div className="panel-head">
            <div>
              <p className="eyebrow">
                <CircleGauge size={13} aria-hidden="true" />
                Event pulse
              </p>
              <h3>What is about to break?</h3>
            </div>
            <span className="sync-label">
              <span aria-hidden="true" />
              Updated live
            </span>
          </div>
          <SignalList signals={signals} />
        </div>

        <aside className="right-stack" aria-label="Incident desk and audit">
          <RecoveryCard
            proposal={proposal}
            incidentType={incidentType}
            setIncidentType={setIncidentType}
            loading={simulating}
            onSimulate={onSimulate}
            onApprove={onApprove}
          />
          <div className="panel audit-card">
            <div className="panel-head">
              <h3>Immutable audit trail</h3>
              <button
                type="button"
                className="text-button"
                onClick={onOpenAudit}
              >
                View all
              </button>
            </div>
            <ol className="audit-feed" aria-live="polite">
              {audits.slice(0, 4).map((event) => (
                <li key={event.id}>
                  <span className="audit-line" aria-hidden="true">
                    <i />
                  </span>
                  <div>
                    <strong>{event.action}</strong>
                    <p>{event.detail}</p>
                    <small>
                      {event.actor} · {event.time}
                    </small>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </section>

      <Leaderboard teams={teams} />
    </div>
  );
}
