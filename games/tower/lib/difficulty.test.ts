import { describe, it, expect } from "vitest";
import {
  TOWER_DIFF_TIERS,
  generateTowerParams,
  towerParamsGenerator,
} from "./difficulty";

describe("towerParamsGenerator (provider)", () => {
  // ─── Determinism & API Tests ──────────────────────────────────────────────

  it("is deterministic with same seed (byTier)", () => {
    const a = towerParamsGenerator.byTier(0, 12345);
    const b = towerParamsGenerator.byTier(0, 12345);

    expect(a).toEqual(b);
  });

  it("is deterministic with same seed (byLevel)", () => {
    const a = towerParamsGenerator.byLevel(15);
    const b = towerParamsGenerator.byLevel(15);

    expect(a).toEqual(b);
  });

  // ─── Tier Configuration Bounds ─────────────────────────────────────────────

  it("respects tier structural definitions", () => {
    TOWER_DIFF_TIERS.forEach((tier, idx) => {
      const params = towerParamsGenerator.byTier(idx, 123);

      expect(params.size).toBe(tier.size);
      expect(params.uniqueColors).toBe(tier.uniqueColors);
      expect(params.maxSameColor).toBe(tier.maxSameColor);
      expect(params.tier.name).toBe(tier.name);
    });
  });

  // ─── Range Validation Loops ────────────────────────────────────────────────

  it("keeps entropy factor in valid normalized floating range", () => {
    for (let score = 1; score <= 9; score++) {
      const params = generateTowerParams(score, 123);

      expect(params.entropyFactor).toBeGreaterThanOrEqual(0);
      expect(params.entropyFactor).toBeLessThanOrEqual(1.0);
    }
  });

  it("keeps max tower height within safe gameplay constraints", () => {
    for (let score = 1; score <= 9; score++) {
      const params = generateTowerParams(score, 123);

      // Height should stay within your clamped bounds [6, 15]
      expect(params.maxTowerHeight).toBeGreaterThanOrEqual(6);
      expect(params.maxTowerHeight).toBeLessThanOrEqual(15);
    }
  });

  // ─── Difficulty Progression Scaling ────────────────────────────────────────

  it("difficulty scaling: base tower structural density tightens down", () => {
    const easy = generateTowerParams(1, 123);
    const hard = generateTowerParams(9, 123);

    // As score scales up, available workspace limits descend to clamp pressure
    expect(hard.maxTowerHeight).toBeLessThanOrEqual(easy.maxTowerHeight);
  });

  it("difficulty scaling: variance vectors amplify entropy", () => {
    const easy = generateTowerParams(1, 123);
    const hard = generateTowerParams(9, 123);

    expect(hard.tier.variance).toBeGreaterThan(easy.tier.variance);
  });

  // ─── Edge Case & Boundary Underflow / Overflow Safety ──────────────────────

  it("enforces clamp boundaries cleanly when input scores underflow or overflow", () => {
    const minParams = generateTowerParams(-10, 555);
    const maxParams = generateTowerParams(999, 555);

    expect(minParams.tier.diffScore).toBe(1);
    expect(maxParams.tier.diffScore).toBe(9);
  });

  it("rounds floating values to nearest integer tier cleanly", () => {
    const paramsLower = generateTowerParams(2.4, 777);
    const paramsHigher = generateTowerParams(2.6, 777);

    expect(paramsLower.tier.name).toBe("Wood Tower"); // Index 1
    expect(paramsHigher.tier.name).toBe("Stone Tower"); // Index 2
  });
});
