"use client";

import { useCallback, useState } from "react";
import { StateProp } from "@/shared/types";

export interface UseGameBoardReturn<TPuzzle, TMove> {
  puzzle: StateProp<TPuzzle | null>;
  customPuzzle: StateProp<Partial<TPuzzle | null> | null>;
  moves: StateProp<TMove[]>;
  attempt: StateProp<number>;
  resetBoard: () => void;
}

export default function useGameBoard<TPuzzle, TMove>(): UseGameBoardReturn<
  TPuzzle,
  TMove
> {
  const [puzzle, setPuzzle] = useState<TPuzzle | null>(null);
  const [customPuzzle, setCustomPuzzle] = useState<Partial<TPuzzle> | null>(
    null,
  );
  const [moves, setMoves] = useState<TMove[]>([]);
  const [attempt, setAttempt] = useState<number>(1);

  const resetBoard = useCallback(() => {
    setMoves([]);
    setAttempt(1);
  }, []);

  return {
    puzzle: { value: puzzle, setValue: setPuzzle },
    customPuzzle: { value: customPuzzle, setValue: setCustomPuzzle },
    moves: { value: moves, setValue: setMoves },
    attempt: { value: attempt, setValue: setAttempt },

    resetBoard,
  };
}
