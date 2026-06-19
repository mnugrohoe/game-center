import { describe, expect, it } from "vitest";

import { generateArukone, arukoneGenerator } from "./generator";

import { ARUKONE_TIERS, type ArukoneParams } from "./difficulty";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function makeParams(partial: Partial<ArukoneParams> = {}): ArukoneParams {
  return {
    rows: 5,
    cols: 5,

    clueCount: 6,
    wallCount: 4,

    clueDistribution: "balanced",

    timer: undefined,
    hintPenalty: 10,

    tier: ARUKONE_TIERS[0],
    seed: 123,

    ...partial,
  };
}

// ─────────────────────────────────────────────
// Generator
// ─────────────────────────────────────────────

describe("generateArukone()", () => {
  it("creates puzzle with correct dimensions", () => {
    const puzzle = generateArukone(
      makeParams({
        rows: 6,
        cols: 8,
      }),
    );

    expect(puzzle.rows).toBe(6);
    expect(puzzle.cols).toBe(8);

    expect(Object.keys(puzzle.grid)).toHaveLength(48);
  });

  it("is deterministic for identical seed", () => {
    const a = generateArukone(
      makeParams({
        seed: 999,
      }),
    );

    const b = generateArukone(
      makeParams({
        seed: 999,
      }),
    );

    expect(a).toEqual(b);
  });

  it("creates a full Hamiltonian path covering every cell", () => {
    const params = makeParams({
      rows: 7,
      cols: 6,
    });

    const puzzle = generateArukone(params);

    expect(puzzle.solutionPath.length).toBe(params.rows * params.cols);

    const unique = new Set(puzzle.solutionPath);

    expect(unique.size).toBe(params.rows * params.cols);
  });

  it("all path steps are orthogonally adjacent", () => {
    const puzzle = generateArukone(
      makeParams({
        rows: 8,
        cols: 8,
      }),
    );

    for (let i = 1; i < puzzle.solutionPath.length; i++) {
      const [x1, y1] = puzzle.solutionPath[i - 1].split("-").map(Number);

      const [x2, y2] = puzzle.solutionPath[i].split("-").map(Number);

      const dist = Math.abs(x1 - x2) + Math.abs(y1 - y2);

      expect(dist).toBe(1);
    }
  });

  it("places clue #1 and clue #N", () => {
    const clueCount = 10;

    const puzzle = generateArukone(
      makeParams({
        clueCount,
      }),
    );

    const values = Object.values(puzzle.grid);

    expect(values).toContain("1");
    expect(values).toContain(String(clueCount));
  });

  it("places exactly clueCount numbered clues", () => {
    const clueCount = 12;

    const puzzle = generateArukone(
      makeParams({
        clueCount,
      }),
    );

    const clues = Object.values(puzzle.grid).filter((v) => v.trim() !== "");

    expect(clues).toHaveLength(clueCount);
  });

  it("numbers are sequential with no gaps", () => {
    const clueCount = 15;

    const puzzle = generateArukone(
      makeParams({
        clueCount,
      }),
    );

    const found = new Set(
      Object.values(puzzle.grid).filter((v) => v.trim() !== ""),
    );

    for (let i = 1; i <= clueCount; i++) {
      expect(found.has(String(i))).toBe(true);
    }
  });

  it("never generates more walls than requested", () => {
    const puzzle = generateArukone(
      makeParams({
        wallCount: 20,
      }),
    );

    expect(puzzle.walls.length).toBeLessThanOrEqual(20);
  });

  it("all walls connect adjacent cells", () => {
    const puzzle = generateArukone(
      makeParams({
        wallCount: 30,
      }),
    );

    puzzle.walls.forEach((wall) => {
      const dist = Math.abs(wall.r1 - wall.r2) + Math.abs(wall.c1 - wall.c2);

      expect(dist).toBe(1);
    });
  });
});

// ─────────────────────────────────────────────
// Tier Profiles
// ─────────────────────────────────────────────

describe("arukoneGenerator.byTier()", () => {
  it("generates valid puzzle for every tier", () => {
    ARUKONE_TIERS.forEach((tier, idx) => {
      const puzzle = arukoneGenerator.byTier(idx, 42);

      expect(puzzle.rows).toBeGreaterThanOrEqual(tier.minSize);

      expect(puzzle.rows).toBeLessThanOrEqual(tier.maxSize);

      expect(puzzle.cols).toBeGreaterThanOrEqual(tier.minSize);

      expect(puzzle.cols).toBeLessThanOrEqual(tier.maxSize);
    });
  });

  it("wall count increases with difficulty", () => {
    const easy = arukoneGenerator.byTier(0, 777);

    const hard = arukoneGenerator.byTier(ARUKONE_TIERS.length - 1, 777);

    expect(hard.params.wallCount).toBeGreaterThanOrEqual(easy.params.wallCount);
  });

  it("board area increases with difficulty", () => {
    const easy = arukoneGenerator.byTier(0, 777);

    const hard = arukoneGenerator.byTier(ARUKONE_TIERS.length - 1, 777);

    const easyArea = easy.rows * easy.cols;

    const hardArea = hard.rows * hard.cols;

    expect(hardArea).toBeGreaterThan(easyArea);
  });
});

// ─────────────────────────────────────────────
// Debug Output
// ─────────────────────────────────────────────

describe("visual debug", () => {
  it("prints puzzle", () => {
    const puzzle = generateArukone(makeParams());

    // console.log(JSON.stringify(puzzle, null, 2));
    console.log("\n🧩 Arukone Grid");

    for (let r = 0; r < puzzle.rows; r++) {
      let row = "";

      for (let c = 0; c < puzzle.cols; c++) {
        const value = puzzle.grid[`${c}-${r}`];

        row += value.trim() === "" ? " . " : value.padStart(2, " ") + " ";
      }

      console.log(row);
    }

    console.log("\nWalls:", puzzle.walls.length);
  });
});
