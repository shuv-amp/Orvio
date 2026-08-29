import { describe, expect, it } from "vitest";
import { detectScoreDrift, weightedScore } from "./judging";

describe("judging", () => {
  it("uses the locked weighted rubric", () => {
    expect(
      weightedScore({
        functionality: 8,
        innovation: 9,
        impact: 8,
        google: 9,
        presentation: 8,
      }),
    ).toBe(84);
  });

  it("does not flag drift with insufficient evidence", () => {
    expect(
      detectScoreDrift([
        {
          teamId: "t1",
          judgeId: "j1",
          rubricVersion: "v3",
          scores: {},
          feedback: "",
          finalized: true,
        },
      ]),
    ).toEqual([]);
  });

  it("caps a perfect rubric at 100", () => {
    expect(
      weightedScore({
        functionality: 10,
        innovation: 10,
        impact: 10,
        google: 10,
        presentation: 10,
      }),
    ).toBe(100);
  });

  it("flags a well-sampled severity outlier without changing scores", () => {
    const records = ["j1", "j2", "j3", "j4"].flatMap((judgeId, judgeIndex) =>
      ["t1", "t2", "t3"].map((teamId) => ({
        teamId,
        judgeId,
        rubricVersion: "v3",
        scores: {
          functionality: judgeIndex === 3 ? 2 : 8,
          innovation: judgeIndex === 3 ? 2 : 8,
          impact: judgeIndex === 3 ? 2 : 8,
          google: judgeIndex === 3 ? 2 : 8,
          presentation: judgeIndex === 3 ? 2 : 8,
        },
        feedback: "Evidence",
        finalized: true,
      })),
    );
    const drift = detectScoreDrift(records);
    expect(drift).toEqual([{ judgeId: "j4", delta: -45, samples: 3 }]);
  });
});
