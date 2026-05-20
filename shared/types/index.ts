// ─── Shared types used across multiple games ──────────────────────────────────

/** A 2D integer grid. Negative values typically mean "unassigned". */
export type Grid2D = number[][];

/** A [row, col] coordinate pair. */
export type Coord = [number, number];

/** Four cardinal directions as [dr, dc] deltas. */
export const CARDINAL_DIRS: Coord[] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

/** Eight surrounding directions (cardinal + diagonal). */
export const ALL_DIRS: Coord[] = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

/** A seeded pseudo-random number generator function that returns [0, 1). */
export type RngFn = () => number;

/** Generic backtracking result. */
export interface BacktrackResult<T> {
  found: boolean;
  solution: T | null;
  statesExplored: number;
}

/**
 * Non-monotonic difficulty curve for levels, combining:
 *   - A logarithmic base curve (difficulty grows slowly, never plateaus)
 *   - Multiple overlapping sine waves (non-monotonic oscillation)
 *   - Per-level deterministic noise (same level → same score, always)
 */
export interface DiffTier {
  name: string;
  icon: string;
  diffScore: number;
  minGrid: number;
  maxGrid: number;
  color: string;
  dim: string;
  bright: string;
}

export interface TabsProps {
  label: string;
  icon: string;
  id: string;
}

export type TabType = "game" | "solver" | "generator";
