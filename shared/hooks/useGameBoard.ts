"use client";

import { useCallback, useState } from "react";
import { StateProp } from "@/shared/types";

/**
 * Return type for the {@link useGameBoard} hook.
 * * @template TPuzzle - The structural type defining the puzzle state.
 * @template TMove - The type defining a single move made on the board.
 */
export interface UseGameBoardReturn<TPuzzle, TMove> {
  /** The current puzzle state wrapper containing the value and setter. */
  puzzle: StateProp<TPuzzle | null>;

  /** A partial puzzle state wrapper, useful for custom or in-progress puzzle configurations. */
  customPuzzle: StateProp<Partial<TPuzzle> | null>;

  /** An array wrapper tracking the history of moves made on the board. */
  moves: StateProp<TMove[]>;

  /** An attempt counter wrapper, tracking the number of tries for the current puzzle. */
  attempt: StateProp<number>;

  /** Resets the move history back to empty and resets the attempt counter to 1. */
  resetBoard: () => void;
}

/**
 * A custom React hook to manage the core state of a generic game board.
 * Tracks the active puzzle, custom configurations, move history, and attempt counts.
 * * @template TPuzzle - The shape of the puzzle object.
 * @template TMove - The shape of an individual move item.
 * * @returns {UseGameBoardReturn<TPuzzle, TMove>} An object containing the state wrappers and control functions for the game board.
 * * @example
 * ```tsx
 * const { puzzle, moves, resetBoard } = useGameBoard<SudokuPuzzle, SudokuMove>();
 * ```
 */
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

  /**
   * Resets the game board state by clearing all recorded moves
   * and restarting the attempt counter to 1.
   */
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
