"use client";

import { useState, useCallback } from "react";
import type { CellState } from "../types";

// Module-level map — avoids "cannot access ref during render" lint error
const pendingClicks = new Map<string, ReturnType<typeof setTimeout>>();

// ─── Pure helpers (no hooks, no side effects) ─────────────────────────────────

export function calcHasConflict(
  states: CellState[][],
  grid: number[][],
  r: number,
  c: number,
  N: number
): boolean {
  const reg = grid[r][c];
  for (let i = 0; i < N; i++)
    for (let j = 0; j < N; j++) {
      if (i === r && j === c) continue;
      if (states[i][j] === 2) {
        if (i === r || j === c || grid[i][j] === reg) return true;
        if (Math.abs(i - r) <= 1 && Math.abs(j - c) <= 1) return true;
      }
    }
  return false;
}

export function calcAutoLocked(
  states: CellState[][],
  grid: number[][],
  N: number
): boolean[][] {
  const locked = Array.from({ length: N }, () => Array(N).fill(false));
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++) {
      if (states[r][c] === 2) {
        const reg = grid[r][c];
        for (let i = 0; i < N; i++)
          for (let j = 0; j < N; j++) {
            if (states[i][j] !== 2) {
              if (
                i === r || j === c || grid[i][j] === reg ||
                (Math.abs(i - r) <= 1 && Math.abs(j - c) <= 1)
              )
                locked[i][j] = true;
            }
          }
      }
    }
  return locked;
}

export function calcTerritory(states: CellState[][], N: number): boolean[][] {
  const terr = Array.from({ length: N }, () => Array(N).fill(false));
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++)
      if (states[r]?.[c] === 2)
        for (let dr = -1; dr <= 1; dr++)
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < N && nc >= 0 && nc < N) terr[nr][nc] = true;
          }
  return terr;
}

export function calcCheckWin(
  states: CellState[][],
  grid: number[][],
  N: number
): boolean {
  const kings: [number, number][] = [];
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++)
      if (states[r][c] === 2) kings.push([r, c]);
  if (kings.length !== N) return false;
  for (const [r, c] of kings)
    if (calcHasConflict(states, grid, r, c, N)) return false;
  return true;
}

// ─── Board snapshot type ──────────────────────────────────────────────────────

export interface BoardSnapshot {
  states: CellState[][];
  locked: boolean[][];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface KingsBoardState {
  cellStates: CellState[][];
  autoLocked: boolean[][];
  moveHistory: BoardSnapshot[];
  won: boolean;
}

export interface KingsBoardActions {
  initBoard: (N: number, grid: number[][]) => void;
  handleLeftClick: (r: number, c: number) => void;
  handleDoubleClick: (r: number, c: number) => void;
  handleRightClick: (e: React.MouseEvent, r: number, c: number) => void;
  undo: () => void;
  clearMarks: () => void;
  resetBoard: () => void;
}

export function useKingsBoard(
  gridRef: { current: number[][] | null },
  NRef: { current: number },
  onWin: () => void
): KingsBoardState & KingsBoardActions {
  const [cellStates, setCellStates] = useState<CellState[][]>([]);
  const [autoLocked, setAutoLocked] = useState<boolean[][]>([]);
  const [moveHistory, setMoveHistory] = useState<BoardSnapshot[]>([]);
  const [won, setWon] = useState(false);

  const pushHistory = useCallback((states: CellState[][], locked: boolean[][]) => {
    setMoveHistory(h => [
      ...h.slice(-79),
      { states: states.map(r => [...r] as CellState[]), locked: locked.map(r => [...r]) },
    ]);
  }, []);

  const initBoard = useCallback((N: number, grid: number[][]) => {
    setCellStates(Array.from({ length: N }, () => Array(N).fill(0) as CellState[]));
    setAutoLocked(Array.from({ length: N }, () => Array(N).fill(false)));
    setMoveHistory([]);
    setWon(false);
  }, []);

  const placeKing = useCallback((r: number, c: number) => {
    const grid = gridRef.current;
    const N = NRef.current;
    if (!grid) return;

    setCellStates(prev => {
      pushHistory(prev, autoLocked);
      const next = prev.map(row => [...row] as CellState[]);
      next[r][c] = 2;
      const nl = calcAutoLocked(next, grid, N);
      setAutoLocked(nl);
      if (calcCheckWin(next, grid, N)) {
        setWon(true);
        onWin();
      }
      return next;
    });
  }, [gridRef, NRef, autoLocked, pushHistory, onWin]);

  const removeCell = useCallback((r: number, c: number) => {
    const grid = gridRef.current;
    const N = NRef.current;
    if (!grid) return;

    setCellStates(prev => {
      pushHistory(prev, autoLocked);
      const next = prev.map(row => [...row] as CellState[]);
      next[r][c] = 0;
      setAutoLocked(calcAutoLocked(next, grid, N));
      return next;
    });
  }, [gridRef, NRef, autoLocked, pushHistory]);

  const handleLeftClick = useCallback((r: number, c: number) => {
    if (autoLocked[r]?.[c] && cellStates[r]?.[c] === 0) return;
    const cur = cellStates[r]?.[c];
    if (cur === 1 || cur === 2) { removeCell(r, c); return; }

    const key = `${r},${c}`;
    clearTimeout(pendingClicks.get(key));
    pendingClicks.set(key, setTimeout(() => {
      pendingClicks.delete(key);
      setCellStates(prev => {
        if (prev[r]?.[c] !== 0) return prev;
        setMoveHistory(h => [
          ...h.slice(-79),
          { states: prev.map(row => [...row] as CellState[]), locked: autoLocked.map(r => [...r]) },
        ]);
        const next = prev.map(row => [...row] as CellState[]);
        next[r][c] = 1;
        return next;
      });
    }, 220));
  }, [autoLocked, cellStates, removeCell]);

  const handleDoubleClick = useCallback((r: number, c: number) => {
    const key = `${r},${c}`;
    clearTimeout(pendingClicks.get(key));
    pendingClicks.delete(key);
    if (autoLocked[r]?.[c] && cellStates[r]?.[c] === 0) return;
    if (cellStates[r]?.[c] === 2) { removeCell(r, c); return; }
    if (cellStates[r]?.[c] === 1) {
      setCellStates(prev => {
        const next = prev.map(r => [...r] as CellState[]);
        next[r][c] = 0;
        return next;
      });
    }
    placeKing(r, c);
  }, [autoLocked, cellStates, removeCell, placeKing]);

  const handleRightClick = useCallback((e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (autoLocked[r]?.[c] && cellStates[r]?.[c] === 0) return;
    if (cellStates[r]?.[c] === 2) { removeCell(r, c); return; }
    if (cellStates[r]?.[c] === 1) {
      setCellStates(prev => {
        const next = prev.map(r => [...r] as CellState[]);
        next[r][c] = 0;
        return next;
      });
    }
    placeKing(r, c);
  }, [autoLocked, cellStates, removeCell, placeKing]);

  const undo = useCallback(() => {
    if (!moveHistory.length) return;
    const snap = moveHistory[moveHistory.length - 1];
    setMoveHistory(h => h.slice(0, -1));
    setCellStates(snap.states.map(r => [...r] as CellState[]));
    setAutoLocked(snap.locked.map(r => [...r]));
  }, [moveHistory]);

  const clearMarks = useCallback(() => {
    setMoveHistory(h => [
      ...h.slice(-79),
      { states: cellStates.map(r => [...r] as CellState[]), locked: autoLocked.map(r => [...r]) },
    ]);
    setCellStates(prev => prev.map(row => row.map(v => (v === 1 ? 0 : v)) as CellState[]));
  }, [cellStates, autoLocked]);

  const resetBoard = useCallback(() => {
    const N = NRef.current;
    setCellStates(Array.from({ length: N }, () => Array(N).fill(0) as CellState[]));
    setAutoLocked(Array.from({ length: N }, () => Array(N).fill(false)));
    setMoveHistory([]);
    setWon(false);
  }, [NRef]);

  return {
    cellStates, autoLocked, moveHistory, won,
    initBoard, handleLeftClick, handleDoubleClick, handleRightClick,
    undo, clearMarks, resetBoard,
  };
}
