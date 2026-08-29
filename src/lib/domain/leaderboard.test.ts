import { describe, expect, it } from "vitest";
import { applyPublishedScore, rankPublishedScores } from "./leaderboard";
import { teams } from "./seed";

describe("live leaderboard aggregation", () => {
  it("ranks by published score without mutating the source snapshot", () => {
    const ranked = rankPublishedScores(teams);
    expect(ranked.map((team) => team.name)).toEqual([
      "Project Aster",
      "Relay Health",
      "CivicLens",
    ]);
    expect(teams[0].score).toBe(92.4);
  });

  it("re-ranks immediately after a finalized rubric score", () => {
    const next = applyPublishedScore(teams, "t-1", 84);
    expect(next.map((team) => team.name)).toEqual([
      "Relay Health",
      "CivicLens",
      "Project Aster",
    ]);
    expect(next.find((team) => team.id === "t-1")?.score).toBe(84);
  });

  it("clamps out-of-range scores instead of overflowing the board", () => {
    expect(applyPublishedScore(teams, "t-3", 140)[0].score).toBe(100);
    expect(
      applyPublishedScore(teams, "t-3", -4).find((team) => team.id === "t-3")
        ?.score,
    ).toBe(0);
  });
});
