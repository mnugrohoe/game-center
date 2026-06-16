"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";
import useTimer, { UseTimerReturn } from "@/shared/hooks/useTimer";

import useGenerator, { UseGeneratorReturn } from "@/shared/hooks/useGenerator";
import useSolver, { UseSolverReturn } from "@/shared/hooks/useSolver";
import useMamboBoard, { UseMamboBoardReturn } from "../hooks/useMamboBoard";
import {
  checkMamboComplete,
  MAMBO_TIERS,
  mamboGenerator,
  solveMambo,
} from "../lib";
import { MamboCellValue, MamboPuzzle } from "../types";

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface MamboContextValue {
  board: UseMamboBoardReturn;
  generator: UseGeneratorReturn;
  timer: UseTimerReturn;
  isComplete: boolean;
  resetGame: () => void;
  generatePuzzle: (seedOverride?: number) => void;
  loadNextPuzzle: () => void;
  autoSolve: () => void;
  clearBoard: () => void;
  // FIX: Explicitly type the expected array structure matching what useSolver yields
  solver: UseSolverReturn<
    {
      grid: MamboPuzzle["puzzle"];
      constraints: MamboPuzzle["constraints"];
      size: MamboPuzzle["size"];
    },
    MamboCellValue[][]
  >;
}

const MamboContext = createContext<MamboContextValue | null>(null);

export function useMambo() {
  const context = useContext(MamboContext);
  if (!context) throw new Error("useMambo must be used within a MamboProvider");
  return context;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function levelGenerator(level: number): MamboPuzzle {
  const puzzle = mamboGenerator.byLevel(level);
  if (!puzzle)
    throw new Error(`Failed to generate Mambo puzzle at level ${level}`);
  return puzzle;
}

function tierGenerator(tierIdx: number, seed: number): MamboPuzzle {
  const puzzle = mamboGenerator.byTier(tierIdx, seed);
  if (!puzzle)
    throw new Error(`Failed to generate Mambo puzzle at tier ${tierIdx}`);
  return puzzle;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function MamboProvider({ children }: { children: React.ReactNode }) {
  // ─── Core hooks ────────────────────────────────────────────────────────────
  const timer = useTimer();
  const generator = useGenerator();
  const board = useMamboBoard();

  const {
    puzzle: { setValue: setPuzzle },
    playState: { setValue: setPlayState },
    customPuzzle: { value: customPuzzle, setValue: setCustomPuzzle },
    resetBoard,
  } = board;

  const { resetTimer, stopTimer } = timer;

  // ─── Completion check ──────────────────────────────────────────────────────
  const isComplete = useMemo(() => {
    if (!board.puzzle.value) return false;
    const complete = checkMamboComplete(
      board.playState.value,
      board.puzzle.value,
    );
    return complete;
  }, [board.playState.value, board.puzzle.value]);

  useEffect(() => {
    if (isComplete) stopTimer();
  }, [isComplete, stopTimer]);

  // ─── onPuzzle: set puzzle + initialize moves grid ──────────────────────────
  const onPuzzle = useCallback(
    (puzzle: MamboPuzzle) => {
      setPuzzle(puzzle);
      setPlayState(puzzle.puzzle);
    },
    [setPuzzle, setPlayState],
  );

  // ─── Solver ────────────────────────────────────────────────────────────────
  const MamboSolver = useCallback(
    (puzzle: {
      grid: MamboPuzzle["puzzle"];
      constraints: MamboPuzzle["constraints"];
      size: MamboPuzzle["size"];
    }) => solveMambo(puzzle.grid, puzzle.constraints, puzzle.size),
    [],
  );

  const solver = useSolver(MamboSolver);

  // ─── Shared reset (board + timer) ──────────────────────────────────────────
  const resetGame = useCallback(() => {
    resetBoard();
    resetTimer();
    solver.reset();
  }, [resetBoard, resetTimer, solver]);

  // ─── generatePuzzle ────────────────────────────────────────────────────────
  const generatePuzzle = useCallback(
    (seedOverride?: number) => {
      generator.generate({
        levelGenerator,
        tierGenerator,
        onPuzzle,
        onReset: resetGame,
        onError: () => solver.status.setValue("error"),
        seedOverride,
      });
    },
    [generator, onPuzzle, solver.status, resetGame],
  );

  // ─── loadNextPuzzle ────────────────────────────────────────────────────────
  const loadNextPuzzle = useCallback(() => {
    generator.loadNext({
      levelGenerator,
      tierGenerator,
      diffTiers: MAMBO_TIERS,
      onPuzzle,
      onReset: resetGame,
      onError: () => solver.status.setValue("error"),
    });
  }, [generator, onPuzzle, solver.status, resetGame]);

  // ─── autoSolve ─────────────────────────────────────────────────────────────
  const autoSolve = useCallback(() => {
    const puzzle = board.puzzle.value ?? customPuzzle;

    if (!puzzle?.size || !puzzle?.puzzle || !puzzle.constraints) {
      console.warn("[autoSolve] Rejected: Puzzle or grid is not initialized.");
      solver.status.setValue("error");
      return;
    }

    const { size, solution, puzzle: grid, constraints } = puzzle;

    if (solution) {
      solver.solution.setValue(solution);
      solver.status.setValue("done");
      solver.toggleVisibility();
      return;
    }

    solver.solve({ grid, size, constraints });
  }, [board.puzzle.value, customPuzzle, solver]);

  // ─── clearBoard ────────────────────────────────────────────────────────────
  const clearBoard = useCallback(() => {
    if (customPuzzle) {
      setCustomPuzzle({ ...customPuzzle, puzzle: [] });
      resetGame();
    }
    setPlayState(board.puzzle.value?.puzzle ?? []);
  }, [
    setPlayState,
    board.puzzle.value,
    customPuzzle,
    setCustomPuzzle,
    resetGame,
  ]);

  // ─── Context value ─────────────────────────────────────────────────────────
  const contextValue = useMemo<MamboContextValue>(
    () => ({
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
    <MamboContext.Provider value={contextValue}>
      {children}
    </MamboContext.Provider>
  );
}
