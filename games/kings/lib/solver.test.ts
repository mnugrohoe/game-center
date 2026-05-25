// solver.test.ts
import { describe, it, expect } from "vitest";

import { solveKings, hasUniqueSolution, kingHasConflict } from "./solver";

import { areAdjacent8 } from "@/shared/algorithms/grid";

describe("solveKings", () => {
  it("finds a valid solution", () => {
    const grid = [
      [0, 0, 1, 1],
      [0, 0, 1, 1],
      [2, 2, 3, 3],
      [2, 2, 3, 3],
    ];

    const solution = solveKings(grid, 4);

    expect(solution).not.toBeNull();
    expect(solution).toHaveLength(4);
  });

  it("returns one king per region", () => {
    const grid = [
      [0, 0, 1, 1],
      [0, 0, 1, 1],
      [2, 2, 3, 3],
      [2, 2, 3, 3],
    ];

    const solution = solveKings(grid, 4);

    expect(solution).not.toBeNull();

    const regions = new Set(solution!.map(([r, c]) => grid[r][c]));

    expect(regions.size).toBe(4);
  });

  it("ensures no two kings share a row", () => {
    const grid = [
      [0, 0, 1, 1],
      [0, 0, 1, 1],
      [2, 2, 3, 3],
      [2, 2, 3, 3],
    ];

    const solution = solveKings(grid, 4)!;

    const rows = solution.map(([r]) => r);

    expect(new Set(rows).size).toBe(rows.length);
  });

  it("ensures no two kings share a column", () => {
    const grid = [
      [0, 0, 1, 1],
      [0, 0, 1, 1],
      [2, 2, 3, 3],
      [2, 2, 3, 3],
    ];

    const solution = solveKings(grid, 4)!;

    const cols = solution.map(([, c]) => c);

    expect(new Set(cols).size).toBe(cols.length);
  });

  it("ensures no kings are adjacent", () => {
    const grid = [
      [0, 0, 1, 1],
      [0, 0, 1, 1],
      [2, 2, 3, 3],
      [2, 2, 3, 3],
    ];

    const solution = solveKings(grid, 4)!;

    for (let i = 0; i < solution.length; i++) {
      for (let j = i + 1; j < solution.length; j++) {
        expect(areAdjacent8(solution[i], solution[j])).toBe(false);
      }
    }
  });

  it("returns null for unsolvable puzzle", () => {
    const grid = [
      [0, 0],
      [1, 1],
    ];

    const solution = solveKings(grid, 2);

    expect(solution).toBeNull();
  });

  it("returns coordinates within bounds", () => {
    const N = 4;

    const grid = [
      [0, 0, 1, 1],
      [0, 0, 1, 1],
      [2, 2, 3, 3],
      [2, 2, 3, 3],
    ];

    const solution = solveKings(grid, N)!;

    for (const [r, c] of solution) {
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThan(N);

      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThan(N);
    }
  });

  it("is deterministic for same grid", () => {
    const grid = [
      [0, 0, 1, 1],
      [0, 0, 1, 1],
      [2, 2, 3, 3],
      [2, 2, 3, 3],
    ];

    const a = solveKings(grid, 4);
    const b = solveKings(grid, 4);

    expect(a).toEqual(b);
  });
});

describe("hasUniqueSolution", () => {
  it("returns a boolean", () => {
    const grid = [
      [0, 0, 1, 1],
      [0, 0, 1, 1],
      [2, 2, 3, 3],
      [2, 2, 3, 3],
    ];

    const result = hasUniqueSolution(grid, 4);

    expect(typeof result).toBe("boolean");
  });

  it("returns false for unsolvable puzzle", () => {
    const grid = [
      [0, 0],
      [1, 1],
    ];

    expect(hasUniqueSolution(grid, 2)).toBe(false);
  });

  it("detects a uniquely solvable puzzle", () => {
    const grid = [
      [0, 0, 0, 0],
      [0, 0, 0, 1],
      [2, 2, 3, 3],
      [2, 2, 3, 3],
    ];

    expect(hasUniqueSolution(grid, 4)).toBe(true);
  });
});

describe("kingHasConflict", () => {
  it("returns false for isolated valid king", () => {
    const grid = [
      [0, 0, 1, 1],
      [0, 0, 1, 1],
      [2, 2, 3, 3],
      [2, 2, 3, 3],
    ];

    const board = [
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];

    expect(kingHasConflict(board, grid, 0, 0, 4)).toBe(false);
  });

  it("detects row conflicts", () => {
    const grid = [
      [0, 0, 1, 1],
      [0, 0, 1, 1],
      [2, 2, 3, 3],
      [2, 2, 3, 3],
    ];

    const board = [
      [2, 0, 2, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];

    expect(kingHasConflict(board, grid, 0, 0, 4)).toBe(true);

    expect(kingHasConflict(board, grid, 0, 2, 4)).toBe(true);
  });

  it("detects column conflicts", () => {
    const grid = [
      [0, 0, 1, 1],
      [0, 0, 1, 1],
      [2, 2, 3, 3],
      [2, 2, 3, 3],
    ];

    const board = [
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [2, 0, 0, 0],
      [0, 0, 0, 0],
    ];

    expect(kingHasConflict(board, grid, 0, 0, 4)).toBe(true);
  });

  it("detects region conflicts", () => {
    const grid = [
      [0, 0],
      [0, 1],
    ];

    const board = [
      [2, 2],
      [0, 0],
    ];

    expect(kingHasConflict(board, grid, 0, 0, 2)).toBe(true);
  });

  it("detects adjacency conflicts", () => {
    const grid = [
      [0, 1],
      [2, 3],
    ];

    const board = [
      [2, 0],
      [0, 2],
    ];

    expect(kingHasConflict(board, grid, 0, 0, 2)).toBe(true);

    expect(kingHasConflict(board, grid, 1, 1, 2)).toBe(true);
  });

  it("ignores the king itself", () => {
    const grid = [
      [0, 1],
      [2, 3],
    ];

    const board = [
      [2, 0],
      [0, 0],
    ];

    expect(kingHasConflict(board, grid, 0, 0, 2)).toBe(false);
  });

  it("handles empty boards", () => {
    const grid = [
      [0, 1],
      [2, 3],
    ];

    const board = [
      [0, 0],
      [0, 0],
    ];

    expect(kingHasConflict(board, grid, 0, 0, 2)).toBe(false);
  });
});
