// grid.test.ts
import { describe, it, expect } from "vitest";

import {
  bfs,
  isConnected,
  getRegionCells,
  getRegionIds,
  floodFill,
  labelComponents,
  getRegionBorders,
  manhattanDist,
  chebyshevDist,
  areAdjacent8,
  areAdjacent4,
  makeGrid,
  cloneGrid,
  neighbors4,
} from "./grid";

describe("bfs", () => {
  const grid = [
    [0, 0, 0],
    [0, 1, 0],
    [0, 0, 0],
  ];

  it("visits reachable cells", () => {
    const visited = bfs({
      grid,
      start: [0, 0],
      canVisit: (r, c) => grid[r][c] === 0,
    });

    expect(visited.size).toBe(8);
  });

  it("tracks distances correctly", () => {
    const visited = bfs({
      grid,
      start: [0, 0],
      canVisit: (r, c) => grid[r][c] === 0,
    });

    const cols = grid[0].length;
    const key = 2 * cols + 2;

    expect(visited.get(key)).toBe(4);
  });

  it("supports early exit with onVisit", () => {
    const visited = bfs({
      grid,
      start: [0, 0],
      canVisit: (r, c) => grid[r][c] === 0,
      onVisit: (r, c) => r === 1 && c === 0,
    });

    expect(visited.size).toBeLessThan(8);
  });
});

describe("isConnected", () => {
  const grid = [
    [1, 1, 0],
    [0, 1, 0],
    [0, 0, 0],
  ];

  it("returns true for connected cells", () => {
    expect(
      isConnected(
        [
          [0, 0],
          [0, 1],
          [1, 1],
        ],
        grid,
        1,
      ),
    ).toBe(true);
  });

  it("returns false for disconnected cells", () => {
    expect(
      isConnected(
        [
          [0, 0],
          [2, 2],
        ],
        grid,
        1,
      ),
    ).toBe(false);
  });

  it("returns true for empty cell list", () => {
    expect(isConnected([], grid, 1)).toBe(true);
  });
});

describe("getRegionCells", () => {
  it("returns all matching cells", () => {
    const grid = [
      [1, 2],
      [1, 1],
    ];

    expect(getRegionCells(grid, 1)).toEqual([
      [0, 0],
      [1, 0],
      [1, 1],
    ]);
  });

  it("returns empty array when region does not exist", () => {
    const grid = [[1]];

    expect(getRegionCells(grid, 9)).toEqual([]);
  });
});

describe("getRegionIds", () => {
  it("returns sorted unique IDs", () => {
    const grid = [
      [2, 1],
      [1, 3],
    ];

    expect(getRegionIds(grid)).toEqual([1, 2, 3]);
  });

  it("excludes negative values by default", () => {
    const grid = [
      [-1, 0],
      [1, 2],
    ];

    expect(getRegionIds(grid)).toEqual([0, 1, 2]);
  });

  it("includes negative values when requested", () => {
    const grid = [
      [-1, 0],
      [1, 2],
    ];

    expect(getRegionIds(grid, false)).toEqual([-1, 0, 1, 2]);
  });
});

describe("floodFill", () => {
  it("fills connected region", () => {
    const grid = [
      [1, 1, 0],
      [1, 0, 0],
    ];

    const filled = floodFill({
      grid,
      start: [0, 0],
      targetValue: 1,
      fillValue: 9,
    });

    expect(filled).toEqual([
      [0, 0],
      [1, 0],
      [0, 1],
    ]);

    expect(grid).toEqual([
      [9, 9, 0],
      [9, 0, 0],
    ]);
  });

  it("returns empty array if start cell does not match target", () => {
    const grid = [[1]];

    const filled = floodFill({
      grid,
      start: [0, 0],
      targetValue: 0,
      fillValue: 9,
    });

    expect(filled).toEqual([]);
  });
});

describe("labelComponents", () => {
  it("labels connected components", () => {
    const grid = [
      [-1, -1, 0],
      [0, -1, 0],
      [-1, 0, -1],
    ];

    const count = labelComponents(grid);

    expect(count).toBe(3);

    expect(grid).toEqual([
      [0, 0, 0],
      [0, 0, 0],
      [1, 0, 2],
    ]);
  });

  it("supports custom startId", () => {
    const grid = [
      [-1, 0],
      [0, -1],
    ];

    const count = labelComponents(grid, -1, 5);

    expect(count).toBe(2);
    expect(grid[0][0]).toBe(5);
    expect(grid[1][1]).toBe(6);
  });
});

describe("getRegionBorders", () => {
  const grid = [
    [1, 1],
    [1, 2],
  ];

  it("detects borders correctly", () => {
    expect(getRegionBorders(grid, 0, 0)).toEqual({
      top: true,
      bottom: false,
      left: true,
      right: false,
    });
  });

  it("detects internal region edges", () => {
    expect(getRegionBorders(grid, 1, 1)).toEqual({
      top: true,
      bottom: true,
      left: true,
      right: true,
    });
  });
});

describe("distance functions", () => {
  it("computes Manhattan distance", () => {
    expect(manhattanDist([0, 0], [2, 3])).toBe(5);
  });

  it("computes Chebyshev distance", () => {
    expect(chebyshevDist([0, 0], [2, 3])).toBe(3);
  });
});

describe("adjacency checks", () => {
  it("detects 8-directional adjacency", () => {
    expect(areAdjacent8([0, 0], [1, 1])).toBe(true);
  });

  it("rejects same cell for adjacent8", () => {
    expect(areAdjacent8([0, 0], [0, 0])).toBe(false);
  });

  it("detects 4-directional adjacency", () => {
    expect(areAdjacent4([0, 0], [0, 1])).toBe(true);
  });

  it("rejects diagonal adjacency for adjacent4", () => {
    expect(areAdjacent4([0, 0], [1, 1])).toBe(false);
  });
});

describe("makeGrid", () => {
  it("creates grid with correct dimensions and values", () => {
    expect(makeGrid(2, 3, 7)).toEqual([
      [7, 7, 7],
      [7, 7, 7],
    ]);
  });

  it("creates independent rows", () => {
    const grid = makeGrid(2, 2, 0);

    grid[0][0] = 9;

    expect(grid[1][0]).toBe(0);
  });
});

describe("cloneGrid", () => {
  it("deep clones a grid", () => {
    const original = [
      [1, 2],
      [3, 4],
    ];

    const cloned = cloneGrid(original);

    expect(cloned).toEqual(original);

    cloned[0][0] = 99;

    expect(original[0][0]).toBe(1);
  });
});

describe("neighbors4", () => {
  it("returns valid orthogonal neighbors", () => {
    expect(neighbors4(1, 1, 3, 3)).toEqual([
      [0, 1],
      [2, 1],
      [1, 0],
      [1, 2],
    ]);
  });

  it("handles corner cells", () => {
    expect(neighbors4(0, 0, 3, 3)).toEqual([
      [1, 0],
      [0, 1],
    ]);
  });

  it("handles edge cells", () => {
    expect(neighbors4(0, 1, 3, 3)).toEqual([
      [1, 1],
      [0, 0],
      [0, 2],
    ]);
  });
});
