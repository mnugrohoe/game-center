// games/kings/lib/difficulty.test.ts

import { describe, expect, it, vi } from "vitest";

import {
  DIFF_TIERS,
  clamp,
  diffScoreToParams,
  diffScoreToTierIdx,
  getParamsByLevel,
  getParamsByTierIdx,
  lerp,
  levelToDiffScore,
  levelToTierIdx,
  normalizeScore,
} from "./difficulty";

describe("DIFF_TIERS", () => {
  it("defines 9 tiers", () => {
    expect(DIFF_TIERS).toHaveLength(9);
  });

  it("has ascending unique diff scores", () => {
    const scores = DIFF_TIERS.map((t) => t.diffScore);

    expect(scores).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(new Set(scores).size).toBe(scores.length);
  });

  it("has valid min/max grid ranges", () => {
    for (const tier of DIFF_TIERS) {
      expect(tier.minGrid).toBeGreaterThanOrEqual(4);
      expect(tier.maxGrid).toBeLessThanOrEqual(13);
      expect(tier.minGrid).toBeLessThanOrEqual(tier.maxGrid);
    }
  });

  it("contains required display fields", () => {
    for (const tier of DIFF_TIERS) {
      expect(tier.name).toBeTruthy();
      expect(tier.icon).toBeTruthy();

      expect(tier.color).toMatch(/^#/);
      expect(tier.dim).toMatch(/^#/);
      expect(tier.bright).toMatch(/^#/);
    }
  });
});

describe("shared helper re-exports", () => {
  it("levelToDiffScore returns finite positive values", () => {
    for (let level = 1; level <= 100; level++) {
      const result = levelToDiffScore(level);

      expect(typeof result).toBe("number");
      expect(Number.isFinite(result)).toBe(true);
      expect(result).toBeGreaterThan(0);
    }
  });

  it("levelToTierIdx returns valid tier indexes", () => {
    for (let level = 1; level <= 100; level++) {
      const idx = levelToTierIdx(level, DIFF_TIERS.length);

      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(DIFF_TIERS.length);
    }
  });

  it("diffScoreToTierIdx returns valid indexes", () => {
    for (let score = 1; score <= 20; score++) {
      const idx = diffScoreToTierIdx(score, DIFF_TIERS.length);

      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(DIFF_TIERS.length);
    }
  });

  it("normalizeScore returns finite positive values", () => {
    for (let score = 1; score <= 20; score++) {
      const result = normalizeScore(score);

      expect(typeof result).toBe("number");
      expect(Number.isFinite(result)).toBe(true);
      expect(result).toBeGreaterThanOrEqual(0);
    }
  });

  it("clamp restricts values to bounds", () => {
    expect(clamp(5, 1, 10)).toBe(5);
    expect(clamp(-5, 1, 10)).toBe(1);
    expect(clamp(99, 1, 10)).toBe(10);
  });

  it("lerp interpolates correctly", () => {
    expect(lerp(0, 10, 0)).toBe(0);
    expect(lerp(0, 10, 1)).toBe(10);
    expect(lerp(0, 10, 0.5)).toBe(5);
  });
});

describe("diffScoreToParams", () => {
  const fixedRng = () => 0.5;

  it("returns a valid puzzle params object", () => {
    const result = diffScoreToParams(5, fixedRng);

    expect(result).toHaveProperty("N");
    expect(result).toHaveProperty("compactness");
    expect(result).toHaveProperty("sizeVariance");
    expect(result).toHaveProperty("label");
  });

  it("keeps N within valid bounds", () => {
    for (let score = 1; score <= 9; score++) {
      const result = diffScoreToParams(score, fixedRng);

      expect(result.N).toBeGreaterThanOrEqual(4);
      expect(result.N).toBeLessThanOrEqual(13);
    }
  });

  it("keeps compactness within bounds", () => {
    for (let score = 1; score <= 9; score++) {
      const result = diffScoreToParams(score, fixedRng);

      expect(result.compactness).toBeGreaterThanOrEqual(0.1);
      expect(result.compactness).toBeLessThanOrEqual(0.95);
    }
  });

  it("keeps sizeVariance within bounds", () => {
    for (let score = 1; score <= 9; score++) {
      const result = diffScoreToParams(score, fixedRng);

      expect(result.sizeVariance).toBeGreaterThanOrEqual(0);
      expect(result.sizeVariance).toBeLessThanOrEqual(1);
    }
  });

  it("returns a valid label", () => {
    const labels = [
      "Trivial",
      "Very Easy",
      "Easy",
      "Moderate",
      "Medium",
      "Tricky",
      "Hard",
      "Very Hard",
      "Brutal",
    ];

    for (let score = 1; score <= 9; score++) {
      const result = diffScoreToParams(score, fixedRng);

      expect(labels).toContain(result.label);
    }
  });

  it("generally increases sizeVariance with higher scores", () => {
    const easy = diffScoreToParams(1, fixedRng);
    const hard = diffScoreToParams(9, fixedRng);

    expect(hard.sizeVariance).toBeGreaterThan(easy.sizeVariance);
  });

  it("generally decreases compactness with higher scores", () => {
    const easy = diffScoreToParams(1, fixedRng);
    const hard = diffScoreToParams(9, fixedRng);

    expect(hard.compactness).toBeLessThan(easy.compactness);
  });
});

describe("getParamsByLevel", () => {
  it("returns valid params", () => {
    for (let level = 1; level <= 50; level++) {
      const result = getParamsByLevel(level);

      expect(result.N).toBeGreaterThanOrEqual(4);
      expect(result.N).toBeLessThanOrEqual(13);

      expect(result.compactness).toBeGreaterThanOrEqual(0.1);
      expect(result.compactness).toBeLessThanOrEqual(0.95);

      expect(result.sizeVariance).toBeGreaterThanOrEqual(0);
      expect(result.sizeVariance).toBeLessThanOrEqual(1);

      expect(typeof result.label).toBe("string");
    }
  });

  it("is deterministic for the same level", () => {
    const a = getParamsByLevel(25);
    const b = getParamsByLevel(25);

    expect(a).toEqual(b);
  });
});

describe("getParamsByTierIdx", () => {
  it("returns valid params for every tier", () => {
    vi.spyOn(Date, "now").mockReturnValue(12345);

    for (let tierIdx = 0; tierIdx < DIFF_TIERS.length; tierIdx++) {
      const result = getParamsByTierIdx(tierIdx);

      expect(result.N).toBeGreaterThanOrEqual(4);
      expect(result.N).toBeLessThanOrEqual(13);

      expect(result.compactness).toBeGreaterThanOrEqual(0.1);
      expect(result.compactness).toBeLessThanOrEqual(0.95);

      expect(result.sizeVariance).toBeGreaterThanOrEqual(0);
      expect(result.sizeVariance).toBeLessThanOrEqual(1);

      expect(typeof result.label).toBe("string");
    }
  });

  it("is deterministic when Date.now is mocked", () => {
    vi.spyOn(Date, "now").mockReturnValue(99999);

    const a = getParamsByTierIdx(3);
    const b = getParamsByTierIdx(3);

    expect(a).toEqual(b);
  });
});
