import type { Team } from "./types";

/**
 * Rank published aggregates in linear time. Clients never recompute from
 * raw score documents; they render this ordered snapshot.
 */
export function rankPublishedScores(teams: Team[]): Team[] {
  return [...teams].sort(
    (left, right) =>
      right.score - left.score || left.name.localeCompare(right.name),
  );
}

/** Apply one finalized rubric total and re-rank without mutating input. */
export function applyPublishedScore(
  teams: Team[],
  teamId: string,
  score: number,
): Team[] {
  const bounded = Math.max(0, Math.min(100, Math.round(score * 10) / 10));
  return rankPublishedScores(
    teams.map((team) =>
      team.id === teamId
        ? { ...team, score: bounded, judged: Math.min(3, team.judged + 1) }
        : team,
    ),
  );
}
