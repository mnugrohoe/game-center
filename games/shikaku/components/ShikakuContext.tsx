"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import useTimer, { UseTimerReturn } from "@/shared/hooks/useTimer";
import useShikakuBoard, {
  UseShikakuBoardReturn,
} from "../hooks/useShikakuBoard";
import useShikakuGenerator, {
  UseShikakuGeneratorReturn,
} from "../hooks/useShikakuGenerator";
import { checkShikakuComplete } from "../lib/validation";
import {
  generateShikakuByLevel,
  generateShikakuByTierIdx,
} from "../lib/generator";
import { levelToTierIdx, SHIKAKU_TIERS } from "../lib/difficulty";
import { getRandomSeed } from "@/shared/algorithms";
import { solveShikaku } from "../lib/solver";
import { StateProp } from "@/shared/types";
import { SolverStatus } from "@/shared/components/ui/primitive";
import { RectInfo } from "../lib/types";

interface ShikakuContextValue {
  board: UseShikakuBoardReturn;
  generator: UseShikakuGeneratorReturn;
  timer: UseTimerReturn;
  isComplete: boolean;
  solverStatus: StateProp<SolverStatus>;
  resetGame: () => void;
  generatePuzzle: (seeded?: number | React.SyntheticEvent) => void;
  loadNextPuzzle: () => void;
  autoSolve: () => void;
  toggleSolution: () => void;
  clearBoard: () => void;
}

const ShikakuContext = createContext<ShikakuContextValue | null>(null);

/**
 * Hook to access the Shikaku game state and actions.
 */
export function useShikaku() {
  const context = useContext(ShikakuContext);
  if (!context) {
    throw new Error("useShikaku must be used within a ShikakuProvider");
  }
  return context;
}

interface ShikakuProviderProps {
  children: React.ReactNode;
}

export function ShikakuProvider({ children }: ShikakuProviderProps) {
  const [solverStatus, setSolverStatus] = useState<SolverStatus>("idle");

  // ─── Core Game Hooks ───────────────────────────────────────────────────────
  const timer = useTimer();
  const board = useShikakuBoard();
  const generator = useShikakuGenerator();

  // ─── Game State Evaluators ──────────────────────────────────────────────────
  const isComplete = useMemo(() => {
    if (!board.puzzle.value) return false;
    return checkShikakuComplete(board.userRects.value, board.puzzle.value);
  }, [board.userRects.value, board.puzzle.value]);

  // Handle game completion side effects safely via useEffect
  useEffect(() => {
    if (isComplete) {
      timer.stopTimer();
    }
  }, [isComplete, timer]);

  // ─── Actions ───────────────────────────────────────────────────────────────
  const resetGame = useCallback(() => {
    board.userRects.setValue([]);
    board.isSolutionVisible.setValue(false);
    board.solverSolution.setValue(null);
    setSolverStatus("idle");
    timer.resetTimer();
    board.attempt.setValue(1);
  }, [board, timer]);

  const generatePuzzle = useCallback(
    (seeded?: number | React.SyntheticEvent) => {
      const actualSeed =
        typeof seeded === "number" ? seeded : generator.seed.value;
      try {
        const puzzle =
          generator.mode.value === "Difficulty"
            ? generateShikakuByTierIdx(generator.tierIdx.value, actualSeed)
            : generateShikakuByLevel(generator.level.value);
        board.puzzle.setValue(puzzle);
        resetGame();
      } catch (error) {
        console.error("Failed to generate Shikaku puzzle:", error);
        setSolverStatus("error");
      }
    },
    [
      generator.mode,
      generator.seed,
      generator.tierIdx,
      generator.level,
      board.puzzle,
      resetGame,
    ],
  );

  const loadNextPuzzle = useCallback(() => {
    if (generator.mode.value === "Level") {
      const nextLevel = generator.level.value + 1;
      generator.level.setValue(nextLevel);
      generator.tierIdx.setValue(
        levelToTierIdx(nextLevel, SHIKAKU_TIERS.length),
      );

      // We handle generation immediately after updating local state coordinates
      try {
        const puzzle = generateShikakuByLevel(nextLevel);
        board.puzzle.setValue(puzzle);
        resetGame();
      } catch (error) {
        console.error("Failed to generate next level puzzle:", error);
      }
    }

    if (generator.mode.value === "Difficulty") {
      const newSeed = getRandomSeed();
      generator.seed.setValue(newSeed);
      generatePuzzle(newSeed);
    }
  }, [generator, board.puzzle, generatePuzzle, resetGame]);

  // ─── Solver & Utility Actions ──────────────────────────────────────────────
  const autoSolve = useCallback(() => {
    const puzzle = board.puzzle.value || board.solverPuzzle.value;
    const infos = puzzle?.infos;
    const infosArea = infos?.reduce((prev, curr) => prev + curr.area, 0);

    if (!puzzle) return;
    if (infosArea !== (puzzle?.width as number) * (puzzle?.height as number))
      return;
    setSolverStatus("solving");
    board.isSolutionVisible.setValue(true);
    console.log(puzzle);
    setTimeout(() => {
      try {
        const result = solveShikaku(
          puzzle?.width as number,
          puzzle.height as number,
          puzzle.infos as RectInfo[],
        );
        board.solverSolution.setValue(result);
        setSolverStatus(result ? "done" : "error");
      } catch {
        setSolverStatus("error");
      }
    }, 60);
  }, [
    board.puzzle.value,
    board.isSolutionVisible,
    board.solverSolution,
    board.solverPuzzle,
  ]);

  const toggleSolution = useCallback(() => {
    board.isSolutionVisible.setValue((s) => !s);
  }, [board.isSolutionVisible]);

  const clearBoard = useCallback(() => {
    board?.userRects?.setValue([]);

    if (board?.solverPuzzle?.value) {
      board.solverPuzzle.setValue({
        ...board.solverPuzzle.value,
        infos: [],
      });
      resetGame();
    }
  }, [board.userRects, board.solverPuzzle, resetGame]);

  // ─── Memoized Context Value ────────────────────────────────────────────────
  const contextValue = useMemo<ShikakuContextValue>(
    () => ({
      board,
      generator,
      timer,
      isComplete,
      solverStatus: {
        value: solverStatus,
        setValue: setSolverStatus,
      },
      setSolverStatus,
      resetGame,
      generatePuzzle,
      loadNextPuzzle,
      autoSolve,
      toggleSolution,
      clearBoard,
    }),
    [
      board,
      generator,
      timer,
      isComplete,
      solverStatus,
      resetGame,
      generatePuzzle,
      loadNextPuzzle,
      autoSolve,
      toggleSolution,
      clearBoard,
    ],
  );

  return (
    <ShikakuContext.Provider value={contextValue}>
      {children}
    </ShikakuContext.Provider>
  );
}
