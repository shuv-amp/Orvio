/**
 * Sparkline geometry.
 *
 * The dashboard tiles previously rendered fixed decorative bars, which showed
 * a trend the data did not support. These helpers turn a real series into SVG
 * geometry so a tile can only ever draw the numbers behind it.
 */

/** A sparkline drawn inside a `viewBox` of this width and height. */
export const SPARKLINE_WIDTH = 100;
export const SPARKLINE_HEIGHT = 32;

const EDGE_PADDING = 2;

function extent(values: number[]): { min: number; max: number } {
  const min = Math.min(...values);
  const max = Math.max(...values);
  // A flat series would divide by zero; draw it down the middle instead.
  return max === min ? { min: min - 1, max: max + 1 } : { min, max };
}

function points(values: number[]): { x: number; y: number }[] {
  const { min, max } = extent(values);
  const usableHeight = SPARKLINE_HEIGHT - EDGE_PADDING * 2;
  const step = values.length === 1 ? 0 : SPARKLINE_WIDTH / (values.length - 1);
  return values.map((value, index) => ({
    x: Number((index * step).toFixed(2)),
    y: Number(
      (
        SPARKLINE_HEIGHT -
        EDGE_PADDING -
        ((value - min) / (max - min)) * usableHeight
      ).toFixed(2),
    ),
  }));
}

/** Open polyline through the series, for the sparkline stroke. */
export function sparklinePath(values: number[]): string {
  if (values.length === 0) return "";
  return points(values)
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`)
    .join(" ");
}

/** Closed variant of {@link sparklinePath} used for the soft area fill. */
export function sparklineAreaPath(values: number[]): string {
  if (values.length === 0) return "";
  const line = points(values);
  const last = line[line.length - 1];
  return `${sparklinePath(values)} L${last.x} ${SPARKLINE_HEIGHT} L${line[0].x} ${SPARKLINE_HEIGHT} Z`;
}

/** Signed percentage change between the first and last sample. */
export function trendDelta(values: number[]): number {
  if (values.length < 2) return 0;
  const first = values[0];
  const last = values[values.length - 1];
  if (first === 0) return last === 0 ? 0 : 100;
  return Number((((last - first) / Math.abs(first)) * 100).toFixed(1));
}

/** Direction of travel, used for the accessible description and the colour. */
export function trendDirection(values: number[]): "up" | "down" | "flat" {
  const delta = trendDelta(values);
  if (delta > 0) return "up";
  if (delta < 0) return "down";
  return "flat";
}

/**
 * Sentence describing the series for screen readers, so the chart is never
 * the only way to learn the trend.
 */
export function describeTrend(label: string, values: number[]): string {
  const direction = trendDirection(values);
  const delta = Math.abs(trendDelta(values));
  if (direction === "flat") return `${label} is unchanged over the last hour.`;
  const verb = direction === "up" ? "up" : "down";
  return `${label} is ${verb} ${delta}% over the last hour.`;
}
