import type { LucideIcon } from "lucide-react";
import { describeTrend } from "@/lib/ui/sparkline";
import { Sparkline } from "./sparkline";

export type MetricTone = "indigo" | "amber" | "violet" | "green";

/**
 * One headline number on the control tower.
 *
 * The trend is spelled out in text under the value as well as drawn, so the
 * card does not rely on the chart — or on colour — to be understood.
 */
export function MetricCard({
  label,
  value,
  suffix,
  detail,
  series,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  suffix: string;
  detail: string;
  series: readonly number[];
  icon: LucideIcon;
  tone: MetricTone;
}) {
  return (
    <article className={`metric-card tone-${tone}`}>
      <div className="metric-top">
        <span className="metric-icon" aria-hidden="true">
          <Icon size={18} />
        </span>
        <p className="metric-label">{label}</p>
      </div>
      <h3 className="metric-value">
        <span className="metric-number">{value}</span>
        <span className="metric-suffix">{suffix}</span>
      </h3>
      <p className="metric-detail">{detail}</p>
      <div className="metric-chart">
        <Sparkline label={label} values={series} />
      </div>
      <p className="visually-hidden">{describeTrend(label, [...series])}</p>
    </article>
  );
}
