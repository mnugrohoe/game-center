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
import useTowerBoard, { UseTowerBoardReturn } from "../hooks/useTowerBoard";
import { towerGenerator, TowerPuzzle } from "../lib/generator";
import { validateTowerGuess } from "../lib/validation";
import { TOWER_DIFF_TIERS } from "../lib/difficulty";

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface TowerContextValue {
  board: UseTowerBoardReturn;
  generator: UseGeneratorReturn;
  timer: UseTimerReturn;
  isComplete: boolean;
  resetGame: () => void;
  generatePuzzle: (seedOverride?: number) => void;
  loadNextPuzzle: () => void;
  clearBoard: () => void;
}

const TowerContext = createContext<TowerContextValue | null>(null);

export function useTower() {
  const context = useContext(TowerContext);
  if (!context) throw new Error("useTower must be used within a TowerProvider");
  return context;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function levelGenerator(level: number): TowerPuzzle {
  const puzzle = towerGenerator.byLevel(level);
  if (!puzzle)
    throw new Error(`Failed to generate Tower puzzle at level ${level}`);
  return puzzle;
}

function tierGenerator(tierIdx: number, seed: number): TowerPuzzle {
  const puzzle = towerGenerator.byTier(tierIdx, seed);
  if (!puzzle)
    throw new Error(`Failed to generate Tower puzzle at tier ${tierIdx}`);
  return puzzle;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function TowerProvider({ children }: { children: React.ReactNode }) {
  // ─── Core hooks ────────────────────────────────────────────────────────────
  const timer = useTimer();
  const generator = useGenerator();
  const board = useTowerBoard();

  const {
    puzzle: { setValue: setPuzzle },
    playState: { value: playState, setValue: setPlayState },
    resetBoard,
  } = board;

  const { resetTimer, stopTimer } = timer;

  // ─── Completion check ──────────────────────────────────────────────────────
  const isComplete = useMemo(() => {
    const playStateValue = [...playState].pop();
    if (!board.puzzle.value || !playStateValue?.submitted) return false;

    const complete = validateTowerGuess(
      playStateValue.sequence,
      board.puzzle.value.targetSequence,
    );
    return complete.isCorrect;
  }, [playState, board.puzzle.value]);

  useEffect(() => {
    if (isComplete) stopTimer();
  }, [isComplete, stopTimer]);

  // ─── onPuzzle: set puzzle + initialize moves grid ──────────────────────────
  const onPuzzle = useCallback(
    (puzzle: TowerPuzzle) => {
      setPuzzle(puzzle);
      setPlayState([]);
    },
    [setPuzzle, setPlayState],
  );

  // ─── Shared reset (board + timer) ──────────────────────────────────────────
  const resetGame = useCallback(() => {
    resetBoard();
    resetTimer();
  }, [resetBoard, resetTimer]);

  // ─── generatePuzzle ────────────────────────────────────────────────────────
  const generatePuzzle = useCallback(
    (seedOverride?: number) => {
      generator.generate({
        levelGenerator,
        tierGenerator,
        onPuzzle,
        onReset: resetGame,
        seedOverride,
      });
    },
    [generator, onPuzzle, resetGame],
  );

  // ─── loadNextPuzzle ────────────────────────────────────────────────────────
  const loadNextPuzzle = useCallback(() => {
    generator.loadNext({
      levelGenerator,
      tierGenerator,
      diffTiers: TOWER_DIFF_TIERS,
      onPuzzle,
      onReset: resetGame,
    });
  }, [generator, onPuzzle, resetGame]);

  // ─── clearBoard ────────────────────────────────────────────────────────────
  const clearBoard = useCallback(() => {
    setPlayState([]);
  }, [setPlayState]);

  // ─── Context value ─────────────────────────────────────────────────────────
  const contextValue = useMemo<TowerContextValue>(
    () => ({
      board,
      generator,
      timer,
      isComplete,
      resetGame,
      generatePuzzle,
      loadNextPuzzle,
      clearBoard,
    }),
    [
      board,
      generator,
      timer,
      isComplete,
      resetGame,
      generatePuzzle,
      loadNextPuzzle,
      clearBoard,
    ],
  );

  return (
    <TowerContext.Provider value={contextValue}>
      {children}
    </TowerContext.Provider>
  );
}
