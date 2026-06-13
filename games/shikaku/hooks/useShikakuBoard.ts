"use client";

import { ShikakuPuzzle, userRect } from "../lib";
import useGameBoard, { UseGameBoardReturn } from "@/shared/hooks/useGameBoard";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Shikaku-specific extensions on top of the generic board state.
 */
export type UseShikakuBoardReturn = UseGameBoardReturn<ShikakuPuzzle, userRect>;

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
 * - `puzzle`        — current active ShikakuPuzzle
 * - `moves`         — user-drawn rectangles (`userRect[]`)
 * - `attempt`       — retry counter
 * - `resetBoard()`  — resets moves and attempt counter
 */
export default function useShikakuBoard(): UseShikakuBoardReturn {
  const base = useGameBoard<ShikakuPuzzle, userRect>();

  return {
    ...base,
  };
}
