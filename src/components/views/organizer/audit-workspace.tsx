import { ListChecks } from "lucide-react";
import type { AuditEvent } from "@/lib/domain/types";

/** Append-only record of every consequential decision, newest first. */
export function AuditWorkspace({ audits }: { audits: AuditEvent[] }) {
  return (
    <div className="view-stack">
      <section className="hero-row compact-hero">
        <div>
          <p className="eyebrow">
            <ListChecks size={13} aria-hidden="true" />
            Audit trail
          </p>
          <h2>Every consequential action has an owner.</h2>
          <p className="hero-sub">
            Approvals, score finalization, and check-in decisions are
            append-only. Clients can read this record but never write it.
          </p>
        </div>
      </section>
      <section className="panel">
        <div className="table-scroll">
          <table className="audit-table">
            <caption className="visually-hidden">
              Audit trail of organizer, judge, and gate actions
            </caption>
            <thead>
              <tr>
                <th scope="col">Action</th>
                <th scope="col">Evidence</th>
                <th scope="col">Actor</th>
                <th scope="col">Time</th>
              </tr>
            </thead>
            <tbody aria-live="polite">
              {audits.map((event) => (
                <tr key={event.id}>
                  <th scope="row">{event.action}</th>
                  <td>{event.detail}</td>
                  <td>{event.actor}</td>
                  <td className="numeric">{event.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
