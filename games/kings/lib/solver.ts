/**
 * Kings puzzle solver.
 * Uses the generic backtracker from shared/algorithms.
 *
 * Constraint: place exactly 1 king per region such that:
 * - No two kings share a row
 * - No two kings share a column
 * - No two kings are 8-directionally adjacent (Chebyshev distance ≤ 1)
 * - Each king is in a distinct region
 */

import { backtrack, countSolutions } from "@/shared/algorithms/backtracking";
import { areAdjacent8 } from "@/shared/algorithms/grid";

import type { Coord } from "@/shared/types";
import type { KingsPuzzle } from "./generator";
import type { BacktrackOptions } from "@/shared/algorithms/backtracking";
import { EMPTY_CELL_STATE, KING_CELL_STATE } from "./constants";

// ─── Shared Configurations Helper (DRY Engine) ────────────────────────────────

/**
 * Membuat opsi konfigurasi backtrack terpadu untuk Kings Puzzle.
 * Memastikan tidak ada duplikasi logika antara Single Solver dan Uniqueness Checker.
 */
function createKingsBacktrackOptions(
  grid: KingsPuzzle["grid"],
  N: KingsPuzzle["params"]["N"],
): {
  options: BacktrackOptions<Coord, Coord[]>;
  kings: Coord[];
} {
  const numRegs = new Set(grid.flat()).size;

  // Pre-group cells by region for O(1) candidate lookup
  const regionCells: Coord[][] = Array.from({ length: numRegs }, () => []);
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      regionCells[grid[r][c]].push([r, c]);
    }
  }

  const kings: Coord[] = [];
  const usedRow = new Set<number>();
  const usedCol = new Set<number>();
  const usedReg = new Set<number>();

  const options: BacktrackOptions<Coord, Coord[]> = {
    totalSteps: numRegs,
    candidates: (step) => regionCells[step],
    isValid: ([r, c]) => {
      // Row / col / region exclusivity
      if (usedRow.has(r) || usedCol.has(c) || usedReg.has(grid[r][c])) {
        return false;
      }
      // No 8-directional adjacency with existing kings
      for (const king of kings) {
        if (areAdjacent8([r, c], king)) return false;
      }
      return true;
    },
    apply: ([r, c], step) => {
      kings.push([r, c]);
      usedRow.add(r);
      usedCol.add(c);
      usedReg.add(step); // step === region index
    },
    undo: ([r, c], step) => {
      kings.pop();
      usedRow.delete(r);
      usedCol.delete(c);
      usedReg.delete(step);
    },
    buildSolution: () => [...kings],
  };

  return { options, kings };
}

// ─── Public APIs ──────────────────────────────────────────────────────────────

/**
 * Finds one valid king placement for the given region grid.
 *
 * @param grid - N×N grid where each cell value is its region ID (0-based).
 * @param N    - Grid size (= number of regions).
 * @returns Array of [row, col] king positions (one per region), or null if unsolvable.
 */
export function solveKings(
  grid: KingsPuzzle["grid"],
  N: KingsPuzzle["params"]["N"],
): Coord[] | null {
  const { options } = createKingsBacktrackOptions(grid, N);
  const result = backtrack<Coord, Coord[]>(options);
  return result.solution;
}

export function isSolve(grid: KingsPuzzle["grid"], N: number): boolean {
  return solveKings(grid, N) !== null;
}

/**
 * Checks whether the puzzle has exactly one solution (uniqueness validation).
 * Returns true only if there is exactly 1 valid placement.
 */
export function hasUniqueSolution(
  grid: KingsPuzzle["grid"],
  N: KingsPuzzle["params"]["N"],
): boolean {
  const { options } = createKingsBacktrackOptions(grid, N);
  const count = countSolutions<Coord, Coord[]>(options, 2); // stop after finding 2
  return count === 1;
}
