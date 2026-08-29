import { describe, expect, it } from "vitest";
import { currentParticipant, teams } from "./seed";
import { recommendTeams } from "./matching";

describe("recommendTeams", () => {
  it("returns ranked, explainable recommendations", () => {
    const recommendations = recommendTeams(currentParticipant, teams);
    expect(recommendations).toHaveLength(3);
    expect(recommendations[0].totalScore).toBeGreaterThanOrEqual(recommendations[1].totalScore);
    expect(recommendations[0].reasons).toHaveLength(3);
    expect(recommendations.every((item) => item.totalScore >= 0 && item.totalScore <= 100)).toBe(true);
  });

  it("excludes full teams", () => {
    const fullTeam = { ...teams[0], members: [teams[0].members[0], teams[0].members[1], currentParticipant, { ...currentParticipant, id: "fourth" }] };
    expect(recommendTeams(currentParticipant, [fullTeam])).toEqual([]);
  });
});
