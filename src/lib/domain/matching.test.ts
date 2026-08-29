import { describe, expect, it } from "vitest";
import { currentParticipant, teams } from "./seed";
import { recommendTeams } from "./matching";

describe("recommendTeams", () => {
  it("returns ranked, explainable recommendations", () => {
    const recommendations = recommendTeams(currentParticipant, teams);
    expect(recommendations).toHaveLength(3);
    expect(recommendations[0].totalScore).toBeGreaterThanOrEqual(
      recommendations[1].totalScore,
    );
    expect(recommendations[0].reasons).toHaveLength(3);
    expect(
      recommendations.every(
        (item) => item.totalScore >= 0 && item.totalScore <= 100,
      ),
    ).toBe(true);
  });

  it("excludes full teams", () => {
    const fullTeam = {
      ...teams[0],
      members: [
        teams[0].members[0],
        teams[0].members[1],
        currentParticipant,
        { ...currentParticipant, id: "fourth" },
      ],
    };
    expect(recommendTeams(currentParticipant, [fullTeam])).toEqual([]);
  });

  it("is deterministic for identical profiles", () => {
    expect(recommendTeams(currentParticipant, teams)).toEqual(
      recommendTeams(currentParticipant, teams),
    );
  });

  it("rewards complementary roles over duplicate roles", () => {
    const duplicateRole = {
      ...teams[0],
      id: "duplicate-role",
      members: teams[0].members.map((member) => ({
        ...member,
        role: currentParticipant.role,
      })),
    };
    const complementary = { ...teams[0], id: "complementary" };
    const results = recommendTeams(currentParticipant, [
      duplicateRole,
      complementary,
    ]);
    expect(
      results.find((item) => item.teamId === "complementary")!
        .roleComplementarity,
    ).toBeGreaterThan(
      results.find((item) => item.teamId === "duplicate-role")!
        .roleComplementarity,
    );
  });
});
