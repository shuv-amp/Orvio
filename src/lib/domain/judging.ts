import type { ScoreRecord } from "./types";

export const rubric = [
  { id: "functionality", label: "Functionality", weight: 30 },
  { id: "innovation", label: "Innovation", weight: 25 },
  { id: "impact", label: "Practical impact", weight: 20 },
  { id: "google", label: "Google tool leverage", weight: 15 },
  { id: "presentation", label: "Presentation", weight: 10 },
] as const;

/**
 * Weighted mean of the locked rubric (0–10 per criterion → 0–100 total).
 * Missing criteria contribute zero rather than inflating the score.
 */
export function weightedScore(scores: Record<string, number>): number {
  const total = rubric.reduce(
    (sum, item) => sum + (scores[item.id] ?? 0) * item.weight,
    0,
  );
  return Math.round(total) / 10;
}

/** Advisory severity outliers; never mutates the official raw scores. */
export function detectScoreDrift(records: ScoreRecord[]) {
  const finalized = records.filter((record) => record.finalized);
  if (finalized.length < 3) return [];

  const judgeAverages = new Map<string, number[]>();
  for (const record of finalized) {
    const values = judgeAverages.get(record.judgeId) ?? [];
    values.push(weightedScore(record.scores));
    judgeAverages.set(record.judgeId, values);
  }
  const means = [...judgeAverages.entries()].map(([judgeId, values]) => ({
    judgeId,
    mean: values.reduce((a, b) => a + b, 0) / values.length,
    samples: values.length,
  }));
  const populationMean =
    means.reduce((sum, item) => sum + item.mean, 0) / means.length;
  const deviation = Math.sqrt(
    means.reduce((sum, item) => sum + (item.mean - populationMean) ** 2, 0) /
      means.length,
  );
  if (deviation === 0) return [];

  return means
    .filter(
      (item) =>
        item.samples >= 3 &&
        Math.abs(item.mean - populationMean) / deviation > 1.5,
    )
    .map((item) => ({
      judgeId: item.judgeId,
      delta: Math.round((item.mean - populationMean) * 10) / 10,
      samples: item.samples,
    }));
}
