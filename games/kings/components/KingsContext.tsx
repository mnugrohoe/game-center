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
import useKingsBoard, { UseKingsBoardReturn } from "../hooks/useKingsBoard";
import {
  checkKingsComplete,
  KINGS_TIERS,
  kingsGenerator,
  KingsPuzzle,
  solveKings,
  validateRegions,
} from "../lib";
import { Coord } from "@/shared/types";
import { KingBoardCellState } from "../types";

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface KingsContextValue {
  board: UseKingsBoardReturn;
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
    { grid: KingsPuzzle["grid"]; N: KingsPuzzle["params"]["N"] },
    Coord[]
  >;
}

const KingsContext = createContext<KingsContextValue | null>(null);

export function useKings() {
  const context = useContext(KingsContext);
  if (!context) throw new Error("useKings must be used within a KingsProvider");
  return context;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEmptyMoves(N: number): KingBoardCellState[][] {
  return Array.from({ length: N }, () => Array<KingBoardCellState>(N).fill(0));
}

function levelGenerator(level: number): KingsPuzzle {
  const puzzle = kingsGenerator.byLevel(level);
  if (!puzzle)
    throw new Error(`Failed to generate Kings puzzle at level ${level}`);
  return puzzle;
}

function tierGenerator(tierIdx: number, seed: number): KingsPuzzle {
  const puzzle = kingsGenerator.byTier(tierIdx, seed);
  if (!puzzle)
    throw new Error(`Failed to generate Kings puzzle at tier ${tierIdx}`);
  return puzzle;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function KingsProvider({ children }: { children: React.ReactNode }) {
  // ─── Core hooks ────────────────────────────────────────────────────────────
  const timer = useTimer();
  const generator = useGenerator();
  const board = useKingsBoard();

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
    const complete = checkKingsComplete(
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
    (puzzle: KingsPuzzle) => {
      setPuzzle(puzzle);
      setPlayState(makeEmptyMoves(puzzle.params.N));
    },
    [setPuzzle, setPlayState],
  );

  // ─── Solver ────────────────────────────────────────────────────────────────
  const KingsSolver = useCallback(
    (puzzle: { grid: KingsPuzzle["grid"]; N: KingsPuzzle["params"]["N"] }) =>
      solveKings(puzzle.grid, puzzle.N),
    [],
  );

  const solver = useSolver(KingsSolver);

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
      diffTiers: KINGS_TIERS,
      onPuzzle,
      onReset: resetGame,
      onError: () => solver.status.setValue("error"),
    });
  }, [generator, onPuzzle, solver.status, resetGame]);

  // ─── autoSolve ─────────────────────────────────────────────────────────────
  const autoSolve = useCallback(() => {
    const puzzle = board.puzzle.value ?? customPuzzle;

    if (!puzzle?.size || !puzzle?.grid) {
      console.warn("[autoSolve] Rejected: Puzzle or grid is not initialized.");
      solver.status.setValue("error");
      return;
    }

    const { grid, size, solution } = puzzle;

    if (solution) {
      solver.solution.setValue(solution);
      solver.status.setValue("done");
      solver.toggleVisibility();
      return;
    }

    if (generator.isSolver) {
      const { valid, status } = validateRegions(grid, size);

      if (!valid) {
        console.error("[autoSolve] Validation failed:", status);
        solver.status.setValue("error");
        return;
      }
    }

    solver.solve({ grid, N: size });
  }, [board.puzzle.value, customPuzzle, generator.isSolver, solver]);

  // ─── clearBoard ────────────────────────────────────────────────────────────
  const clearBoard = useCallback(() => {
    setPlayState([]);
    if (customPuzzle) {
      setCustomPuzzle({ ...customPuzzle, grid: [] });
      resetGame();
    }
  }, [setPlayState, customPuzzle, setCustomPuzzle, resetGame]);

  // ─── Context value ─────────────────────────────────────────────────────────
  const contextValue = useMemo<KingsContextValue>(
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
    <KingsContext.Provider value={contextValue}>
      {children}
    </KingsContext.Provider>
  );
}
