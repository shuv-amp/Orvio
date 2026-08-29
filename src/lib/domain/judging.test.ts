import { describe, expect, it } from "vitest";
import { detectScoreDrift, weightedScore } from "./judging";

describe("judging", () => {
  it("uses the locked weighted rubric", () => {
    expect(weightedScore({ functionality: 8, innovation: 9, impact: 8, google: 9, presentation: 8 })).toBe(84);
  });

  it("does not flag drift with insufficient evidence", () => {
    expect(detectScoreDrift([{ teamId: "t1", judgeId: "j1", rubricVersion: "v3", scores: {}, feedback: "", finalized: true }])).toEqual([]);
  });
});
