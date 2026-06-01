"use client";

import { useState } from "react";
import { ShikakuPuzzle } from "../lib/generator";
import { userRect } from "../lib/types";

export interface UseShikakuBoardState {
  puzzle: ShikakuPuzzle | null;
  setPuzzle: React.Dispatch<React.SetStateAction<ShikakuPuzzle | null>>;

  userRects: userRect[] | [];
  setuserRects: React.Dispatch<React.SetStateAction<userRect[] | []>>;

  isSolutionVisible: boolean;
  setIsSolutionVisible: React.Dispatch<React.SetStateAction<boolean>>;

  solverSolution: userRect[] | null;
  setSolverSolution: React.Dispatch<React.SetStateAction<userRect[] | null>>;
}

export default function useShikakuBoard(): UseShikakuBoardState {
  // Puzzle state
  const [puzzle, setPuzzle] = useState<ShikakuPuzzle | null>(null);
  const [userRects, setuserRects] = useState<userRect[]>([]);

  // Solver state
  const [isSolutionVisible, setIsSolutionVisible] = useState<boolean>(false);
  const [solverSolution, setSolverSolution] = useState<userRect[] | null>(null);

  return {
    puzzle,
    setPuzzle,
    userRects,
    setuserRects,
    isSolutionVisible,
    setIsSolutionVisible,
    solverSolution,
    setSolverSolution,
  };
}
