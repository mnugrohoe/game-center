// difficulty.test.ts

import { describe, it, expect } from "vitest";

import {
  SHIKAKU_TIERS,
  diffScoreToParams,
  getShikakuParamsByLevel,
  getShikakuParamsByTierIdx,
} from "./difficulty";

import { mkRng } from "@/shared/algorithms";

describe("SHIKAKU_TIERS", () => {
  it("tiers are ordered by diffScore", () => {
    for (let i = 1; i < SHIKAKU_TIERS.length; i++) {
      expect(SHIKAKU_TIERS[i].diffScore).toBeGreaterThan(
        SHIKAKU_TIERS[i - 1].diffScore,
      );
    }
  });

  it("all tiers have valid board ranges", () => {
    for (const tier of SHIKAKU_TIERS) {
      expect(tier.minBoard).toBeGreaterThan(0);
      expect(tier.maxBoard).toBeGreaterThanOrEqual(tier.minBoard);
    }
  });
});

describe("diffScoreToParams", () => {
  it("creates valid params for every tier", () => {
    for (let score = 1; score <= SHIKAKU_TIERS.length; score++) {
      const rng = mkRng(score);
      const p = diffScoreToParams(score, rng);

      const boardArea = p.width * p.height;

      expect(p.width).toBeGreaterThan(0);
      expect(p.height).toBeGreaterThan(0);

      expect(p.rectCount).toBeGreaterThan(0);

      expect(p.minArea).toBeGreaterThanOrEqual(2);
      expect(p.minArea).toBeLessThanOrEqual(8);

      expect(p.compactness).toBeGreaterThanOrEqual(0.1);
      expect(p.compactness).toBeLessThanOrEqual(1);

      expect(p.sizeVariance).toBeGreaterThanOrEqual(0);
      expect(p.sizeVariance).toBeLessThanOrEqual(1);

      expect(p.anchorAmbiguity).toBeGreaterThanOrEqual(0);
      expect(p.anchorAmbiguity).toBeLessThanOrEqual(1);

      // Most important invariant
      expect(p.minArea * p.rectCount).toBeLessThanOrEqual(boardArea);
    }
  });

  it("clamps scores below minimum", () => {
    const low = diffScoreToParams(-100, mkRng(1));
    const beginner = diffScoreToParams(1, mkRng(1));

    expect(low).toEqual(beginner);
  });

  it("clamps scores above maximum", () => {
    const high = diffScoreToParams(999, mkRng(1));
    const nightmare = diffScoreToParams(SHIKAKU_TIERS.length, mkRng(1));

    expect(high).toEqual(nightmare);
  });

  it("hard tiers are more ambiguous than easy tiers", () => {
    const easy = diffScoreToParams(1, mkRng(1));
    const hard = diffScoreToParams(SHIKAKU_TIERS.length, mkRng(1));

    expect(hard.anchorAmbiguity).toBeGreaterThan(easy.anchorAmbiguity);
  });

  it("hard tiers have larger variance", () => {
    const easy = diffScoreToParams(1, mkRng(1));
    const hard = diffScoreToParams(SHIKAKU_TIERS.length, mkRng(1));

    expect(hard.sizeVariance).toBeGreaterThan(easy.sizeVariance);
  });

  it("hard tiers have lower compactness", () => {
    const easy = diffScoreToParams(1, mkRng(1));
    const hard = diffScoreToParams(SHIKAKU_TIERS.length, mkRng(1));

    expect(hard.compactness).toBeLessThan(easy.compactness);
  });

  it("always satisfies area capacity constraint", () => {
    for (let score = 1; score <= SHIKAKU_TIERS.length; score++) {
      for (let seed = 0; seed < 100; seed++) {
        const p = diffScoreToParams(score, mkRng(seed));

        const boardArea = p.width * p.height;

        expect(p.rectCount, `score=${score} seed=${seed}`).toBeLessThanOrEqual(
          Math.floor(boardArea / p.minArea),
        );

        expect(
          p.minArea * p.rectCount,
          `score=${score} seed=${seed}`,
        ).toBeLessThanOrEqual(boardArea);
      }
    }
  });
});

describe("getShikakuParamsByLevel", () => {
  it("returns valid params", () => {
    const rng = mkRng(123);
    const params = getShikakuParamsByLevel(1, rng);

    expect(params.width).toBeGreaterThan(0);
    expect(params.height).toBeGreaterThan(0);
  });
});

describe("getShikakuParamsByTierIdx", () => {
  it("returns params for every tier", () => {
    const rng = mkRng(777);
    for (let i = 0; i < SHIKAKU_TIERS.length; i++) {
      const params = getShikakuParamsByTierIdx(i, rng);

      expect(params.width).toBeGreaterThan(0);
      expect(params.height).toBeGreaterThan(0);
    }
  });

  it("uses provided rng", () => {
    const rngA = mkRng(456);
    const rngB = mkRng(789);
    const a = getShikakuParamsByTierIdx(0, rngA);
    const b = getShikakuParamsByTierIdx(0, rngB);

    expect(a).not.toEqual(b);
  });

  it("visual get 10 params from low tier", () => {
    const params = [];
    for (let i = 0; i < 10; i++) {
      const rng = mkRng(i);
      const param = getShikakuParamsByTierIdx(0, rng);
      params.push(param);
    }
    console.log("======== PARAMS LOW =========");
    console.table(params);
  });

  it("visual get 10 params from high tier", () => {
    const params = [];
    for (let i = 0; i < 10; i++) {
      const rng = mkRng(i);
      const param = getShikakuParamsByTierIdx(SHIKAKU_TIERS.length - 1, rng);
      params.push(param);
    }
    console.log("======== PARAMS HIGH =========");
    console.table(params);
  });
});
