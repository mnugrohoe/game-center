/**
 * shared/types/index.ts
 *
 * Every type that crosses module boundaries lives here.
 * Games import FROM here — never the other way around.
 */

// ── Grid primitives ──────────────────────────────────────────────────────────

/** A 2-D integer grid. Negative values = unassigned. */
export type Grid2D = number[][];

/** [row, col] coordinate pair. */
export type Coord = [number, number];

export const CARDINAL_DIRS: Coord[] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];
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

// ── RNG / algorithms ─────────────────────────────────────────────────────────

/** Seeded PRNG that returns [0, 1). */
export type RngFn = () => number;

export interface BacktrackResult<T> {
  found: boolean;
  solution: T | null;
  statesExplored: number;
}

// ── Difficulty system ─────────────────────────────────────────────────────────

/**
 * One named difficulty tier. Lives in shared so both Kings and Mambo
 * can satisfy the same contract without redefining it.
 * Game-specific fields (minGrid, maxGrid, etc.) go in the game's own tier type
 * by extending this.
 */
export interface DiffTier {
  name: string;
  icon: string;
  diffScore: number;
  color: string; /* accent hex, e.g. "#4a9e6a"      */
  dim: string; /* dimmed border, e.g. "#2a5e3a"    */
  bright: string; /* bright text, e.g. "#7ed4a0"      */
}

// ── UI / layout ───────────────────────────────────────────────────────────────

export interface TabItem {
  id: string;
  label: string;
  icon: string;
}

/** The three fixed tabs every game page uses. */
export type GameTabId = "game" | "solver" | "generator";
