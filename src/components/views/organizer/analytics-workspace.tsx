import { ChartNoAxesColumn } from "lucide-react";
import { useMemo } from "react";
import { analyticsRows } from "@/lib/domain/analytics";
import type { EventMetrics, Team } from "@/lib/domain/types";

/**
 * Organizer analytics.
 *
 * Attendance and engagement tracking in one place. Every row states its
 * number in text and repeats the reading in a sentence, so the meters are a
 * second representation rather than the only one.
 */
export function AnalyticsWorkspace({
  metrics,
  teams,
}: {
  metrics: EventMetrics;
  teams: Team[];
}) {
  const rows = useMemo(() => analyticsRows(metrics, teams), [metrics, teams]);

  return (
    <div className="view-stack">
      <section className="hero-row compact-hero">
        <div>
          <p className="eyebrow">
            <ChartNoAxesColumn size={13} aria-hidden="true" />
            Analytics
          </p>
          <h2>Attendance and engagement, in one place.</h2>
          <p className="hero-sub">
            Every figure is derived from the same live event slice the rest of
            the platform reads, so this view can never disagree with the control
            tower.
          </p>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Six tracked measures</p>
            <h3>Event health</h3>
          </div>
          <span className="plain-meta">Event scoped · constant time</span>
        </div>

        <ul className="analytics-grid">
          {rows.map((row) => (
            <li className="analytics-row" key={row.id}>
              <div className="analytics-head">
                <span className="analytics-label">{row.label}</span>
                <strong className="analytics-value">
                  {row.value}
                  {row.unit === "percent" && <span>%</span>}
                </strong>
              </div>
              <div
                className="bar"
                role="meter"
                aria-label={row.label}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(row.fill)}
                aria-valuetext={
                  row.unit === "percent"
                    ? `${row.value} percent`
                    : `${row.value}`
                }
              >
                <i style={{ inlineSize: `${row.fill}%` }} />
              </div>
              <p className="analytics-detail">{row.detail}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
