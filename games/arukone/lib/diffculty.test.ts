import { describe, expect, it } from "vitest";

import {
  ARUKONE_TIERS,
  generateArukoneParams,
  arukoneParamsGenerator,
} from "./difficulty";

describe("arukoneParamsGenerator", () => {
  it("is deterministic for identical tier and seed", () => {
    const a = arukoneParamsGenerator.byTier(4, 12345);
    const b = arukoneParamsGenerator.byTier(4, 12345);

    expect(a).toEqual(b);
  });

  it("always respects board size bounds defined by tier", () => {
    ARUKONE_TIERS.forEach((tier, idx) => {
      [1, 10, 99, 999, 12345].forEach((seed) => {
        const params = arukoneParamsGenerator.byTier(idx, seed);

        expect(params.rows).toBeGreaterThanOrEqual(tier.minSize);
        expect(params.rows).toBeLessThanOrEqual(tier.maxSize);

        expect(params.cols).toBeGreaterThanOrEqual(tier.minSize);
        expect(params.cols).toBeLessThanOrEqual(tier.maxSize);
      });
    });
  });

  it("always respects wall count bounds defined by tier", () => {
    ARUKONE_TIERS.forEach((tier, idx) => {
      [1, 10, 99, 999, 12345].forEach((seed) => {
        const params = arukoneParamsGenerator.byTier(idx, seed);

        expect(params.wallCount).toBeGreaterThanOrEqual(tier.minWalls);
        expect(params.wallCount).toBeLessThanOrEqual(tier.maxWalls);
      });
    });
  });

  it("always generates clue counts within expected ratio range", () => {
    const MIN_CLUE_RATIO = 0.22;
    const MAX_CLUE_RATIO = 0.3;

    for (let score = 1; score <= 9; score++) {
      for (let seed = 0; seed < 50; seed++) {
        const params = generateArukoneParams(score, seed);

        const area = params.rows * params.cols;

        const minExpected = Math.round(area * MIN_CLUE_RATIO);
        const maxExpected = Math.round(area * MAX_CLUE_RATIO);

        expect(params.clueCount).toBeGreaterThanOrEqual(
          Math.max(2, minExpected),
        );

        expect(params.clueCount).toBeLessThanOrEqual(Math.max(2, maxExpected));
      }
    }
  });

  it("always keeps clue count below board area", () => {
    for (let score = 1; score <= 9; score++) {
      for (let seed = 0; seed < 50; seed++) {
        const params = generateArukoneParams(score, seed);

        const area = params.rows * params.cols;

        expect(params.clueCount).toBeGreaterThanOrEqual(2);
        expect(params.clueCount).toBeLessThan(area);
      }
    }
  });

  it("uses correct clue distribution by difficulty range", () => {
    expect(generateArukoneParams(1, 1).clueDistribution).toBe("uniform");

    expect(generateArukoneParams(2, 1).clueDistribution).toBe("uniform");

    expect(generateArukoneParams(3, 1).clueDistribution).toBe("uniform");

    expect(generateArukoneParams(4, 1).clueDistribution).toBe("balanced");

    expect(generateArukoneParams(5, 1).clueDistribution).toBe("balanced");

    expect(generateArukoneParams(6, 1).clueDistribution).toBe("balanced");

    expect(generateArukoneParams(7, 1).clueDistribution).toBe("random");

    expect(generateArukoneParams(8, 1).clueDistribution).toBe("random");

    expect(generateArukoneParams(9, 1).clueDistribution).toBe("random");
  });

  it("enables timer only for Expert tier and above", () => {
    for (let score = 1; score <= 4; score++) {
      const params = generateArukoneParams(score, 123);

      expect(params.timer).toBeUndefined();
    }

    for (let score = 5; score <= 9; score++) {
      const params = generateArukoneParams(score, 123);

      expect(params.timer).toBeDefined();
      expect(params.timer).toBeGreaterThanOrEqual(90);
      expect(params.timer).toBeLessThanOrEqual(300);
    }
  });

  it("increases wall density as difficulty rises", () => {
    const seeds = [10, 20, 30, 40, 50];

    let beginnerWalls = 0;
    let nightmareWalls = 0;

    seeds.forEach((seed) => {
      beginnerWalls += generateArukoneParams(1, seed).wallCount;
      nightmareWalls += generateArukoneParams(9, seed).wallCount;
    });

    expect(nightmareWalls).toBeGreaterThan(beginnerWalls);
  });

  it("increases board size as difficulty rises", () => {
    const seeds = [10, 20, 30, 40, 50];

    let beginnerArea = 0;
    let nightmareArea = 0;

    seeds.forEach((seed) => {
      const easy = generateArukoneParams(1, seed);
      const hard = generateArukoneParams(9, seed);

      beginnerArea += easy.rows * easy.cols;
      nightmareArea += hard.rows * hard.cols;
    });

    expect(nightmareArea).toBeGreaterThan(beginnerArea);
  });

  it("increases hint penalty as difficulty rises", () => {
    const seeds = [10, 20, 30, 40, 50];

    let beginnerPenalty = 0;
    let nightmarePenalty = 0;

    seeds.forEach((seed) => {
      beginnerPenalty += generateArukoneParams(1, seed).hintPenalty;
      nightmarePenalty += generateArukoneParams(9, seed).hintPenalty;
    });

    expect(nightmarePenalty).toBeGreaterThan(beginnerPenalty);
  });
});
