"use client";
import { type KingsPuzzle } from "../lib/generator";
import useGameBoard, {
  type UseGameBoardReturn,
} from "@/shared/hooks/useGameBoard";
import type { KingBoardCellState } from "../types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UseKingsBoardReturn = UseGameBoardReturn<
  KingsPuzzle,
  KingBoardCellState[]
>;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Thin adapter over `useGameBoard` that adds Shikaku-specific state.
 *
 * Prefer accessing board state through `ShikakuContext` (`useShikaku().board`)
 * rather than calling this hook directly.
 *
 * ### Generic fields (from useGameBoard)
 * - `puzzle`             — current ShikakuPuzzle
 * - `moves`              — user-drawn rectangles (`userRect[]`)
 * - `isSolutionVisible`  — solver overlay visibility toggle
 * - `solverSolution`     — rectangles returned by the auto-solver
 * - `attempt`            — retry counter
 * - `solverStatus`       — `idle | solving | done | error`
 * - `resetBoard()`       — resets all of the above (not `puzzle`)
 *
 * ### Shikaku-specific fields
 * - `solverPuzzle` — partial puzzle entered manually in the solver panel
 */
export default function useKingsBoard(): UseKingsBoardReturn {
  const base = useGameBoard<KingsPuzzle, KingBoardCellState[]>();
  return {
    ...base,
  };
}
