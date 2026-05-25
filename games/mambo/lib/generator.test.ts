// games/mambo/lib/generator.test.ts
import { describe, expect, it } from "vitest";

import { DIFF_TIERS, levelToTierIdx } from "./difficulty";
import {
  generateMamboPuzzle,
  generateSolution,
  generateByLevel,
} from "./generator";
import { isValidPlacement } from "./solver";

describe("generateSolution", () => {
  it("creates a square grid of the requested size", () => {
    const size = 6;
    const grid = generateSolution(size);

    expect(grid).toHaveLength(size);

    for (const row of grid) {
      expect(row).toHaveLength(size);
    }
  });

  it("fills the grid with only valid CellValue values", () => {
    const grid = generateSolution(6);

    for (const row of grid) {
      for (const cell of row) {
        expect([1, 2]).toContain(cell);
      }
    }
  });

  it("creates a fully valid solved board", () => {
    const size = 6;
    const grid = generateSolution(size);

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const val = grid[r][c];

        // temporarily remove cell
        grid[r][c] = 0;

        const valid = isValidPlacement(grid, r, c, val, size);

        // restore
        grid[r][c] = val;

        expect(valid).toBe(true);
      }
    }
  });

  it("generates different boards sometimes", () => {
    const a = generateSolution(6);
    const b = generateSolution(6);

    expect(JSON.stringify(a)).not.toEqual(JSON.stringify(b));
  });
});

describe("generateMamboPuzzle", () => {
  it("creates a puzzle for every difficulty tier", () => {
    DIFF_TIERS.forEach((tier, diffId) => {
      const puzzle = generateMamboPuzzle(diffId);

      expect(puzzle.diffId).toBe(diffId);
      expect(puzzle.size).toBe(tier.gridSize);

      expect(puzzle.puzzle).toHaveLength(tier.gridSize);
      expect(puzzle.solution).toHaveLength(tier.gridSize);
    });
  });

  it("solution contains only valid values", () => {
    const puzzle = generateMamboPuzzle(0);

    for (const row of puzzle.solution) {
      for (const cell of row) {
        expect([1, 2]).toContain(cell);
      }
    }
  });

  it("puzzle contains only 0, 1, or 2", () => {
    const puzzle = generateMamboPuzzle(0);

    for (const row of puzzle.puzzle) {
      for (const cell of row) {
        expect([0, 1, 2]).toContain(cell);
      }
    }
  });

  it("prefilled cells match the solution", () => {
    const puzzle = generateMamboPuzzle(2);

    for (let r = 0; r < puzzle.size; r++) {
      for (let c = 0; c < puzzle.size; c++) {
        const cell = puzzle.puzzle[r][c];

        if (cell !== 0) {
          expect(cell).toBe(puzzle.solution[r][c]);
        }
      }
    }
  });

  it("constraints correctly reflect the solution", () => {
    const puzzle = generateMamboPuzzle(3);

    for (const cn of puzzle.constraints) {
      const a = puzzle.solution[cn.r1][cn.c1];
      const b = puzzle.solution[cn.r2][cn.c2];

      if (cn.type === "=") {
        expect(a).toBe(b);
      }

      if (cn.type === "x") {
        expect(a).not.toBe(b);
      }
    }
  });

  it("constraint count respects the 20% cap", () => {
    const puzzle = generateMamboPuzzle(4);

    const totalEdges = puzzle.size * (puzzle.size - 1) * 2;

    const maxAllowed = Math.floor(totalEdges * 0.2);

    expect(puzzle.constraints.length).toBeLessThanOrEqual(maxAllowed);
  });

  it("generates some empty cells", () => {
    const puzzle = generateMamboPuzzle(0);

    const emptyCount = puzzle.puzzle.flat().filter((v) => v === 0).length;

    expect(emptyCount).toBeGreaterThan(0);
  });

  it("prints debug output", () => {
    const puzzle = generateMamboPuzzle(1);

    expect(puzzle).toBeDefined();
  });
});
describe("generateByLevel", () => {
  it("generates a puzzle using the mapped difficulty tier", () => {
    for (let level = 1; level <= 50; level++) {
      const expectedDiffId = levelToTierIdx(level);

      const puzzle = generateByLevel(level);

      expect(puzzle.diffId).toBe(expectedDiffId);
    }
  });

  it("uses the correct tier configuration", () => {
    for (let level = 1; level <= 20; level++) {
      const diffId = levelToTierIdx(level);
      const tier = DIFF_TIERS[diffId];

      const puzzle = generateByLevel(level);

      expect(puzzle.size).toBe(tier.gridSize);
    }
  });

  it("creates a valid puzzle structure", () => {
    const puzzle = generateByLevel(10);

    expect(puzzle.puzzle).toHaveLength(puzzle.size);
    expect(puzzle.solution).toHaveLength(puzzle.size);

    for (const row of puzzle.puzzle) {
      expect(row).toHaveLength(puzzle.size);

      for (const cell of row) {
        expect([0, 1, 2]).toContain(cell);
      }
    }

    for (const row of puzzle.solution) {
      expect(row).toHaveLength(puzzle.size);

      for (const cell of row) {
        expect([1, 2]).toContain(cell);
      }
    }
  });

  it("prefilled cells always match the solution", () => {
    const puzzle = generateByLevel(25);

    for (let r = 0; r < puzzle.size; r++) {
      for (let c = 0; c < puzzle.size; c++) {
        const cell = puzzle.puzzle[r][c];

        if (cell !== 0) {
          expect(cell).toBe(puzzle.solution[r][c]);
        }
      }
    }
  });

  it("constraints always match the solution", () => {
    const puzzle = generateByLevel(30);

    for (const cn of puzzle.constraints) {
      const a = puzzle.solution[cn.r1][cn.c1];
      const b = puzzle.solution[cn.r2][cn.c2];

      if (cn.type === "=") {
        expect(a).toBe(b);
      }

      if (cn.type === "x") {
        expect(a).not.toBe(b);
      }
    }
  });
});
