/**
 * @module backtracking
 * Generic constraint-satisfaction backtracker.
 *
 * Decoupled from any game — the caller supplies:
 *   - candidates(step): what choices are available at step N
 *   - isValid(choice):  whether a choice is legal given current state
 *   - apply(choice):    mutate state to include this choice
 *   - undo(choice):     reverse the mutation
 *   - isSolved(step):   whether we've found a complete solution
 *
 * Usage (Kings solver):
 *   import { backtrack } from "@/shared/algorithms/backtracking";
 *
 * Usage (Sudoku):
 *   Same interface — different candidates/isValid/apply/undo.
 */

import type { BacktrackResult } from "../types";

export interface BacktrackOptions<TChoice, TSolution> {
  /** Total steps to fill (e.g., number of regions in Kings, cells in Sudoku). */
  totalSteps: number;
  /** Returns candidate choices for the current step index. */
  candidates: (step: number) => TChoice[];
  /** Returns true if placing this choice at this step is valid. */
  isValid: (choice: TChoice, step: number) => boolean;
  /** Apply the choice (mutate state). */
  apply: (choice: TChoice, step: number) => void;
  /** Undo the choice (reverse mutation). */
  undo: (choice: TChoice, step: number) => void;
  /** Extract the final solution when all steps are filled. */
  buildSolution: () => TSolution;
  /** Optional: abort early if statesExplored exceeds this limit. */
  maxStates?: number;
}

/**
 * Generic depth-first backtracking solver.
 *
 * @returns BacktrackResult with the solution (or null) and exploration stats.
 */
export function backtrack<TChoice, TSolution>(
  opts: BacktrackOptions<TChoice, TSolution>
): BacktrackResult<TSolution> {
  let statesExplored = 0;
  let aborted = false;

  function bt(step: number): boolean {
    if (opts.maxStates && statesExplored >= opts.maxStates) {
      aborted = true;
      return false;
    }
    statesExplored++;

    if (step === opts.totalSteps) return true;

    for (const choice of opts.candidates(step)) {
      if (opts.isValid(choice, step)) {
        opts.apply(choice, step);
        if (bt(step + 1)) return true;
        opts.undo(choice, step);
      }
      if (aborted) return false;
    }
    return false;
  }

  const found = bt(0);
  return {
    found,
    solution: found ? opts.buildSolution() : null,
    statesExplored,
  };
}

/**
 * Counts the number of solutions (up to a limit).
 * Useful to verify a puzzle has a unique solution.
 *
 * @param limit - Stop counting after this many solutions found.
 */
export function countSolutions<TChoice, TSolution>(
  opts: BacktrackOptions<TChoice, TSolution>,
  limit = 2
): number {
  let count = 0;

  function bt(step: number): void {
    if (count >= limit) return;
    if (step === opts.totalSteps) { count++; return; }
    for (const choice of opts.candidates(step)) {
      if (opts.isValid(choice, step)) {
        opts.apply(choice, step);
        bt(step + 1);
        opts.undo(choice, step);
      }
      if (count >= limit) return;
    }
  }

  bt(0);
  return count;
}
