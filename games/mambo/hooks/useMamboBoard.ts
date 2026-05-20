"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { CellValue, MamboPuzzle } from "../types";
import { checkWin } from "../lib/puzzle";

export interface MamboBoardState {
  userGrid: CellValue[][];
  status: "playing" | "won";
  elapsed: number;
  showSol: boolean;
}

export interface MamboBoardActions {
  handleCellClick: (r: number, c: number) => void;
  togglePeek: () => void;
  resetBoard: () => void;
}

export function useMamboBoard(puzzle: MamboPuzzle): MamboBoardState & MamboBoardActions {
  const [userGrid, setUserGrid] = useState<CellValue[][]>(() =>
    puzzle.puzzle.map((r) => [...r]),
  );
  const [status,  setStatus]  = useState<"playing" | "won">("playing");
  const [elapsed, setElapsed] = useState(0);
  const [showSol, setShowSol] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(Date.now());

  // Start timer on mount
  useEffect(() => {
    startRef.current = Date.now();
    timerRef.current = setInterval(
      () => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)),
      1000,
    );
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Reset everything when puzzle changes (next puzzle flow)
  useEffect(() => {
    setUserGrid(puzzle.puzzle.map((r) => [...r]));
    setStatus("playing");
    setElapsed(0);
    setShowSol(false);
    if (timerRef.current) clearInterval(timerRef.current);
    startRef.current = Date.now();
    timerRef.current = setInterval(
      () => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)),
      1000,
    );
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [puzzle]);

  const handleCellClick = useCallback(
    (r: number, c: number) => {
      if (status !== "playing" || showSol) return;
      // Locked cells (pre-filled in puzzle) cannot be changed
      if (puzzle.puzzle[r][c] !== 0) return;

      setUserGrid((prev) => {
        const ng = prev.map((row) => [...row]) as CellValue[][];
        ng[r][c] = ((ng[r][c] + 1) % 3) as CellValue;

        if (checkWin(ng, puzzle)) {
          if (timerRef.current) clearInterval(timerRef.current);
          setStatus("won");
        }
        return ng;
      });
    },
    [status, showSol, puzzle],
  );

  const togglePeek = useCallback(() => setShowSol((s) => !s), []);

  const resetBoard = useCallback(() => {
    setUserGrid(puzzle.puzzle.map((r) => [...r]));
    setStatus("playing");
    setElapsed(0);
    setShowSol(false);
    if (timerRef.current) clearInterval(timerRef.current);
    startRef.current = Date.now();
    timerRef.current = setInterval(
      () => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)),
      1000,
    );
  }, [puzzle]);

  return { userGrid, status, elapsed, showSol, handleCellClick, togglePeek, resetBoard };
}
