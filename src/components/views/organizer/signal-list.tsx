import {
  ChevronRight,
  Megaphone,
  Scale,
  ScanLine,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { EventSignal } from "@/lib/domain/types";
import { StatusPill } from "../../ui/status-pill";

const signalIcon: Record<EventSignal["type"], LucideIcon> = {
  queue: ScanLine,
  teams: Users,
  judging: Scale,
  communication: Megaphone,
};

/** Ranked operational risks, each showing its metric, evidence, and next step. */
export function SignalList({ signals }: { signals: EventSignal[] }) {
  return (
    <ul className="signal-list">
      {signals.map((signal) => {
        const Icon = signalIcon[signal.type];
        return (
          <li className={`signal-card ${signal.severity}`} key={signal.id}>
            <span className="signal-icon" aria-hidden="true">
              <Icon size={17} />
            </span>
            <div className="signal-copy">
              <div className="signal-head">
                <h4>{signal.title}</h4>
                <StatusPill severity={signal.severity} />
              </div>
              <p className="signal-value">{signal.value}</p>
              <p className="signal-evidence">{signal.evidence}</p>
              <p className="signal-action">
                <ChevronRight size={14} aria-hidden="true" />
                {signal.recommendation}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
