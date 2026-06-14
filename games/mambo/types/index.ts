// ─── Cell values ─────────────────────────────────────────────────────────────

import { DiffTier } from "@/shared/types";

// 0 = blank, 1 = Sun (☀), 2 = Moon (◑)
export type MamboCellValue = 0 | 1 | 2;

// ─── Constraint between two adjacent cells ────────────────────────────────────
export type MamboConstraintType = "=" | "x";

export interface MamboConstraint {
  r1: number;
  c1: number;
  r2: number;
  c2: number;
  type: MamboConstraintType;
}

export interface MamboParams {
  gridSize: number; /* Size of the board (NxN) */
  targetInitCount: number; /* Exact count of pre-filled cell clues */
  targetLinksCount: number; /* Exact count of relationship constraints (= or x) */
  tier: MamboDiffTier;
  seed: number;
}

export interface MamboDiffTier extends DiffTier {
  sub: string; /* short card subtitle                        */
  gridSize: number; /* even number matrix size                    */
  initRatio: number; /* fraction of cells pre-filled               */
  constraintRatio: number; /* fraction of inner edges with constraints  */
}

// ─── A generated puzzle ───────────────────────────────────────────────────────
export interface MamboPuzzle {
  /** Initial board — 0 where player must fill, non-zero where pre-filled. */
  puzzle: MamboCellValue[][];

  /** Full correct solution. */
  solution: MamboCellValue[][];

  /** Adjacency relationship constraints (= or x). */
  constraints: MamboConstraint[];

  /** Grid side length (even number). */
  size: number;

  /** The full dynamic difficulty parameters used to build this level instance. */
  params: MamboParams;
}
