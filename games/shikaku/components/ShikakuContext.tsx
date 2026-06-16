"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";
import useTimer, { UseTimerReturn } from "@/shared/hooks/useTimer";
import useShikakuBoard, {
  UseShikakuBoardReturn,
} from "../hooks/useShikakuBoard";
import {
  checkShikakuComplete,
  SHIKAKU_TIERS,
  solveShikaku,
  RectInfo,
  shikakuGenerator,
} from "../lib";
import useGenerator, { UseGeneratorReturn } from "@/shared/hooks/useGenerator";
import useSolver, { UseSolverReturn } from "@/shared/hooks/useSolver";

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface ShikakuContextValue {
  board: UseShikakuBoardReturn;
  generator: UseGeneratorReturn;
  timer: UseTimerReturn;
  solver: UseSolverReturn<
    { width: number; height: number; infos: RectInfo[] },
    ReturnType<typeof solveShikaku>
  >; // Ekspos solver ke context jika UI membutuhkannya
  isComplete: boolean;
  resetGame: () => void;
  generatePuzzle: (seedOverride?: number) => void;
  loadNextPuzzle: () => void;
  autoSolve: () => void;
  clearBoard: () => void;
}

const ShikakuContext = createContext<ShikakuContextValue | null>(null);

export function useShikaku() {
  const context = useContext(ShikakuContext);
  if (!context)
    throw new Error("useShikaku must be used within a ShikakuProvider");
  return context;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function ShikakuProvider({ children }: { children: React.ReactNode }) {
  // ─── Core hooks ────────────────────────────────────────────────────────────
  const timer = useTimer();
  const generator = useGenerator();
  const board = useShikakuBoard();

  const {
    puzzle: { setValue: setPuzzle },
    playState: { setValue: setPlayState },
    customPuzzle: { value: customPuzzle, setValue: setCustomPuzzle },
    resetBoard,
  } = board;

  const { resetTimer, stopTimer } = timer;

  // ─── Solver Hook Setup ─────────────────────────────────────────────────────
  const shikakuSolver = useCallback(
    (puzzleInput: { width: number; height: number; infos: RectInfo[] }) =>
      solveShikaku(puzzleInput.width, puzzleInput.height, puzzleInput.infos),
    [],
  );

  const solver = useSolver(shikakuSolver);

  // ─── Completion check ──────────────────────────────────────────────────────
  const isComplete = useMemo(() => {
    if (!board.puzzle.value) return false;
    return checkShikakuComplete(board.playState.value, board.puzzle.value);
  }, [board.playState.value, board.puzzle.value]);

  useEffect(() => {
    if (isComplete) stopTimer();
  }, [isComplete, stopTimer]);

  // ─── Shared reset (board + timer + solver) ──────────────────────────────────
  const resetGame = useCallback(() => {
    resetBoard();
    resetTimer();
    solver.reset();
  }, [resetBoard, resetTimer, solver]);

  // ─── generatePuzzle ────────────────────────────────────────────────────────
  const generatePuzzle = useCallback(
    (seedOverride?: number) => {
      generator.generate({
        levelGenerator: shikakuGenerator.byLevel,
        tierGenerator: shikakuGenerator.byTier,
        onPuzzle: setPuzzle,
        onReset: resetGame,
        onError: () => solver.status.setValue("error"), // Set error langsung ke hook solver
        seedOverride,
      });
    },
    [generator, setPuzzle, resetGame, solver.status],
  );

  // ─── loadNextPuzzle ────────────────────────────────────────────────────────
  const loadNextPuzzle = useCallback(() => {
    generator.loadNext({
      levelGenerator: shikakuGenerator.byLevel,
      tierGenerator: shikakuGenerator.byTier,
      diffTiers: SHIKAKU_TIERS,
      onPuzzle: setPuzzle,
      onReset: resetGame,
      onError: () => solver.status.setValue("error"),
    });
  }, [generator, setPuzzle, resetGame, solver.status]);

  // ─── autoSolve ─────────────────────────────────────────────────────────────
  const autoSolve = useCallback(() => {
    const activePuzzle = board.puzzle.value ?? customPuzzle;
    if (!activePuzzle) return;

    const totalArea =
      activePuzzle.infos?.reduce((acc, i) => acc + i.area, 0) ?? 0;
    const puzzleArea =
      (activePuzzle.width as number) * (activePuzzle.height as number);

    if (totalArea !== puzzleArea) {
      console.warn(
        "[autoSolve] Rejected: Total clue area does not match board size.",
      );

      solver.status.setValue("error");
      return;
    }

    solver.solve({
      width: activePuzzle.width as number,
      height: activePuzzle.height as number,
      infos: activePuzzle.infos as RectInfo[],
    });
  }, [board.puzzle.value, customPuzzle, solver]);

  // ─── clearBoard ────────────────────────────────────────────────────────────
  const clearBoard = useCallback(() => {
    setPlayState([]);
    if (customPuzzle) {
      setCustomPuzzle({ ...customPuzzle, infos: [] });
      resetGame();
    }
  }, [setPlayState, customPuzzle, setCustomPuzzle, resetGame]);

  // ─── Context value ─────────────────────────────────────────────────────────
  const contextValue = useMemo<ShikakuContextValue>(
    () => ({
      board,
      generator,
      timer,
      solver, // Kita ikut ekspos solver ini agar komponen UI (seperti tombol auto-solve atau overlay jawaban) bisa membaca `solver.status.value` atau `solver.solution.value`
      isComplete,
      resetGame,
      generatePuzzle,
      loadNextPuzzle,
      autoSolve,
      clearBoard,
    }),
    [
      board,
      generator,
      timer,
      solver,
      isComplete,
      resetGame,
      generatePuzzle,
      loadNextPuzzle,
      autoSolve,
      clearBoard,
    ],
  );

  return (
    <ShikakuContext.Provider value={contextValue}>
      {children}
    </ShikakuContext.Provider>
  );
}
