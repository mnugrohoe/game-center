import { describe, expect, it } from "vitest";
import {
  generateTowerSequence,
  generateTower,
  towerGenerator,
} from "./generator";
import { TOWER_DIFF_TIERS, type TowerParams } from "./difficulty";
import { mkRng } from "@/shared/algorithms";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeParams(partial: Partial<TowerParams> = {}): TowerParams {
  return {
    size: 4,
    uniqueColors: 4,
    maxSameColor: 2,
    maxTowerHeight: 10,
    entropyFactor: 0.5,
    tier: TOWER_DIFF_TIERS[0],
    seed: 123,
    ...partial,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// generateTowerSequence()
// ─────────────────────────────────────────────────────────────────────────────

describe("generateTowerSequence()", () => {
  it("generates correct target sequence length", () => {
    const seq = generateTowerSequence(5, 4, 3, 2, mkRng(123));
    expect(seq.length).toBe(5);
  });

  it("guarantees indices fall cleanly within zero-indexed unique color constraints", () => {
    const uniqueColors = 3;
    const seq = generateTowerSequence(30, uniqueColors, 15, 2, mkRng(123));

    for (const colorId of seq) {
      expect(colorId).toBeGreaterThanOrEqual(0);
      expect(colorId).toBeLessThan(uniqueColors);
    }
  });

  it("is deterministic when executing identical seeds", () => {
    const a = generateTowerSequence(6, 4, 2, 2, mkRng(123));
    const b = generateTowerSequence(6, 4, 2, 2, mkRng(123));

    expect(a).toEqual(b);
  });

  it("mutates structural variations across differing seeds", () => {
    const a = generateTowerSequence(6, 4, 2, 2, mkRng(1));
    const b = generateTowerSequence(6, 4, 2, 2, mkRng(2));

    expect(a).not.toEqual(b);
  });

  it("throws descriptive error messages on invalid input boundaries", () => {
    expect(() => generateTowerSequence(0, 4, 2, 1, mkRng(123))).toThrow(
      "Tower size must be greater than 0",
    );

    expect(() => generateTowerSequence(4, 0, 2, 1, mkRng(123))).toThrow(
      "Unique colors count must be greater than 0",
    );
  });

  it("recovers gracefully via fallback protection modes during impossible constraints", () => {
    // Total slots requested = 8. Global capacity rule allows max 3 slots (1 color * 3 limit).
    // This forces an allocation impossibility, ensuring the engine runs code fallback trees.
    expect(() => generateTowerSequence(8, 1, 3, 0, mkRng(123))).not.toThrow();

    const seq = generateTowerSequence(8, 1, 3, 0, mkRng(123));
    expect(seq).toHaveLength(8);
  });

  it("never outputs consecutive triple matching color streaks under layout variance", () => {
    for (let seed = 0; seed < 20; seed++) {
      const seq = generateTowerSequence(25, 3, 10, 4, mkRng(seed));

      for (let i = 2; i < seq.length; i++) {
        const hasTripleStreak = seq[i] === seq[i - 1] && seq[i] === seq[i - 2];
        expect(hasTripleStreak).toBe(false);
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateTower()
// ─────────────────────────────────────────────────────────────────────────────

describe("generateTower()", () => {
  it("returns valid compiled puzzle configurations", () => {
    const params = makeParams();
    const result = generateTower(params);

    expect(result.size).toBe(params.size);
    expect(result.maxTowerHeight).toBe(params.maxTowerHeight);
    expect(result.targetSequence.length).toBe(params.size);
    expect(result.params).toEqual(params);
  });

  it("preserves deterministic puzzle structural output integrity", () => {
    const params = makeParams();

    const a = generateTower(params);
    const b = generateTower(params);

    expect(a).toEqual(b);
  });

  it("branches internal puzzle instances when seed values mutate", () => {
    const params = makeParams();

    const a = generateTower({ ...params, seed: 101 });
    const b = generateTower({ ...params, seed: 202 });

    expect(a.targetSequence).not.toEqual(b.targetSequence);
  });

  it("visual debug", () => {
    const params = makeParams({
      size: 12,
      uniqueColors: 5,
      maxSameColor: 4,
    });

    const res = generateTower(params);

    // Construct horizontal string row block mapping out the sequence distribution
    const visualizationRow = res.targetSequence
      .map((colorId) => `[Color ${colorId}]`)
      .join(" ── ");

    console.log("\n=== TOWER SEQUENCE TARGET MAP ===\n");
    console.log(`Base ->  ${visualizationRow}  -> Top`);
    console.log("\n==================================\n");

    expect(res.targetSequence.length).toBe(params.size);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// towerGenerator Orchestrator Bridge
// ─────────────────────────────────────────────────────────────────────────────

describe("towerGenerator.byLevel()", () => {
  it("generates valid active running puzzles", () => {
    const result = towerGenerator.byLevel(1);

    expect(result.size).toBeGreaterThan(0);
    expect(result.maxTowerHeight).toBeGreaterThan(0);
    expect(result.targetSequence.length).toBe(result.size);
  });

  it("is fully deterministic on constant level indexes", () => {
    expect(towerGenerator.byLevel(42)).toEqual(towerGenerator.byLevel(42));
  });

  it("scales game properties across arbitrary programmatic difficulty intervals", () => {
    const varianceSamples = new Set<string>();

    for (let level = 1; level <= 10; level++) {
      const p = towerGenerator.byLevel(level);
      varianceSamples.add(JSON.stringify([p.size, p.params.uniqueColors]));
    }

    // Ensures difficulty shifts system parameters continuously across milestones
    expect(varianceSamples.size).toBeGreaterThan(1);
  });
});

describe("towerGenerator.byTier()", () => {
  it("generates error-free puzzles across all valid registration tiers", () => {
    for (let tierIdx = 0; tierIdx < TOWER_DIFF_TIERS.length; tierIdx++) {
      const tier = TOWER_DIFF_TIERS[tierIdx];
      const result = towerGenerator.byTier(tierIdx, 789);
      expect(result).toBeDefined();
      expect(result.size).toBe(tier.size);
      expect(result.params.uniqueColors).toBe(tier.uniqueColors);
      expect(result.targetSequence.length).toBe(result.size);
    }
  });

  it("is fully deterministic with matched tier configurations and seeds", () => {
    expect(towerGenerator.byTier(2, 555)).toEqual(
      towerGenerator.byTier(2, 555),
    );
  });
});
