import { describe, expect, it } from "vitest";

import { kingsGenerator } from "./generator";
import { KINGS_TIERS, kingsParamsGenerator } from "./difficulty";
import { getRegionIds, isConnected } from "@/shared/algorithms/grid";
import type { KingsParams } from "./difficulty";

import { generateKingsBoard } from "./generator";

const makeParams = (overrides: Partial<KingsParams> = {}): KingsParams => ({
  N: 6,
  seed: 123,
  compactness: 0.5,
  sizeVariance: 0.5,
  tier: KINGS_TIERS[0],
  ...overrides,
});

describe("generateKingsBoard", () => {
  it("throws for invalid board size", () => {
    expect(() => generateKingsBoard(makeParams({ N: 3 }))).toThrow(
      "Kings board size must be at least 4",
    );
  });

  it("generates valid board", () => {
    const result = generateKingsBoard(makeParams({ N: 6, seed: 12345 }));

    expect(result).not.toBeNull();
    expect(result!.grid).toHaveLength(6);
    expect(result!.solution.length).toBeGreaterThan(0);
  });

  it("produces fully filled grid", () => {
    const result = generateKingsBoard(makeParams({ N: 7, seed: 777 }));

    for (const row of result!.grid) {
      for (const cell of row) {
        expect(cell).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("creates exactly N regions", () => {
    const N = 8;

    const result = generateKingsBoard(makeParams({ N, seed: 888 }));

    const regionIds = getRegionIds(result!.grid);

    expect(regionIds).toHaveLength(N);
  });

  it("ensures all regions are connected", () => {
    const N = 7;

    const result = generateKingsBoard(makeParams({ N, seed: 999 }));

    for (const reg of getRegionIds(result!.grid)) {
      const cells: [number, number][] = [];

      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          if (result!.grid[r][c] === reg) {
            cells.push([r, c]);
          }
        }
      }

      expect(cells.length).toBeGreaterThanOrEqual(2);
      expect(isConnected(cells, result!.grid, reg)).toBe(true);
    }
  });

  it("returns valid solution coordinates", () => {
    const N = 6;

    const result = generateKingsBoard(makeParams({ N, seed: 111 }));

    expect(result!.solution).toHaveLength(N);

    const rows = new Set(result!.solution.map(([r]) => r));
    expect(rows.size).toBe(N);

    for (const [r, c] of result!.solution) {
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThan(N);

      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThan(N);
    }
  });

  it("is deterministic", () => {
    const params = makeParams({ seed: 5555 });

    expect(generateKingsBoard(params)).toEqual(generateKingsBoard(params));
  });

  it("varies with different seeds", () => {
    const a = generateKingsBoard(makeParams({ seed: 1111 }));
    const b = generateKingsBoard(makeParams({ seed: 2222 }));

    expect(a).not.toEqual(b);
  });

  it.each([0.1, 0.5, 0.9])("supports compactness=%f", (compactness) => {
    expect(
      generateKingsBoard(makeParams({ compactness, seed: 333 })),
    ).not.toBeNull();
  });

  it.each([0, 0.5, 1])("supports sizeVariance=%f", (sizeVariance) => {
    expect(
      generateKingsBoard(makeParams({ sizeVariance, seed: 444 })),
    ).not.toBeNull();
  });
});

describe("kingsGenerator.byLevel", () => {
  it("generates valid puzzles for levels", () => {
    for (let level = 1; level <= 20; level++) {
      const result = kingsGenerator.byLevel(level);

      expect(result).not.toBeNull();
      expect(result!.grid.length).toBeGreaterThanOrEqual(4);
      expect(result!.solution.length).toBeGreaterThan(0);
    }
  });

  it("is deterministic per level", () => {
    expect(kingsGenerator.byLevel(12)).toEqual(kingsGenerator.byLevel(12));
  });

  it("respects level-based params", () => {
    const level = 15;

    const params = kingsParamsGenerator.byLevel(level);
    const result = kingsGenerator.byLevel(level);

    expect(result!.grid.length).toBe(params.N);
  });
});

describe("kingsGenerator.byTier", () => {
  it("generates valid puzzles for all tiers", () => {
    for (let tier = 0; tier < KINGS_TIERS.length; tier++) {
      const result = kingsGenerator.byTier(tier, 12345);

      expect(result).not.toBeNull();
      expect(result!.solution.length).toBeGreaterThan(0);
    }
  });

  it("is deterministic with same seed", () => {
    const tier = KINGS_TIERS.length - 1;

    expect(kingsGenerator.byTier(tier, 99999)).toEqual(
      kingsGenerator.byTier(tier, 99999),
    );
  });

  it("higher tier can produce different layout scale", () => {
    const easy = kingsGenerator.byTier(0, 55555);
    const hard = kingsGenerator.byTier(KINGS_TIERS.length - 1, 55555);

    expect(hard!.grid.length).toBeGreaterThanOrEqual(easy!.grid.length);
  });
});
