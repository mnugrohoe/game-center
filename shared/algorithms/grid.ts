/**
 * @module grid
 * Generic 2D grid algorithms — game-agnostic.
 *
 * All functions work on number[][] grids and [row, col] coordinates.
 * No game-specific logic here — Kings, Sudoku, Sokoban, Maze, etc. can all use these.
 *
 * Usage:
 *   import { bfs, isConnected, floodFill, getRegionBorders } from "@/shared/algorithms/grid";
 */

import type { Grid2D, Coord } from "../types";
import { CARDINAL_DIRS } from "../types";

// ─── BFS ──────────────────────────────────────────────────────────────────────

export interface BfsOptions {
  grid: Grid2D;
  start: Coord;
  /** Returns true if this neighbor should be visited. */
  canVisit: (r: number, c: number, fromR: number, fromC: number) => boolean;
  /** Called for each visited cell. Return true to stop early. */
  onVisit?: (r: number, c: number, dist: number) => boolean | void;
  dirs?: Coord[];
}

/**
 * Breadth-first search on a 2D grid.
 * Returns a Map of visited cells: key = r*cols+c, value = distance from start.
 */
export function bfs(opts: BfsOptions): Map<number, number> {
  const { grid, start, canVisit, onVisit, dirs = CARDINAL_DIRS } = opts;
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const visited = new Map<number, number>();
  const queue: [number, number, number][] = [[start[0], start[1], 0]];
  visited.set(start[0] * cols + start[1], 0);

  while (queue.length) {
    const [r, c, dist] = queue.shift()!;
    if (onVisit?.(r, c, dist)) break;
    for (const [dr, dc] of dirs) {
      const nr = r + dr,
        nc = c + dc;
      const key = nr * cols + nc;
      if (
        nr >= 0 &&
        nr < rows &&
        nc >= 0 &&
        nc < cols &&
        !visited.has(key) &&
        canVisit(nr, nc, r, c)
      ) {
        visited.set(key, dist + 1);
        queue.push([nr, nc, dist + 1]);
      }
    }
  }
  return visited;
}

// ─── Connectivity ──────────────────────────────────────────────────────────────

/**
 * Checks that all cells in `cells` are connected (4-directional) within the grid.
 * A region is connected if BFS from any cell reaches all others.
 */
export function isConnected(cells: Coord[], grid: Grid2D): boolean {
  if (cells.length === 0) return true;
  const cols = grid[0]?.length ?? 0;
  const cellSet = new Set(cells.map(([r, c]) => r * cols + c));
  const visited = bfs({
    grid,
    start: cells[0],
    canVisit: (nr, nc) => cellSet.has(nr * cols + nc),
  });
  return visited.size === cells.length;
}

/**
 * Returns all cells belonging to a given region id in the grid.
 */
export function getRegionCells(grid: Grid2D, regionId: number): Coord[] {
  const cells: Coord[] = [];
  for (let r = 0; r < grid.length; r++)
    for (let c = 0; c < (grid[0]?.length ?? 0); c++)
      if (grid[r][c] === regionId) cells.push([r, c]);
  return cells;
}

/**
 * Returns unique region IDs present in the grid (excludes negatives by default).
 */
export function getRegionIds(grid: Grid2D, excludeNegative = true): number[] {
  const ids = new Set<number>();
  for (const row of grid)
    for (const v of row) if (!excludeNegative || v >= 0) ids.add(v);
  return [...ids].sort((a, b) => a - b);
}

// ─── Flood Fill ───────────────────────────────────────────────────────────────

export interface FloodFillOptions {
  grid: Grid2D;
  start: Coord;
  targetValue: number;
  fillValue: number;
  dirs?: Coord[];
}

/**
 * Flood-fill (paint bucket) — mutates grid in-place.
 * Fills connected cells matching targetValue with fillValue.
 * Returns the list of filled coordinates.
 */
export function floodFill(opts: FloodFillOptions): Coord[] {
  const { grid, start, targetValue, fillValue, dirs = CARDINAL_DIRS } = opts;
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  if (grid[start[0]][start[1]] !== targetValue) return [];

  const filled: Coord[] = [];
  const queue: Coord[] = [start];
  grid[start[0]][start[1]] = fillValue;
  filled.push(start);

  while (queue.length) {
    const [r, c] = queue.shift()!;
    for (const [dr, dc] of dirs) {
      const nr = r + dr,
        nc = c + dc;
      if (
        nr >= 0 &&
        nr < rows &&
        nc >= 0 &&
        nc < cols &&
        grid[nr][nc] === targetValue
      ) {
        grid[nr][nc] = fillValue;
        filled.push([nr, nc]);
        queue.push([nr, nc]);
      }
    }
  }
  return filled;
}

/**
 * Labels all connected components with unique IDs starting from `startId`.
 * Unassigned cells (value === unassignedValue) get filled with consecutive region IDs.
 * Mutates grid in-place.
 *
 * @returns Number of components found.
 */
export function labelComponents(
  grid: Grid2D,
  unassignedValue = -1,
  startId = 0,
): number {
  let nextId = startId;
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (grid[r][c] === unassignedValue) {
        floodFill({
          grid,
          start: [r, c],
          targetValue: unassignedValue,
          fillValue: nextId++,
        });
      }
  return nextId - startId;
}

// ─── Region Borders ───────────────────────────────────────────────────────────

export interface CellBorders {
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
}

/**
 * Returns which edges of cell [r, c] form a region boundary.
 * An edge is a boundary if the neighbor belongs to a different region (or is out of bounds).
 *
 * Used by any grid game that needs to draw region outlines.
 */
export function getRegionBorders(
  grid: Grid2D,
  r: number,
  c: number,
): CellBorders {
  const reg = grid[r][c];
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  return {
    top: r === 0 || grid[r - 1][c] !== reg,
    bottom: r === rows - 1 || grid[r + 1][c] !== reg,
    left: c === 0 || grid[r][c - 1] !== reg,
    right: c === cols - 1 || grid[r][c + 1] !== reg,
  };
}

// ─── Distance + Adjacency ─────────────────────────────────────────────────────

/** Manhattan distance between two cells. */
export function manhattanDist([r1, c1]: Coord, [r2, c2]: Coord): number {
  return Math.abs(r1 - r2) + Math.abs(c1 - c2);
}

/** Chebyshev distance (king-move distance) — max of row/col delta. */
export function chebyshevDist([r1, c1]: Coord, [r2, c2]: Coord): number {
  return Math.max(Math.abs(r1 - r2), Math.abs(c1 - c2));
}

/** Returns true if two cells are within Chebyshev distance 1 (8-directional neighbors). */
export function areAdjacent8([r1, c1]: Coord, [r2, c2]: Coord): boolean {
  return (
    Math.abs(r1 - r2) <= 1 &&
    Math.abs(c1 - c2) <= 1 &&
    !(r1 === r2 && c1 === c2)
  );
}

/** Returns true if two cells are 4-directional neighbors. */
export function areAdjacent4([r1, c1]: Coord, [r2, c2]: Coord): boolean {
  return manhattanDist([r1, c1], [r2, c2]) === 1;
}

// ─── Grid Utilities ───────────────────────────────────────────────────────────

/** Creates a fresh N×M grid filled with `value`. */
export function makeGrid(rows: number, cols: number, value: number): Grid2D {
  return Array.from({ length: rows }, () => Array(cols).fill(value));
}

/** Deep-clones a Grid2D. */
export function cloneGrid(grid: Grid2D): Grid2D {
  return grid.map((row) => [...row]);
}

/** Returns in-bounds 4-directional neighbors of [r, c]. */
export function neighbors4(
  r: number,
  c: number,
  rows: number,
  cols: number,
): Coord[] {
  return (CARDINAL_DIRS as Coord[])
    .map(([dr, dc]) => [r + dr, c + dc] as Coord)
    .filter(([nr, nc]) => nr >= 0 && nr < rows && nc >= 0 && nc < cols);
}
