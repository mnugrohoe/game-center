// games/mambo/lib/difficulty.test.ts
import { describe, expect, it } from "vitest";

import {
  DIFF_TIERS,
  diffScoreToTierIdx,
  levelToDiffScore,
  levelToTierIdx,
} from "./difficulty";

describe("DIFF_TIERS", () => {
  it("defines 9 difficulty tiers", () => {
    expect(DIFF_TIERS).toHaveLength(9);
  });

  it("has unique diffScore values in ascending order", () => {
    const scores = DIFF_TIERS.map((t) => t.diffScore);

    expect(new Set(scores).size).toBe(scores.length);
    expect(scores).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("uses even grid sizes", () => {
    for (const tier of DIFF_TIERS) {
      expect(tier.gridSize % 2).toBe(0);
    }
  });

  it("keeps ratios within valid bounds", () => {
    for (const tier of DIFF_TIERS) {
      expect(tier.initRatio).toBeGreaterThan(0);
      expect(tier.initRatio).toBeLessThanOrEqual(1);

      expect(tier.constraintRatio).toBeGreaterThan(0);
      expect(tier.constraintRatio).toBeLessThanOrEqual(1);
    }
  });

  it("contains required display fields", () => {
    for (const tier of DIFF_TIERS) {
      expect(tier.name).toBeTruthy();
      expect(tier.icon).toBeTruthy();
      expect(tier.sub).toBeTruthy();

      expect(tier.color).toMatch(/^#/);
      expect(tier.dim).toMatch(/^#/);
      expect(tier.bright).toMatch(/^#/);
    }
  });
});

describe("levelToDiffScore", () => {
  it("returns a positive integer score", () => {
    const result = levelToDiffScore(1);
    expect(result).toBeGreaterThan(0);
    expect(Number.isInteger(result)).toBe(true);
  });
});

describe("levelToTierIdx", () => {
  it("returns a valid tier index", () => {
    for (let level = 1; level <= 100; level++) {
      const idx = levelToTierIdx(level);

      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(DIFF_TIERS.length);
    }
  });
});

describe("diffScoreToTierIdx", () => {
  it("maps each tier diffScore to its own index", () => {
    DIFF_TIERS.forEach((tier, idx) => {
      expect(diffScoreToTierIdx(tier.diffScore, DIFF_TIERS.length)).toBe(idx);
    });
  });

  it("clamps large scores to the final tier", () => {
    const idx = diffScoreToTierIdx(999, DIFF_TIERS.length);

    expect(idx).toBe(DIFF_TIERS.length - 1);
  });
});
