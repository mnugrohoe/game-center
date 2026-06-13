/**
 * games/kings/types/index.ts
 *
 * Kings-only types. Grid2D, Coord, DiffTier, RngFn → import from @/shared/types.
 */

export type BlankCanvasState = -1;
export type EmptyCellState = 0;
export type MarkerCellState = 1;
export type LockCellState = 2;
export type KingCellState = 3;

/**
 * Per-cell play state (stored sparsely — absent keys = `0`):
 * - `0` empty
 * - `1` marker dot
 * - `3` king
 */
export type KingBoardCellState =
  | EmptyCellState
  | MarkerCellState
  | KingCellState
  | BlankCanvasState;

/** Solver canvas cell state */
export type SolState = "" | "king" | "territory" | "blocked";

export interface HistoryEntry {
  states: KingBoardCellState[][];
  auto: boolean[][];
}
