import { describe, expect, it } from "vitest";
import {
  SPARKLINE_HEIGHT,
  SPARKLINE_WIDTH,
  describeTrend,
  sparklineAreaPath,
  sparklinePath,
  trendDelta,
  trendDirection,
} from "./sparkline";

const rising = [10, 20, 30, 40, 50];

describe("sparklinePath", () => {
  it("returns nothing for an empty series", () => {
    expect(sparklinePath([])).toBe("");
    expect(sparklineAreaPath([])).toBe("");
  });

  it("spans the full viewBox width", () => {
    const path = sparklinePath(rising);
    expect(path.startsWith("M0 ")).toBe(true);
    expect(path).toContain(`L${SPARKLINE_WIDTH} `);
  });

  it("puts the highest sample above the lowest", () => {
    const [, ...rest] = sparklinePath(rising).split(" L");
    const firstY = Number(sparklinePath(rising).split(" ")[1]);
    const lastY = Number(rest[rest.length - 1].split(" ")[1]);
    expect(lastY).toBeLessThan(firstY);
  });

  it("keeps every point inside the viewBox", () => {
    const numbers = sparklinePath([3, 99, 1, 47])
      .replace(/[ML]/g, " ")
      .trim()
      .split(/\s+/)
      .map(Number);
    for (let i = 0; i < numbers.length; i += 2) {
      expect(numbers[i]).toBeGreaterThanOrEqual(0);
      expect(numbers[i]).toBeLessThanOrEqual(SPARKLINE_WIDTH);
      expect(numbers[i + 1]).toBeGreaterThanOrEqual(0);
      expect(numbers[i + 1]).toBeLessThanOrEqual(SPARKLINE_HEIGHT);
    }
  });

  it("draws a flat series without dividing by zero", () => {
    const path = sparklinePath([7, 7, 7]);
    expect(path).not.toContain("NaN");
    expect(path).not.toContain("Infinity");
  });

  it("closes the area path back to the baseline", () => {
    const area = sparklineAreaPath(rising);
    expect(area.endsWith("Z")).toBe(true);
    expect(area).toContain(`L0 ${SPARKLINE_HEIGHT} Z`);
  });
});

describe("trendDelta", () => {
  it("is zero without at least two samples", () => {
    expect(trendDelta([])).toBe(0);
    expect(trendDelta([42])).toBe(0);
  });

  it("reports percentage change between first and last sample", () => {
    expect(trendDelta([10, 15])).toBe(50);
    expect(trendDelta([20, 10])).toBe(-50);
  });

  it("does not divide by a zero baseline", () => {
    expect(trendDelta([0, 5])).toBe(100);
    expect(trendDelta([0, 0])).toBe(0);
  });
});

describe("trendDirection", () => {
  it("classifies rising, falling, and flat series", () => {
    expect(trendDirection(rising)).toBe("up");
    expect(trendDirection([5, 4, 3])).toBe("down");
    expect(trendDirection([5, 9, 5])).toBe("flat");
  });
});

describe("describeTrend", () => {
  it("states the direction in words rather than colour alone", () => {
    expect(describeTrend("Checked in", rising)).toBe(
      "Checked in is up 400% over the last hour.",
    );
    expect(describeTrend("Reach", [8, 4])).toBe(
      "Reach is down 50% over the last hour.",
    );
    expect(describeTrend("Reach", [4, 4])).toBe(
      "Reach is unchanged over the last hour.",
    );
  });
});
