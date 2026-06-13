import { describe, it, expect } from "vitest";

import {
  SHIKAKU_TIERS,
  generateShikakuParams,
  shikakuParamsGenerator,
} from "./difficulty";

describe("shikakuParamsGenerator (provider)", () => {
  it("is deterministic with same seed (byTier)", () => {
    const a = shikakuParamsGenerator.byTier(2, 12345);
    const b = shikakuParamsGenerator.byTier(2, 12345);

    expect(a).toEqual(b);
  });

  it("respects tier board boundaries", () => {
    SHIKAKU_TIERS.forEach((tier, idx) => {
      const params = shikakuParamsGenerator.byTier(idx, 999);

      expect(params.width).toBeGreaterThanOrEqual(tier.minBoard);
      expect(params.width).toBeLessThanOrEqual(tier.maxBoard);

      expect(params.height).toBeGreaterThanOrEqual(tier.minBoard);
      expect(params.height).toBeLessThanOrEqual(tier.maxBoard);
    });
  });

  it("keeps compactness in valid range", () => {
    for (let score = 1; score <= 9; score++) {
      const params = generateShikakuParams(score, 123);

      expect(params.compactness).toBeGreaterThanOrEqual(0.1);
      expect(params.compactness).toBeLessThanOrEqual(1);
    }
  });

  it("keeps size variance in valid range", () => {
    for (let score = 1; score <= 9; score++) {
      const params = generateShikakuParams(score, 123);

      expect(params.sizeVariance).toBeGreaterThanOrEqual(0);
      expect(params.sizeVariance).toBeLessThanOrEqual(1);
    }
  });

  it("keeps anchor ambiguity in valid range", () => {
    for (let score = 1; score <= 9; score++) {
      const params = generateShikakuParams(score, 123);

      expect(params.anchorAmbiguity).toBeGreaterThanOrEqual(0);
      expect(params.anchorAmbiguity).toBeLessThanOrEqual(1);
    }
  });

  it("valid rectangle count constraints", () => {
    for (let score = 1; score <= 9; score++) {
      const params = generateShikakuParams(score, 123);

      const boardArea = params.width * params.height;

      expect(params.rectCount).toBeGreaterThanOrEqual(4);
      expect(params.rectCount).toBeLessThanOrEqual(Math.floor(boardArea / 2));
    }
  });

  it("difficulty scaling: ambiguity increases", () => {
    const easy = generateShikakuParams(1, 123);
    const hard = generateShikakuParams(9, 123);

    expect(hard.anchorAmbiguity).toBeGreaterThan(easy.anchorAmbiguity);
  });

  it("difficulty scaling: compactness decreases", () => {
    const easy = generateShikakuParams(1, 123);
    const hard = generateShikakuParams(9, 123);

    expect(hard.compactness).toBeLessThan(easy.compactness);
  });
});
