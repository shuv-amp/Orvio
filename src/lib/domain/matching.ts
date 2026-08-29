import type { Participant, Team, TeamRecommendation } from "./types";

const REQUIRED_SKILL_GROUPS = [
  ["Python", "Gemini", "ML", "AI/ML"],
  ["React", "TypeScript", "UI/UX", "Accessibility"],
  ["Firebase", "Cloud Run", "Go", "APIs", "Backend", "Cloud"],
  ["Pitching", "Research", "Product"],
];

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

function overlap(left: string[], right: string[]) {
  const normalized = new Set(left.map((item) => item.toLowerCase()));
  return right.filter((item) => normalized.has(item.toLowerCase())).length;
}

/**
 * Rank teams for a participant using a bounded, explainable model:
 * 35% skill coverage, 25% interest overlap, 20% role complementarity,
 * 10% availability, 10% team-size balance. O(teams × members).
 */
export function recommendTeams(
  participant: Participant,
  candidateTeams: Team[],
): TeamRecommendation[] {
  return candidateTeams
    .filter((team) => team.members.length < 4)
    .map((team) => {
      const teamSkills = [
        ...new Set(team.members.flatMap((member) => member.skills)),
      ];
      const teamInterests = [
        ...new Set(team.members.flatMap((member) => member.interests)),
      ];
      const combinedSkills = [...teamSkills, ...participant.skills];
      const coveredGroups = REQUIRED_SKILL_GROUPS.filter((group) =>
        group.some((skill) => combinedSkills.includes(skill)),
      ).length;
      const skillCoverage = clamp(
        (coveredGroups / REQUIRED_SKILL_GROUPS.length) * 100,
      );
      const interestMatch = clamp(
        (overlap(participant.interests, teamInterests) /
          Math.max(1, participant.interests.length)) *
          100,
      );
      const sameRole = team.members.some(
        (member) => member.role === participant.role,
      );
      const roleComplementarity = sameRole ? 58 : 96;
      const averageAvailability =
        team.members.reduce((sum, member) => sum + member.availability, 0) /
        team.members.length;
      const availabilityMatch = clamp(
        100 - Math.abs(averageAvailability - participant.availability) * 100,
      );
      const teamBalance = clamp(
        100 - Math.abs(3 - (team.members.length + 1)) * 22,
      );
      const totalScore = clamp(
        skillCoverage * 0.35 +
          interestMatch * 0.25 +
          roleComplementarity * 0.2 +
          availabilityMatch * 0.1 +
          teamBalance * 0.1,
      );
      const missingSkills = REQUIRED_SKILL_GROUPS.filter(
        (group) => !group.some((skill) => combinedSkills.includes(skill)),
      ).map((group) => group[0]);
      const addedSkills = participant.skills.filter(
        (skill) => !teamSkills.includes(skill),
      );

      return {
        teamId: team.id,
        totalScore,
        skillCoverage,
        interestMatch,
        roleComplementarity,
        availabilityMatch,
        teamBalance,
        reasons: [
          `${addedSkills.slice(0, 2).join(" + ") || "Your product perspective"} closes a capability gap`,
          `${overlap(participant.interests, teamInterests)} shared project interests`,
          sameRole
            ? "Similar role; useful redundancy"
            : "Complementary role with low overlap",
        ],
        missingSkills,
      };
    })
    .sort(
      (left, right) =>
        right.totalScore - left.totalScore ||
        left.teamId.localeCompare(right.teamId),
    );
}
