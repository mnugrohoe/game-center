import { describe, expect, it } from "vitest";

import {
  KINGS_TIERS,
  clamp,
  diffScoreToTierIdx,
  generateKingsParams,
  kingsParamsGenerator,
  lerp,
  levelToDiffScore,
  levelToTierIdx,
  normalizeScore,
} from "./difficulty";

describe("KINGS_TIERS", () => {
  it("defines 9 tiers", () => {
    expect(KINGS_TIERS).toHaveLength(9);
  });

  it("has ascending unique diff scores", () => {
    const scores = KINGS_TIERS.map((t) => t.diffScore);

    expect(scores).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(new Set(scores).size).toBe(scores.length);
  });

  it("has valid min/max grid ranges", () => {
    for (const tier of KINGS_TIERS) {
      expect(tier.minGrid).toBeGreaterThanOrEqual(4);
      expect(tier.maxGrid).toBeLessThanOrEqual(13);
      expect(tier.minGrid).toBeLessThanOrEqual(tier.maxGrid);
    }
  });

  it("contains required display fields", () => {
    for (const tier of KINGS_TIERS) {
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

      expect(Number.isFinite(result)).toBe(true);
      expect(result).toBeGreaterThan(0);
    }
  });

  it("levelToTierIdx returns valid tier indexes", () => {
    for (let level = 1; level <= 100; level++) {
      const idx = levelToTierIdx(level, KINGS_TIERS.length);

      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(KINGS_TIERS.length);
    }
  });

  it("diffScoreToTierIdx returns valid indexes", () => {
    for (let score = 1; score <= 20; score++) {
      const idx = diffScoreToTierIdx(score, KINGS_TIERS.length);

      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(KINGS_TIERS.length);
    }
  });

  it("normalizeScore returns finite values", () => {
    for (let score = 1; score <= 20; score++) {
      const result = normalizeScore(score);

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

describe("generateKingsParams", () => {
  it("returns a valid params object", () => {
    const result = generateKingsParams(5, 12345);

    expect(result).toHaveProperty("N");
    expect(result).toHaveProperty("compactness");
    expect(result).toHaveProperty("sizeVariance");
    expect(result).toHaveProperty("tier");
    expect(result).toHaveProperty("seed");
  });

  it("keeps N within valid bounds", () => {
    for (let score = 1; score <= 9; score++) {
      const result = generateKingsParams(score, 12345);

      expect(result.N).toBeGreaterThanOrEqual(5);
      expect(result.N).toBeLessThanOrEqual(15);
    }
  });

  it("keeps compactness within bounds", () => {
    for (let score = 1; score <= 9; score++) {
      const result = generateKingsParams(score, 12345);

      expect(result.compactness).toBeGreaterThanOrEqual(0.1);
      expect(result.compactness).toBeLessThanOrEqual(0.95);
    }
  });

  it("keeps sizeVariance within bounds", () => {
    for (let score = 1; score <= 9; score++) {
      const result = generateKingsParams(score, 12345);

      expect(result.sizeVariance).toBeGreaterThanOrEqual(0);
      expect(result.sizeVariance).toBeLessThanOrEqual(1);
    }
  });

  it("returns the expected tier", () => {
    for (let tierIdx = 0; tierIdx < KINGS_TIERS.length; tierIdx++) {
      const result = generateKingsParams(KINGS_TIERS[tierIdx].diffScore, 12345);

      expect(result.tier).toBe(KINGS_TIERS[tierIdx]);
    }
  });

  it("is deterministic for the same seed", () => {
    const a = generateKingsParams(5, 12345);
    const b = generateKingsParams(5, 12345);

    expect(a).toEqual(b);
  });

  it("generally increases sizeVariance with higher scores", () => {
    const easy = generateKingsParams(1, 12345);
    const hard = generateKingsParams(9, 12345);

    expect(hard.sizeVariance).toBeGreaterThan(easy.sizeVariance);
  });

  it("generally decreases compactness with higher scores", () => {
    const easy = generateKingsParams(1, 12345);
    const hard = generateKingsParams(9, 12345);

    expect(hard.compactness).toBeLessThan(easy.compactness);
  });

  it("visual get 10 params from low tier", () => {
    const params = [];

    for (let seed = 1; seed <= 10; seed++) {
      params.push(kingsParamsGenerator.byTier(0, seed));
    }

    console.log("======== KINGS PARAMS LOW =========");
    console.table(
      params.map((p) => ({
        N: p.N,
        compactness: p.compactness.toFixed(3),
        sizeVariance: p.sizeVariance.toFixed(3),
        tier: p.tier.name,
        seed: p.seed,
      })),
    );
  });

  it("visual get 10 params from high tier", () => {
    const params = [];

    for (let seed = 1; seed <= 10; seed++) {
      params.push(kingsParamsGenerator.byTier(KINGS_TIERS.length - 1, seed));
    }

    console.log("======== KINGS PARAMS HIGH =========");
    console.table(
      params.map((p) => ({
        N: p.N,
        compactness: p.compactness.toFixed(3),
        sizeVariance: p.sizeVariance.toFixed(3),
        tier: p.tier.name,
        seed: p.seed,
      })),
    );
  });
});

describe("kingsParamsGenerator (provider)", () => {
  it("generates valid params from level", () => {
    for (let level = 1; level <= 50; level++) {
      const result = kingsParamsGenerator.byLevel(level);

      expect(result.N).toBeGreaterThanOrEqual(4);
      expect(result.N).toBeLessThanOrEqual(13);

      expect(result.compactness).toBeGreaterThanOrEqual(0.1);
      expect(result.compactness).toBeLessThanOrEqual(0.95);

      expect(result.sizeVariance).toBeGreaterThanOrEqual(0);
      expect(result.sizeVariance).toBeLessThanOrEqual(1);

      expect(result.tier).toBeDefined();
    }
  });

  it("is deterministic by level", () => {
    expect(kingsParamsGenerator.byLevel(25)).toEqual(
      kingsParamsGenerator.byLevel(25),
    );
  });

  it("generates valid params from tier", () => {
    for (let tierIdx = 0; tierIdx < KINGS_TIERS.length; tierIdx++) {
      const result = kingsParamsGenerator.byTier(tierIdx, 12345);

      expect(result.N).toBeGreaterThanOrEqual(5);
      expect(result.N).toBeLessThanOrEqual(15);

      expect(result.tier).toBe(KINGS_TIERS[tierIdx]);
    }
  });

  it("is deterministic by tier + seed", () => {
    expect(kingsParamsGenerator.byTier(3, 99999)).toEqual(
      kingsParamsGenerator.byTier(3, 99999),
    );
  });

  it("varies with different seeds", () => {
    const a = kingsParamsGenerator.byTier(3, 11111);
    const b = kingsParamsGenerator.byTier(3, 22222);

    expect(a).not.toEqual(b);
  });
});
