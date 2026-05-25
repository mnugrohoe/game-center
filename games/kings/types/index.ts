/**
 * games/kings/types/index.ts
 *
 * Kings-only types. Grid2D, Coord, DiffTier, RngFn → import from @/shared/types.
 */

/** 0 = empty, 1 = mark ×, 2 = king ♛ */
export type CellState = 0 | 1 | 2;

/** Solver canvas cell state */
export type SolState = "" | "king" | "territory" | "blocked";

export interface HistoryEntry {
  states: CellState[][];
  auto: boolean[][];
}
