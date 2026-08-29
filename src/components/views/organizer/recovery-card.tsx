"use client";

import {
  Activity,
  ArrowRight,
  Check,
  CheckCircle2,
  ListChecks,
  Megaphone,
  RefreshCw,
  Scale,
  ScanLine,
  ShieldCheck,
  TimerReset,
  type LucideIcon,
} from "lucide-react";
import type { IncidentType, RecoveryProposal } from "@/lib/domain/types";

const scenarios: { key: IncidentType; label: string; icon: LucideIcon }[] = [
  { key: "judge-dropout", label: "Judge", icon: Scale },
  { key: "gate-surge", label: "Gate", icon: ScanLine },
  { key: "venue-relocation", label: "Venue", icon: Megaphone },
];

/**
 * Incident desk.
 *
 * Simulation and approval are deliberately two steps: Orvio produces a
 * proposal with a truthful before/after projection and then stops until a
 * human approves it. Nothing here changes event state on its own.
 */
export function RecoveryCard({
  proposal,
  incidentType,
  setIncidentType,
  loading,
  onSimulate,
  onApprove,
}: {
  proposal: RecoveryProposal | null;
  incidentType: IncidentType;
  setIncidentType: (incident: IncidentType) => void;
  loading: boolean;
  onSimulate: () => void;
  onApprove: () => void;
}) {
  return (
    <div className="panel recovery-card" data-tour="recovery">
      <p className="recovery-system-mark">
        <Activity size={16} aria-hidden="true" />
        <span>Decision model · ready</span>
      </p>
      <p className="eyebrow">
        <ListChecks size={13} aria-hidden="true" />
        Incident desk
      </p>
      <h3>
        {proposal
          ? proposal.incident
          : "Model a disruption before it reaches attendees."}
      </h3>

      {!proposal ? (
        <>
          <p className="recovery-intro">
            Stress-test one live constraint. Orvio shows the evidence and waits
            for approval.
          </p>
          <div
            className="scenario-switcher"
            role="radiogroup"
            aria-label="Disruption scenario"
          >
            {scenarios.map((scenario) => (
              <button
                type="button"
                key={scenario.key}
                role="radio"
                aria-checked={incidentType === scenario.key}
                className={incidentType === scenario.key ? "active" : ""}
                onClick={() => setIncidentType(scenario.key)}
              >
                <scenario.icon size={16} aria-hidden="true" />
                {scenario.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="dark-button"
            onClick={onSimulate}
            disabled={loading}
          >
            {loading ? (
              <RefreshCw className="spin" size={16} aria-hidden="true" />
            ) : (
              <TimerReset size={16} aria-hidden="true" />
            )}
            {loading ? "Building plan…" : "Run selected scenario"}
          </button>
        </>
      ) : (
        <RecoveryDetails proposal={proposal} onApprove={onApprove} />
      )}
    </div>
  );
}

function RecoveryDetails({
  proposal,
  onApprove,
}: {
  proposal: RecoveryProposal;
  onApprove: () => void;
}) {
  const { comparison } = proposal;
  return (
    <div className="recovery-detail">
      <p className="comparison-label">{comparison.label}</p>
      <div className="recovery-comparison">
        <div>
          <span className="comparison-side">Without recovery</span>
          <strong>
            {comparison.beforeValue}
            <small> {comparison.unit}</small>
          </strong>
          <small>{comparison.beforeNote}</small>
        </div>
        <ArrowRight size={17} aria-hidden="true" />
        <div className="after">
          <span className="comparison-side">With recovery</span>
          <strong>
            {comparison.afterValue}
            <small> {comparison.unit}</small>
          </strong>
          <small>{comparison.afterNote}</small>
        </div>
      </div>
      <ul className="recovery-actions">
        {proposal.actions.slice(0, 3).map((action) => (
          <li key={action}>
            <Check size={14} aria-hidden="true" />
            {action}
          </li>
        ))}
      </ul>
      <p className="ai-source">
        <ShieldCheck size={14} aria-hidden="true" />
        <span>
          {proposal.source === "gemini"
            ? "Gemini grounded draft"
            : "Verified deterministic fallback"}
        </span>
      </p>
      {proposal.status === "approved" ? (
        <p className="approved-state">
          <CheckCircle2 size={16} aria-hidden="true" />
          Recovery active
        </p>
      ) : (
        <button type="button" className="dark-button" onClick={onApprove}>
          <ShieldCheck size={16} aria-hidden="true" />
          Review &amp; approve
        </button>
      )}
    </div>
  );
}
