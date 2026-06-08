import { describe, it, expect } from "vitest";

import {
  SHIKAKU_TIERS,
  generateShikakuParams,
  getShikakuParamsByLevel,
  getShikakuParamsByTierIdx,
} from "./difficulty";

describe("generateShikakuParams", () => {
  it("should be deterministic with same seed", () => {
    const a = generateShikakuParams(3, 12345);
    const b = generateShikakuParams(3, 12345);

    expect(a).toEqual(b);
  });

  it("should generate board size within tier limits", () => {
    SHIKAKU_TIERS.forEach((tier) => {
      const params = generateShikakuParams(tier.diffScore, 999);

      expect(params.width).toBeGreaterThanOrEqual(tier.minBoard);
      expect(params.width).toBeLessThanOrEqual(tier.maxBoard);

      expect(params.height).toBeGreaterThanOrEqual(tier.minBoard);
      expect(params.height).toBeLessThanOrEqual(tier.maxBoard);
    });
  });

  it("should keep compactness in valid range", () => {
    for (let score = 1; score <= 9; score++) {
      const params = generateShikakuParams(score, 123);

      expect(params.compactness).toBeGreaterThanOrEqual(0.1);
      expect(params.compactness).toBeLessThanOrEqual(1);
    }
  });

  it("should keep size variance in valid range", () => {
    for (let score = 1; score <= 9; score++) {
      const params = generateShikakuParams(score, 123);

      expect(params.sizeVariance).toBeGreaterThanOrEqual(0);
      expect(params.sizeVariance).toBeLessThanOrEqual(1);
    }
  });

  it("should keep anchor ambiguity in valid range", () => {
    for (let score = 1; score <= 9; score++) {
      const params = generateShikakuParams(score, 123);

      expect(params.anchorAmbiguity).toBeGreaterThanOrEqual(0);
      expect(params.anchorAmbiguity).toBeLessThanOrEqual(1);
    }
  });

  it("should generate valid rectangle count", () => {
    for (let score = 1; score <= 9; score++) {
      const params = generateShikakuParams(score, 123);

      const boardArea = params.width * params.height;

      expect(params.rectCount).toBeGreaterThanOrEqual(4);
      expect(params.rectCount).toBeLessThanOrEqual(Math.floor(boardArea / 2));
    }
  });

  it("should increase ambiguity as difficulty increases", () => {
    const easy = generateShikakuParams(1, 123);
    const hard = generateShikakuParams(9, 123);

    expect(hard.anchorAmbiguity).toBeGreaterThan(easy.anchorAmbiguity);
  });

  it("should decrease compactness as difficulty increases", () => {
    const easy = generateShikakuParams(1, 123);
    const hard = generateShikakuParams(9, 123);

    expect(hard.compactness).toBeLessThan(easy.compactness);
  });
});

describe("getShikakuParamsByLevel", () => {
  it("should be deterministic for same level", () => {
    const a = getShikakuParamsByLevel(50);
    const b = getShikakuParamsByLevel(50);

    expect(a).toEqual(b);
  });
});

describe("getShikakuParamsByTierIdx", () => {
  it("should use correct tier boundaries", () => {
    SHIKAKU_TIERS.forEach((tier, idx) => {
      const params = getShikakuParamsByTierIdx(idx, 123);

      expect(params.width).toBeGreaterThanOrEqual(tier.minBoard);

      expect(params.width).toBeLessThanOrEqual(tier.maxBoard);
    });
  });

  it("should be deterministic with same seed", () => {
    const a = getShikakuParamsByTierIdx(4, 999);
    const b = getShikakuParamsByTierIdx(4, 999);

    expect(a).toEqual(b);
  });

  it("visual get 10 params from low tier", () => {
    const params = [];
    for (let i = 1; i <= 10; i++) {
      const param = getShikakuParamsByTierIdx(0, i);
      params.push(param);
    }
    console.log("======== PARAMS LOW =========");
    console.table(params);
  });

  it("visual get 10 params from high tier", () => {
    const params = [];
    for (let i = 1; i <= 10; i++) {
      const param = getShikakuParamsByTierIdx(SHIKAKU_TIERS.length - 1, i);
      params.push(param);
    }
    console.log("======== PARAMS HIGH =========");
    console.table(params);
  });
});
