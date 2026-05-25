import { CellValue, Constraint, MamboPuzzle } from "../types";
import { DIFF_TIERS, levelToTierIdx } from "./difficulty";
import { isValidPlacement } from "./solver";

type Edge = Omit<Constraint, "type">;

/**
 * Fisher-Yates shuffle of the first `count` elements only.
 * Useful when you only need a random sample prefix.
 */
function shufflePrefix<T>(arr: T[], count: number): void {
  const n = arr.length;
  const limit = Math.min(count, n);

  for (let i = 0; i < limit; i++) {
    const j = i + ((Math.random() * (n - i)) | 0);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
}

/**
 * Generates a valid Mambo solution grid.
 *
 * Optimizations:
 * - iterative backtracking instead of recursion
 * - no per-cell array shuffles
 * - precomputed candidate order
 */
export function generateSolution(size: number): CellValue[][] {
  const grid: CellValue[][] = new Array(size);
  for (let r = 0; r < size; r++) {
    grid[r] = new Array<CellValue>(size).fill(0);
  }

  const total = size * size;

  /**
   * For each cell, remember which candidate was tried first.
   * This keeps the search randomized without allocating [1, 2] repeatedly.
   */
  const firstChoice = new Uint8Array(total);
  for (let i = 0; i < total; i++) {
    firstChoice[i] = Math.random() < 0.5 ? 1 : 2;
  }

  /**
   * Search state:
   * 0 = nothing tried
   * 1 = first candidate tried
   * 2 = both candidates tried
   */
  const tried = new Uint8Array(total);

  let pos = 0;

  while (pos >= 0 && pos < total) {
    const r = (pos / size) | 0;
    const c = pos - r * size;

    // Clear the current cell before retrying it.
    grid[r][c] = 0;

    let placed = false;

    while (tried[pos] < 2 && !placed) {
      const candidate =
        tried[pos] === 0 ? firstChoice[pos] : firstChoice[pos] === 1 ? 2 : 1;

      tried[pos]++;

      if (isValidPlacement(grid, r, c, candidate as CellValue, size)) {
        grid[r][c] = candidate as CellValue;
        placed = true;
        pos++;
      }
    }

    if (placed) continue;

    // Reset this cell and backtrack.
    tried[pos] = 0;
    pos--;

    if (pos >= 0) {
      const pr = (pos / size) | 0;
      const pc = pos - pr * size;
      grid[pr][pc] = 0;
    }
  }

  return grid;
}

/**
 * Generates a full solvable Mambo puzzle for the given difficulty tier.
 *
 * Optimized:
 * - builds edge list with exact sizing
 * - samples only the needed prefix instead of fully shuffling all edges
 * - uses a boolean mask instead of a Set for prefills
 */
export function generateMamboPuzzle(diffId: number): MamboPuzzle {
  const tier = DIFF_TIERS[diffId];
  const { gridSize: size, initRatio, constraintRatio } = tier;

  const solution = generateSolution(size);

  const edgeCount = 2 * size * (size - 1);
  const allEdges: Edge[] = new Array(edgeCount);

  let ei = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (c + 1 < size) {
        allEdges[ei++] = { r1: r, c1: c, r2: r, c2: c + 1 };
      }
      if (r + 1 < size) {
        allEdges[ei++] = { r1: r, c1: c, r2: r + 1, c2: c };
      }
    }
  }

  const maxCn = Math.min(
    (edgeCount * constraintRatio) | 0,
    (edgeCount * 0.2) | 0,
  );

  shufflePrefix(allEdges, maxCn);

  const constraints: Constraint[] = new Array(maxCn);
  for (let i = 0; i < maxCn; i++) {
    const e = allEdges[i];
    constraints[i] = {
      ...e,
      type: solution[e.r1][e.c1] === solution[e.r2][e.c2] ? "=" : "x",
    };
  }

  const cellCount = size * size;
  const prefillCount = (cellCount * initRatio) | 0;
  const cells = new Uint32Array(cellCount);
  for (let i = 0; i < cellCount; i++) cells[i] = i;

  // Partial shuffle: only randomize the prefix we need.
  for (let i = 0; i < prefillCount; i++) {
    const j = i + ((Math.random() * (cellCount - i)) | 0);
    const tmp = cells[i];
    cells[i] = cells[j];
    cells[j] = tmp;
  }

  const filled = new Uint8Array(cellCount);
  for (let i = 0; i < prefillCount; i++) {
    filled[cells[i]] = 1;
  }

  const puzzle: CellValue[][] = new Array(size);
  for (let r = 0; r < size; r++) {
    const row: CellValue[] = new Array(size);
    const base = r * size;
    for (let c = 0; c < size; c++) {
      row[c] = filled[base + c] ? solution[r][c] : 0;
    }
    puzzle[r] = row;
  }

  return { puzzle, solution, constraints, size, diffId };
}

/**
 * Generates a puzzle from a level value.
 */
export function generateByLevel(level: number): MamboPuzzle {
  const diffId = levelToTierIdx(level);
  return generateMamboPuzzle(diffId);
}
