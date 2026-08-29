import { describe, expect, it } from "vitest";
import {
  TOUR_STEPS,
  clampStep,
  nextStep,
  previousStep,
  stepProgressLabel,
} from "./tour";

describe("TOUR_STEPS", () => {
  it("uses a unique id and target per step", () => {
    expect(new Set(TOUR_STEPS.map((step) => step.id)).size).toBe(
      TOUR_STEPS.length,
    );
    expect(new Set(TOUR_STEPS.map((step) => step.target)).size).toBe(
      TOUR_STEPS.length,
    );
  });

  it("visits every role the challenge asks the platform to serve", () => {
    expect(new Set(TOUR_STEPS.map((step) => step.view))).toEqual(
      new Set(["organizer", "participant", "judge", "scanner"]),
    );
  });

  it("targets elements by a data-tour attribute the views own", () => {
    for (const step of TOUR_STEPS) {
      expect(step.target).toMatch(/^\[data-tour='[a-z-]+'\]$/);
      expect(step.body.length).toBeGreaterThan(60);
    }
  });

  it("only sets a section for organizer steps", () => {
    for (const step of TOUR_STEPS) {
      if (step.section) expect(step.view).toBe("organizer");
    }
  });
});

describe("clampStep", () => {
  it("keeps valid indexes untouched", () => {
    expect(clampStep(0)).toBe(0);
    expect(clampStep(2)).toBe(2);
  });

  it("clamps out-of-range and non-finite indexes", () => {
    expect(clampStep(-4)).toBe(0);
    expect(clampStep(99)).toBe(TOUR_STEPS.length - 1);
    expect(clampStep(Number.NaN)).toBe(0);
    expect(clampStep(1.8)).toBe(1);
  });
});

describe("nextStep and previousStep", () => {
  it("walks forward and stops after the last step", () => {
    expect(nextStep(0)).toBe(1);
    expect(nextStep(TOUR_STEPS.length - 1)).toBeNull();
  });

  it("walks backward and stops before the first step", () => {
    expect(previousStep(1)).toBe(0);
    expect(previousStep(0)).toBeNull();
  });
});

describe("stepProgressLabel", () => {
  it("counts from one for people, not from zero", () => {
    expect(stepProgressLabel(0)).toBe(`Step 1 of ${TOUR_STEPS.length}`);
    expect(stepProgressLabel(TOUR_STEPS.length - 1)).toBe(
      `Step ${TOUR_STEPS.length} of ${TOUR_STEPS.length}`,
    );
  });
});
