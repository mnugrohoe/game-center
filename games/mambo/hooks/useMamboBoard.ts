"use client";

import useGameBoard, {
  type UseGameBoardReturn,
} from "@/shared/hooks/useGameBoard";
import type { MamboCellValue, MamboPuzzle } from "../types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UseMamboBoardReturn = UseGameBoardReturn<
  MamboPuzzle,
  MamboCellValue[]
>;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Thin adapter over `useGameBoard`
 */
export default function useMamboBoard(): UseMamboBoardReturn {
  const base = useGameBoard<MamboPuzzle, MamboCellValue[]>();
  return {
    ...base,
  };
}
