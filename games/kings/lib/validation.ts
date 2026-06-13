import { areAdjacent8 } from "@/shared/algorithms";
import { DIRS, EMPTY_CELL_STATE, KING_CELL_STATE } from "./constants";
import { KingsPuzzle } from "./generator";
import { KingBoardCellState } from "../types";
import { Coord } from "@/shared/types";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface ValidationStatus {
  type: "ok" | "err";
  msg: string;
}

export interface ValidationResult {
  valid: boolean;
  status: ValidationStatus;
}

/**
 * Iterate all cells in grid.
 */
function forEachCell(size: number, fn: (r: number, c: number) => void): void {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      fn(r, c);
    }
  }
}

/**
 * Generic BFS for region traversal (DRY engine).
 */
function bfsRegion(
  grid: number[][],
  size: number,
  start: [number, number],
  regionId: number,
): number {
  const visited = Array.from({ length: size }, () => Array(size).fill(false));

  const queue: [number, number][] = [start];
  visited[start[0]][start[1]] = true;

  let count = 0;

  while (queue.length) {
    const [r, c] = queue.shift()!;
    count++;

    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;

      if (
        nr < 0 ||
        nc < 0 ||
        nr >= size ||
        nc >= size ||
        visited[nr][nc] ||
        grid[nr][nc] !== regionId
      )
        continue;

      visited[nr][nc] = true;
      queue.push([nr, nc]);
    }
  }

  return count;
}

/**
 * Collect region metadata in one pass (DRY optimization).
 */
function collectRegions(grid: number[][], size: number) {
  const regions = new Set<number>();
  let unassigned = 0;

  forEachCell(size, (r, c) => {
    const v = grid[r][c];

    if (v === -1) {
      unassigned++;
      return;
    }

    regions.add(v);
  });

  return { regions, unassigned };
}

// ─────────────────────────────────────────────────────────────
// Region validation (clean + guarded)
// ─────────────────────────────────────────────────────────────

function isRegionConnected(
  grid: number[][],
  size: number,
  regionId: number,
): boolean {
  let start: [number, number] | null = null;
  let total = 0;

  forEachCell(size, (r, c) => {
    if (grid[r][c] !== regionId) return;

    total++;
    if (!start) start = [r, c];
  });

  if (total <= 1) return true;
  if (!start) return false;

  return bfsRegion(grid, size, start, regionId) === total;
}

export function validateRegions(
  grid: number[][],
  size: number,
): ValidationResult {
  const { regions, unassigned } = collectRegions(grid, size);

  if (unassigned) {
    return {
      valid: false,
      status: {
        type: "err",
        msg: `${unassigned} unassigned cell(s) — fill all cells first`,
      },
    };
  }

  if (regions.size !== size) {
    return {
      valid: false,
      status: {
        type: "err",
        msg: `Expected ${size} regions, found ${regions.size}`,
      },
    };
  }

  for (const id of regions) {
    if (!isRegionConnected(grid, size, id)) {
      return {
        valid: false,
        status: {
          type: "err",
          msg: `Region ${id} is not connected`,
        },
      };
    }
  }

  return {
    valid: true,
    status: {
      type: "ok",
      msg: `✓ ${regions.size} regions valid on ${size}×${size}`,
    },
  };
}

// ─────────────────────────────────────────────────────────────
// Kings conflict
// ─────────────────────────────────────────────────────────────

export function kingHasConflict(
  moves: KingBoardCellState[][],
  grid: KingsPuzzle["grid"],
  r: number,
  c: number,
  size: number,
): boolean {
  const region = grid[r][c];

  forEachCell(size, (i, j) => {
    if (i === r && j === c) return;
    if (moves[i]?.[j] !== KING_CELL_STATE) return;

    if (
      i === r ||
      j === c ||
      grid[i]?.[j] === region ||
      areAdjacent8([i, j], [r, c])
    ) {
      throw true;
    }
  });

  return false;
}

// ─────────────────────────────────────────────────────────────
// Kings completion (simplified + no duplication)
// ─────────────────────────────────────────────────────────────

export function checkKingsComplete(
  moves: KingBoardCellState[][],
  puzzle: KingsPuzzle,
): boolean {
  const size = puzzle.params.N;

  const kings: [number, number][] = [];
  const usedRows = new Set<number>();
  const usedCols = new Set<number>();
  const usedRegions = new Set<number>();

  forEachCell(size, (r, c) => {
    if (moves[r]?.[c] === KING_CELL_STATE) {
      kings.push([r, c]);
    }
  });

  if (kings.length !== size) return false;

  for (const [r, c] of kings) {
    if (usedRows.has(r) || usedCols.has(c)) return false;

    const region = puzzle.grid[r]?.[c];
    if (region === undefined || usedRegions.has(region)) return false;

    usedRows.add(r);
    usedCols.add(c);
    usedRegions.add(region);
  }

  for (let i = 0; i < kings.length; i++) {
    for (let j = i + 1; j < kings.length; j++) {
      if (areAdjacent8(kings[i], kings[j])) return false;
    }
  }

  return usedRegions.size === size;
}

/**
 * Converts a list of coordinates into a 2D matrix representation.
 * @param {KingsPuzzle["size"]} size - The dimensions of the square matrix (size x size).
 * @param {Coord[]} coords - Array of [row, col] or [y, x] coordinates.
 * @returns {KingBoardCellState[][]} The generated 2D matrix.
 */
export function coordsToGrid(
  size: KingsPuzzle["size"],
  coords: Coord[],
  value: number = KING_CELL_STATE,
  emptyValue: number = EMPTY_CELL_STATE,
): KingBoardCellState[][] {
  const matrix = Array.from({ length: size }, () =>
    Array(size).fill(emptyValue),
  );

  for (const [row, col] of coords) {
    if (row >= 0 && row < size && col >= 0 && col < size) {
      matrix[row][col] = value;
    }
  }

  return matrix;
}
