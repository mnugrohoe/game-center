/**
 * games/mambo/lib/generator.ts
 * Production-ready Mambo board and puzzle generator.
 * Integrated with the shared wave seed framework and type system.
 */

import { mkRng } from "@/shared/algorithms/rng";
import type { RngFn } from "@/shared/types";
import {
  MamboCellValue,
  MamboConstraint,
  MamboParams,
  MamboPuzzle,
} from "../types";
import { mamboParamsGenerator } from "./difficulty";
import { createPuzzleGenerator } from "@/shared/utils/generator";
import { isValidPlacement } from "./solver";

type Edge = Omit<MamboConstraint, "type">;

/**
 * Fisher-Yates shuffle variant of the first `count` elements using a scoped RNG.
 * Prevents full array scanning/shuffling when only a small prefix sample is needed.
 */
function shufflePrefix<T>(arr: T[], count: number, rng: RngFn): void {
  const n = arr.length;
  const limit = Math.min(count, n);

  for (let i = 0; i < limit; i++) {
    const j = i + ((rng() * (n - i)) | 0);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
}

/**
 * Generates a valid Mambo solution grid using an optimized iterative backtracking routine.
 */
export function generateSolution(size: number, rng: RngFn): MamboCellValue[][] {
  const grid: MamboCellValue[][] = new Array(size);
  for (let r = 0; r < size; r++) {
    grid[r] = new Array<MamboCellValue>(size).fill(0);
  }

  const total = size * size;

  /**
   * For each cell, pre-determine a randomized initial candidate selection.
   * Eliminates allocation overhead inside the validation loops.
   */
  const firstChoice = new Uint8Array(total);
  for (let i = 0; i < total; i++) {
    firstChoice[i] = rng() < 0.5 ? 1 : 2;
  }

  /**
   * Fast track search state:
   * 0 = unvisited
   * 1 = primary selection evaluated
   * 2 = secondary fallback selection evaluated
   */
  const tried = new Uint8Array(total);
  let pos = 0;

  while (pos >= 0 && pos < total) {
    const r = (pos / size) | 0;
    const c = pos - r * size;

    grid[r][c] = 0; // Evict current slot state prior to evaluation

    let placed = false;

    while (tried[pos] < 2 && !placed) {
      const candidate =
        tried[pos] === 0 ? firstChoice[pos] : firstChoice[pos] === 1 ? 2 : 1;

      tried[pos]++;

      if (isValidPlacement(grid, r, c, candidate as MamboCellValue, size)) {
        grid[r][c] = candidate as MamboCellValue;
        placed = true;
        pos++;
      }
    }

    if (placed) continue;

    // Clear and execute recursive step reduction (Backtrack)
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
 * Generates an entirely configured and unique Mambo puzzle board using specific tier params.
 * Bound to the standard shared engine wrapper interface.
 * * 💡 REVISED LOGIC: Constraints CANNOT be placed if BOTH adjacent cells are already filled clues.
 * It is perfectly valid if one cell is a clue and the other is empty, or if both are empty.
 */
export function generateMamboBoard(params: MamboParams): MamboPuzzle | null {
  // Guard clause: Guarantee size variant is always an even integer matrix count
  const size =
    params.gridSize % 2 === 0 ? params.gridSize : params.gridSize + 1;

  const rng = mkRng(params.seed);
  const solution = generateSolution(size, rng);

  // 1. Configure cell clue pre-fills via partial array mask
  const cellCount = size * size;
  const targetInitCount = Math.min(params.targetInitCount, cellCount);
  const cells = new Uint32Array(cellCount);
  for (let i = 0; i < cellCount; i++) cells[i] = i;

  for (let i = 0; i < targetInitCount; i++) {
    const j = i + ((rng() * (cellCount - i)) | 0);
    const tmp = cells[i];
    cells[i] = cells[j];
    cells[j] = tmp;
  }

  const filled = new Uint8Array(cellCount);
  for (let i = 0; i < targetInitCount; i++) {
    filled[cells[i]] = 1;
  }

  // 2. Assemble the playable starting puzzle structure state
  const puzzle: MamboCellValue[][] = new Array(size);
  for (let r = 0; r < size; r++) {
    const row: MamboCellValue[] = new Array(size);
    const base = r * size;
    for (let c = 0; c < size; c++) {
      row[c] = filled[base + c] ? solution[r][c] : 0;
    }
    puzzle[r] = row;
  }

  // 3. Compute inner cell edge map boundary structures based on the new rule
  const validEdges: Edge[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Cek Jembatan Horizontal (Kanan) -> Block hanya jika kedua cell bertetangga tidak kosong (!= 0)
      if (c + 1 < size) {
        const currentFilled = puzzle[r][c] !== 0;
        const nextFilled = puzzle[r][c + 1] !== 0;

        if (!(currentFilled && nextFilled)) {
          validEdges.push({ r1: r, c1: c, r2: r, c2: c + 1 });
        }
      }

      // Cek Jembatan Vertikal (Bawah) -> Block hanya jika kedua cell bertetangga tidak kosong (!= 0)
      if (r + 1 < size) {
        const currentFilled = puzzle[r][c] !== 0;
        const belowFilled = puzzle[r + 1][c] !== 0;

        if (!(currentFilled && belowFilled)) {
          validEdges.push({ r1: r, c1: c, r2: r + 1, c2: c });
        }
      }
    }
  }

  // 4. Derive localized target edge constraint counts from filtered valid edges
  const edgeCount = validEdges.length;
  const targetLinksCount = Math.min(params.targetLinksCount, edgeCount);
  shufflePrefix(validEdges, targetLinksCount, rng);

  const constraints: MamboConstraint[] = new Array(targetLinksCount);
  for (let i = 0; i < targetLinksCount; i++) {
    const e = validEdges[i];
    constraints[i] = {
      ...e,
      type: solution[e.r1][e.c1] === solution[e.r2][e.c2] ? "=" : "x",
    };
  }

  return {
    puzzle,
    solution,
    constraints,
    size,
    params,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Framework Entry Point Registration
// ─────────────────────────────────────────────────────────────────────────────
export const mamboGenerator = createPuzzleGenerator(
  generateMamboBoard,
  mamboParamsGenerator,
);
