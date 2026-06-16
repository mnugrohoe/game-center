"use client";
import { type SetsPuzzle } from "../lib/generator";
import useGameBoard, {
  type UseGameBoardReturn,
} from "@/shared/hooks/useGameBoard";
import { CardType } from "../lib/types";
import { StateProp } from "@/shared/types";
import { useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UseSetsBoardReturn = UseGameBoardReturn<SetsPuzzle, CardType> & {
  userSets: StateProp<[CardType, CardType, CardType][]>;
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Game-specific adapter for {@link useGameBoard}.
 *
 * Binds the generic puzzle and play state types used by Kings and
 * returns a fully typed board controller.
 *
 * @returns A typed game board controller for specific puzzles.
 */
export default function useSetsBoard(): UseSetsBoardReturn {
  const base = useGameBoard<SetsPuzzle, CardType>();
  const [userSets, setUserSets] = useState<[CardType, CardType, CardType][]>(
    [],
  );
  return {
    ...base,
    userSets: { value: userSets, setValue: setUserSets },
  };
}
