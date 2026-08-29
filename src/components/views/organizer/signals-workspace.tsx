import { Radio, SlidersHorizontal } from "lucide-react";
import { useMemo } from "react";
import { deriveSignals } from "@/lib/domain/pulse";
import type { EventMetrics } from "@/lib/domain/types";
import { SignalList } from "./signal-list";

/** Full-width view of every monitored constraint and the threshold it uses. */
export function SignalsWorkspace({ metrics }: { metrics: EventMetrics }) {
  const signals = useMemo(() => deriveSignals(metrics), [metrics]);
  const critical = signals.filter((signal) => signal.severity === "critical");

  return (
    <div className="view-stack">
      <section className="hero-row compact-hero">
        <div>
          <p className="eyebrow">
            <Radio size={13} aria-hidden="true" />
            Live signals
          </p>
          <h2>Operational evidence, not vague alerts.</h2>
          <p className="hero-sub">
            {critical.length} of {signals.length} thresholds are breached. Every
            alert shows its source metric, boundary, and next safe action.
          </p>
        </div>
        <p className="data-freshness">
          <span aria-hidden="true" />
          Last event update 8s ago
        </p>
      </section>
      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">
              <SlidersHorizontal size={13} aria-hidden="true" />
              Four monitored constraints
            </p>
            <h3>Threshold ledger</h3>
          </div>
          <span className="plain-meta">Deterministic rules · event scoped</span>
        </div>
        <SignalList signals={signals} />
      </section>
    </div>
  );
}
