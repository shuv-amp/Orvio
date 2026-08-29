import {
  SPARKLINE_HEIGHT,
  SPARKLINE_WIDTH,
  sparklineAreaPath,
  sparklinePath,
  trendDirection,
} from "@/lib/ui/sparkline";

/**
 * Sparkline for a metric tile.
 *
 * The path is derived from the same series the tile prints, so the chart can
 * never imply a trend the data does not have. It is hidden from assistive
 * technology because {@link describeTrend} states the same thing in words on
 * the tile itself.
 */
export function Sparkline({
  label,
  values,
}: {
  label: string;
  values: readonly number[];
}) {
  const series = [...values];
  const direction = trendDirection(series);
  const gradientId = `spark-${label.replace(/[^a-z]/gi, "").toLowerCase()}`;
  return (
    <svg
      className={`sparkline ${direction}`}
      viewBox={`0 0 ${SPARKLINE_WIDTH} ${SPARKLINE_HEIGHT}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={sparklineAreaPath(series)} fill={`url(#${gradientId})`} />
      <path
        d={sparklinePath(series)}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
