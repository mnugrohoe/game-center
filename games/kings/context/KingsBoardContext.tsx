/* eslint-disable react-hooks/refs */
"use client";

import React, {
  createContext,
  useContext,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  useKingsBoard,
  calcHasConflict,
  calcTerritory,
  type KingsBoardState,
  type KingsBoardActions,
} from "../hooks/useKingsBoard";
import { useTimer } from "../hooks/useTimer";

// ─── Context shape ────────────────────────────────────────────────────────────

export interface KingsBoardContextValue
  extends KingsBoardState, KingsBoardActions {
  // Current grid reference (set by the page that owns the puzzle)
  grid: number[][] | null;
  N: number;
  // Derived
  numKings: number;
  hasAnyConflict: boolean;
  territory: boolean[][];
  // Timer
  elapsed: number;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  // Hint (for generator page)
  showHint: (solution: [number, number][]) => void;
  // Load new puzzle
  loadPuzzle: (grid: number[][], N: number) => void;
}

const KingsBoardContext = createContext<KingsBoardContextValue | null>(null);

export function useKingsBoardCtx(): KingsBoardContextValue {
  const ctx = useContext(KingsBoardContext);
  if (!ctx)
    throw new Error(
      "useKingsBoardCtx must be used inside <KingsBoardProvider>",
    );
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function KingsBoardProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Stable refs so hooks don't re-create callbacks on every grid change
  const gridRef = useRef<number[][] | null>(null);
  const NRef = useRef<number>(0);

  const timer = useTimer();

  const onWin = useCallback(() => {
    timer.stopTimer();
  }, [timer]);

  const board = useKingsBoard(gridRef, NRef, onWin);

  const loadPuzzle = useCallback(
    (grid: number[][], N: number) => {
      gridRef.current = grid;
      NRef.current = N;
      board.initBoard(N, grid);
      timer.resetTimer();
    },
    [board, timer],
  );

  // Derived values (computed fresh each render)
  const { cellStates } = board;
  const N = NRef.current;
  const grid = gridRef.current;

  const numKings = useMemo(
    () => cellStates.flat().filter((v) => v === 2).length,
    [cellStates],
  );

  const hasAnyConflict = useMemo(() => {
    if (!grid) return false;
    return cellStates.some((row, r) =>
      row.some((v, c) => v === 2 && calcHasConflict(cellStates, grid, r, c, N)),
    );
  }, [cellStates, grid, N]);

  const territory = useMemo(
    () => (N > 0 ? calcTerritory(cellStates, N) : []),
    [cellStates, N],
  );

  const showHint = useCallback(
    (solution: [number, number][]) => {
      for (const [r, c] of solution) {
        if (cellStates[r]?.[c] !== 2) {
          const el = document.querySelector(
            `[data-board-cell="${r}-${c}"]`,
          ) as HTMLElement | null;
          if (el) {
            el.style.boxShadow = "0 0 0 3px rgba(201,168,76,0.8)";
            setTimeout(() => {
              el.style.boxShadow = "";
            }, 1200);
          }
          return;
        }
      }
    },
    [cellStates],
  );

  const value = useMemo<KingsBoardContextValue>(
    () => ({
      ...board,
      grid,
      N,
      numKings,
      hasAnyConflict,
      territory,
      elapsed: timer.elapsed,
      startTimer: timer.startTimer,
      stopTimer: timer.stopTimer,
      resetTimer: timer.resetTimer,
      showHint,
      loadPuzzle,
    }),
    [
      board,
      grid,
      N,
      numKings,
      hasAnyConflict,
      territory,
      timer,
      showHint,
      loadPuzzle,
    ],
  );

  return (
    <KingsBoardContext.Provider value={value}>
      {children}
    </KingsBoardContext.Provider>
  );
}
