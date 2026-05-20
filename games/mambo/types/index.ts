// ─── Cell values ─────────────────────────────────────────────────────────────
// 0 = blank, 1 = Sun (☀), 2 = Moon (◑)
export type CellValue = 0 | 1 | 2;

// ─── Constraint between two adjacent cells ────────────────────────────────────
export type ConstraintType = "=" | "x";

export interface Constraint {
  r1: number;
  c1: number;
  r2: number;
  c2: number;
  type: ConstraintType;
}

// ─── A generated puzzle ───────────────────────────────────────────────────────
export interface MamboPuzzle {
  /** Initial board — 0 where player must fill, non-zero where pre-filled. */
  puzzle: CellValue[][];
  /** Full correct solution. */
  solution: CellValue[][];
  /** Adjacency constraints. */
  constraints: Constraint[];
  /** Grid side length (even number). */
  size: number;
  /** Index into DIFFICULTIES array. */
  diffId: number;
  /** Sequential counter within a session (shown as #1, #2 …). */
  levelNum?: number;
  /** Original game level number (set when generated via "By Level" mode). */
  gameLevel?: number;
}

// ─── Generator mode ───────────────────────────────────────────────────────────
export type GeneratorMode = "level" | "diff";
