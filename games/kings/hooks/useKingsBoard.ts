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
 * Kings-specific adapter for {@link useGameBoard}.
 *
 * Binds the generic puzzle and play state types used by Kings and
 * returns a fully typed board controller.
 *
 * @returns A typed game board controller for Kings puzzles.
 */
export default function useKingsBoard(): UseKingsBoardReturn {
  const base = useGameBoard<KingsPuzzle, KingBoardCellState[]>();

  return {
    ...base,
  };
}
