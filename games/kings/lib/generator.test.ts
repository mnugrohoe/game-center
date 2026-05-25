// games/kings/lib/generator.test.ts

import { describe, expect, it, vi } from "vitest";

import {
  generateByLevel,
  generateByTierIdx,
  generateKingsRegions,
} from "./generator";

import { DIFF_TIERS, diffScoreToParams, levelToDiffScore } from "./difficulty";

import { mkRng } from "@/shared/algorithms/rng";
import { getRegionIds, isConnected } from "@/shared/algorithms/grid";

describe("generateKingsRegions", () => {
  it("throws for board sizes smaller than 4", () => {
    const rng = mkRng(123);

    expect(() => generateKingsRegions(3, rng)).toThrowError(
      "Kings board size must be at least 4",
    );
  });

  it("returns a valid result for a normal board", () => {
    const rng = mkRng(12345);

    const result = generateKingsRegions(6, rng);

    expect(result).not.toBeNull();

    expect(result!.grid).toHaveLength(6);
    expect(result!.solution.length).toBeGreaterThan(0);
  });

  it("creates a fully filled grid", () => {
    const rng = mkRng(777);

    const result = generateKingsRegions(7, rng);

    expect(result).not.toBeNull();

    for (const row of result!.grid) {
      for (const cell of row) {
        expect(cell).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("creates exactly N regions", () => {
    const N = 8;
    const rng = mkRng(888);

    const result = generateKingsRegions(N, rng);

    expect(result).not.toBeNull();

    const regionIds = getRegionIds(result!.grid);

    expect(regionIds.length).toBe(N);
  });

  it("ensures every region is connected", () => {
    const N = 7;
    const rng = mkRng(999);

    const result = generateKingsRegions(N, rng);

    expect(result).not.toBeNull();

    const grid = result!.grid;
    const regionIds = getRegionIds(grid);

    for (const reg of regionIds) {
      const cells: [number, number][] = [];

      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          if (grid[r][c] === reg) {
            cells.push([r, c]);
          }
        }
      }

      expect(cells.length).toBeGreaterThanOrEqual(2);
      expect(isConnected(cells, grid, reg)).toBe(true);
    }
  });

  it("returns a valid solution", () => {
    const N = 6;
    const rng = mkRng(111);

    const result = generateKingsRegions(N, rng);

    expect(result).not.toBeNull();

    const { solution } = result!;

    expect(solution.length).toBeGreaterThan(0);

    for (const [r, c] of solution) {
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThan(N);

      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThan(N);
    }
  });

  it("is deterministic with the same RNG seed", () => {
    const rngA = mkRng(5555);
    const rngB = mkRng(5555);

    const a = generateKingsRegions(6, rngA);
    const b = generateKingsRegions(6, rngB);

    expect(a).toEqual(b);
  });

  it("can generate different layouts with different seeds", () => {
    const rngA = mkRng(1111);
    const rngB = mkRng(2222);

    const a = generateKingsRegions(6, rngA);
    const b = generateKingsRegions(6, rngB);

    expect(a).not.toEqual(b);
  });

  it("works across multiple compactness values", () => {
    const values = [0.1, 0.5, 0.9];

    for (const compactness of values) {
      const rng = mkRng(333);

      const result = generateKingsRegions(6, rng, compactness, 0.5);

      expect(result).not.toBeNull();
    }
  });

  it("works across multiple sizeVariance values", () => {
    const values = [0.0, 0.5, 1.0];

    for (const sizeVariance of values) {
      const rng = mkRng(444);

      const result = generateKingsRegions(6, rng, 0.5, sizeVariance);

      expect(result).not.toBeNull();
    }
  });
});

describe("generateByLevel", () => {
  it("returns a valid generated puzzle", () => {
    for (let level = 1; level <= 20; level++) {
      const result = generateByLevel(level);

      expect(result).not.toBeNull();

      expect(result!.grid.length).toBeGreaterThanOrEqual(4);
      expect(result!.solution.length).toBeGreaterThan(0);
    }
  });

  it("is deterministic for the same level", () => {
    const a = generateByLevel(12);
    const b = generateByLevel(12);

    expect(a).toEqual(b);
  });

  it("uses params derived from level difficulty", () => {
    const level = 15;

    const diffScore = levelToDiffScore(level);

    const rng = mkRng(level);
    const params = diffScoreToParams(diffScore, rng);

    const result = generateByLevel(level);

    expect(result).not.toBeNull();

    expect(result!.grid.length).toBe(params.N);
  });
});

describe("generateByTierIdx", () => {
  it("returns valid generated puzzles for every tier", () => {
    vi.spyOn(Date, "now").mockReturnValue(123456);

    for (let tierIdx = 0; tierIdx < DIFF_TIERS.length; tierIdx++) {
      const result = generateByTierIdx(tierIdx);

      expect(result).not.toBeNull();

      expect(result!.grid.length).toBeGreaterThanOrEqual(4);
      expect(result!.solution.length).toBeGreaterThan(0);
    }
  });

  it("is deterministic when Date.now is mocked", () => {
    vi.spyOn(Date, "now").mockReturnValue(99999);

    const a = generateByTierIdx(3);
    const b = generateByTierIdx(3);

    expect(a).toEqual(b);
  });

  it("generates different tiers with potentially different sizes", () => {
    vi.spyOn(Date, "now").mockReturnValue(55555);

    const easy = generateByTierIdx(0);
    const hard = generateByTierIdx(3);

    expect(easy).not.toBeNull();
    expect(hard).not.toBeNull();

    expect(hard!.grid.length).toBeGreaterThanOrEqual(easy!.grid.length);
  });
});
