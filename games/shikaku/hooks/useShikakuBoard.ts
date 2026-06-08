"use client";

import { useState } from "react";
import { StateProp } from "@/shared/types";
import { ShikakuPuzzle } from "../lib/generator";
import { userRect } from "../lib/types";

/**
 * State container returned by useShikakuBoard.
 */
export interface UseShikakuBoardReturn {
  /**
   * Current puzzle.
   */
  puzzle: StateProp<ShikakuPuzzle | null>;

  /**
   * User-created rectangles.
   */
  userRects: StateProp<userRect[]>;

  /**
   * Whether the solver solution is visible.
   */
  isSolutionVisible: StateProp<boolean>;

  /**
   * Solver-generated solution.
   */
  solverSolution: StateProp<userRect[] | null>;

  attempt: StateProp<number>;

  solverPuzzle: StateProp<Partial<ShikakuPuzzle> | null>;
}

/**
 * Manages all board-related state for a Shikaku puzzle.
 */
export default function useShikakuBoard(): UseShikakuBoardReturn {
  const [puzzle, setPuzzle] = useState<ShikakuPuzzle | null>(null);
  const [userRects, setUserRects] = useState<userRect[]>([]);
  const [isSolutionVisible, setIsSolutionVisible] = useState(false);
  const [solverSolution, setSolverSolution] = useState<userRect[] | null>(null);
  const [attempt, setAttempt] = useState<number>(1);
  const [solverPuzzle, setSolverPuzzle] =
    useState<Partial<ShikakuPuzzle> | null>(null);

  return {
    puzzle: {
      value: puzzle,
      setValue: setPuzzle,
    },

    userRects: {
      value: userRects,
      setValue: setUserRects,
    },

    isSolutionVisible: {
      value: isSolutionVisible,
      setValue: setIsSolutionVisible,
    },

    solverSolution: {
      value: solverSolution,
      setValue: setSolverSolution,
    },

    attempt: {
      value: attempt,
      setValue: setAttempt,
    },

    solverPuzzle: {
      value: solverPuzzle,
      setValue: setSolverPuzzle,
    },
  };
}
