// games/mambo/lib/solver.test.ts
import { describe, expect, it } from "vitest";

import type { CellValue, Constraint, MamboPuzzle } from "../types";

import { checkWin, isValidPlacement, solveMambo } from "./solver";

describe("isValidPlacement", () => {
  it("allows a valid placement", () => {
    const grid: CellValue[][] = [
      [1, 2, 0, 0],
      [2, 1, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];

    const result = isValidPlacement(grid, 0, 2, 1, 4);

    expect(result).toBe(true);
  });

  it("rejects row quota overflow", () => {
    const grid: CellValue[][] = [
      [1, 1, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];

    const result = isValidPlacement(grid, 0, 2, 1, 4);

    expect(result).toBe(false);
  });

  it("rejects column quota overflow", () => {
    const grid: CellValue[][] = [
      [1, 0, 0, 0],
      [1, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];

    const result = isValidPlacement(grid, 2, 0, 1, 4);

    expect(result).toBe(false);
  });

  it("rejects 3 consecutive identical values in a row", () => {
    const grid: CellValue[][] = [
      [1, 1, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];

    const result = isValidPlacement(grid, 0, 2, 1, 4);

    expect(result).toBe(false);
  });

  it("rejects 3 consecutive identical values in a column", () => {
    const grid: CellValue[][] = [
      [2, 0, 0, 0],
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];

    const result = isValidPlacement(grid, 2, 0, 2, 4);

    expect(result).toBe(false);
  });

  it("does not mutate the original grid", () => {
    const grid: CellValue[][] = [
      [1, 2, 0, 0],
      [2, 1, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];

    const before = JSON.stringify(grid);

    isValidPlacement(grid, 0, 2, 1, 4);

    expect(JSON.stringify(grid)).toBe(before);
  });
});

describe("solveMambo", () => {
  it("solves a simple puzzle", () => {
    const grid: CellValue[][] = [
      [1, 2, 0, 0],
      [2, 1, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];

    const constraints: Constraint[] = [];

    const solved = solveMambo(grid, constraints, 4);

    expect(solved).not.toBeNull();

    for (const row of solved!) {
      for (const cell of row) {
        expect([1, 2]).toContain(cell);
      }
    }
  });

  it("does not mutate the original puzzle grid", () => {
    const grid: CellValue[][] = [
      [1, 2, 0, 0],
      [2, 1, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];

    const before = JSON.stringify(grid);

    solveMambo(grid, [], 4);

    expect(JSON.stringify(grid)).toBe(before);
  });

  it("respects '=' constraints", () => {
    const grid: CellValue[][] = [
      [1, 0, 0, 0],
      [0, 2, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 2],
    ];

    const constraints: Constraint[] = [
      {
        r1: 0,
        c1: 0,
        r2: 0,
        c2: 1,
        type: "=",
      },
    ];

    const solved = solveMambo(grid, constraints, 4);

    expect(solved).not.toBeNull();
    expect(solved![0][0]).toBe(solved![0][1]);
  });

  it("respects 'x' constraints", () => {
    const grid: CellValue[][] = [
      [1, 0],
      [0, 0],
    ];

    const constraints: Constraint[] = [
      {
        r1: 0,
        c1: 0,
        r2: 0,
        c2: 1,
        type: "x",
      },
    ];

    const solved = solveMambo(grid, constraints, 2);

    expect(solved).not.toBeNull();
    expect(solved![0][0]).not.toBe(solved![0][1]);
  });

  it("returns null for impossible constraints", () => {
    const grid: CellValue[][] = [
      [1, 0],
      [0, 0],
    ];

    const constraints: Constraint[] = [
      {
        r1: 0,
        c1: 0,
        r2: 0,
        c2: 1,
        type: "=",
      },
      {
        r1: 0,
        c1: 0,
        r2: 0,
        c2: 1,
        type: "x",
      },
    ];

    const solved = solveMambo(grid, constraints, 2);

    expect(solved).toBeNull();
  });
});

describe("checkWin", () => {
  const winningGrid: CellValue[][] = [
    [1, 1, 2, 2],
    [2, 2, 1, 1],
    [1, 2, 1, 2],
    [2, 1, 2, 1],
  ];

  const puzzle: MamboPuzzle = {
    size: 4,
    diffId: 0,
    puzzle: [
      [1, 0, 0, 2],
      [0, 2, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    solution: winningGrid,
    constraints: [
      {
        r1: 0,
        c1: 0,
        r2: 0,
        c2: 1,
        type: "=",
      },
    ],
  };

  it("returns true for a valid solved board", () => {
    const result = checkWin(winningGrid, puzzle);

    expect(result).toBe(true);
  });

  it("fails if cells are empty", () => {
    const grid = winningGrid.map((r) => [...r]);
    grid[0][0] = 0;

    const result = checkWin(grid, puzzle);

    expect(result).toBe(false);
  });

  it("fails row balance violations", () => {
    const grid = winningGrid.map((r) => [...r]);
    grid[0] = [1, 1, 1, 2];

    const result = checkWin(grid, puzzle);

    expect(result).toBe(false);
  });

  it("fails column balance violations", () => {
    const grid = winningGrid.map((r) => [...r]);
    grid[0][0] = 1;
    grid[1][0] = 1;
    grid[2][0] = 1;

    const result = checkWin(grid, puzzle);

    expect(result).toBe(false);
  });

  it("fails triple adjacency rules", () => {
    const grid = winningGrid.map((r) => [...r]);
    grid[0] = [1, 1, 1, 2];

    const result = checkWin(grid, puzzle);

    expect(result).toBe(false);
  });

  it("fails constraint violations", () => {
    const grid = winningGrid.map((r) => [...r]);
    grid[0][1] = 2;

    const result = checkWin(grid, puzzle);

    expect(result).toBe(false);
  });

  it("prints debugging output", () => {
    expect(checkWin(winningGrid, puzzle)).toBe(true);
  });
});
