"use client";

import { useState, useEffect, useRef } from "react";
import type { CellValue, MamboPuzzle } from "../types";

export interface ErrorState {
  errorCells: Set<number>;
  completedRows: Set<number>;
  completedCols: Set<number>;
}

/**
 * Computes error cells, completed rows, and completed columns.
 * Debounced by 1.2 s so rapid taps don't flash red mid-cycle.
 */
export function useErrorCells(
  userGrid: CellValue[][] | null,
  puzzle: MamboPuzzle | null,
  active: boolean,
): ErrorState {
  const [errorCells,    setErrorCells]    = useState<Set<number>>(new Set());
  const [completedRows, setCompletedRows] = useState<Set<number>>(new Set());
  const [completedCols, setCompletedCols] = useState<Set<number>>(new Set());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!active || !puzzle || !userGrid) {
      setErrorCells(new Set());
      setCompletedRows(new Set());
      setCompletedCols(new Set());
      return;
    }

    if (timer.current) clearTimeout(timer.current);

    timer.current = setTimeout(() => {
      const { size, constraints } = puzzle;
      const half = size / 2;
      const errs  = new Set<number>();
      const doneR = new Set<number>();
      const doneC = new Set<number>();

      // ── Row checks ──
      for (let r = 0; r < size; r++) {
        const row   = userGrid[r];
        const suns  = row.filter((v) => v === 1).length;
        const moons = row.filter((v) => v === 2).length;

        if (row.every((v) => v !== 0) && suns === half && moons === half)
          doneR.add(r);

        // Over-quota
        if (suns  > half) row.forEach((v, c) => { if (v === 1) errs.add(r * size + c); });
        if (moons > half) row.forEach((v, c) => { if (v === 2) errs.add(r * size + c); });

        // 3 in a row
        for (let c = 0; c <= size - 3; c++)
          if (row[c] && row[c] === row[c + 1] && row[c + 1] === row[c + 2]) {
            errs.add(r * size + c);
            errs.add(r * size + c + 1);
            errs.add(r * size + c + 2);
          }
      }

      // ── Col checks ──
      for (let c = 0; c < size; c++) {
        const col   = userGrid.map((row) => row[c]);
        const suns  = col.filter((v) => v === 1).length;
        const moons = col.filter((v) => v === 2).length;

        if (col.every((v) => v !== 0) && suns === half && moons === half)
          doneC.add(c);

        if (suns  > half) col.forEach((v, r) => { if (v === 1) errs.add(r * size + c); });
        if (moons > half) col.forEach((v, r) => { if (v === 2) errs.add(r * size + c); });

        for (let r = 0; r <= size - 3; r++)
          if (col[r] && col[r] === col[r + 1] && col[r + 1] === col[r + 2]) {
            errs.add(r * size + c);
            errs.add((r + 1) * size + c);
            errs.add((r + 2) * size + c);
          }
      }

      // ── Constraint violations ──
      for (const cn of constraints) {
        const a = userGrid[cn.r1][cn.c1];
        const b = userGrid[cn.r2][cn.c2];
        if (a && b) {
          if (cn.type === "=" && a !== b) {
            errs.add(cn.r1 * size + cn.c1);
            errs.add(cn.r2 * size + cn.c2);
          }
          if (cn.type === "x" && a === b) {
            errs.add(cn.r1 * size + cn.c1);
            errs.add(cn.r2 * size + cn.c2);
          }
        }
      }

      setErrorCells(errs);
      setCompletedRows(doneR);
      setCompletedCols(doneC);
    }, 1200);

    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [userGrid, puzzle, active]);

  return { errorCells, completedRows, completedCols };
}
