"use client";

import { useState, useCallback, useEffect } from "react";
import type { SolState } from "../types";

export type StatusType = "edit" | "ok" | "err" | "solve";

export interface SolverStatus {
  type: StatusType;
  msg: string;
}

export interface UseSolverReturn {
  N: number;
  sizeInput: number;
  setSizeInput: (n: number) => void;
  grid: number[][];
  solution: SolState[][];
  hasSolution: boolean;
  activeRegion: number;
  setActiveRegion: (r: number) => void;
  painting: boolean;
  setPainting: (v: boolean) => void;
  erasing: boolean;
  setErasing: (v: boolean) => void;
  status: SolverStatus;
  solveLog: string;
  winDetail: string;
  showWin: boolean;
  use3x3: boolean;
  setUse3x3: (v: boolean) => void;
  exportText: string;
  solving: boolean;
  buildGrid: (n?: number, keepData?: boolean) => void;
  paintCell: (r: number, c: number) => void;
  eraseCell: (r: number, c: number) => void;
  clearSolution: () => void;
  fillFlood: () => void;
  loadExample: () => void;
  solve: () => void;
  validateRegions: () => boolean;
  exportJSON: () => void;
  copyCode: () => void;
}

const EXAMPLE_GRID: number[][] = [
  [0,0,0,1,1,1,1],
  [0,0,2,2,1,1,1],
  [0,2,2,3,3,1,4],
  [5,2,3,3,4,4,4],
  [5,5,3,6,4,4,4],
  [5,5,6,6,6,4,4],
  [5,5,6,6,6,6,6],
];

export function useSolver(): UseSolverReturn {
  const [N, setN] = useState(6);
  const [sizeInput, setSizeInput] = useState(6);
  const [grid, setGrid] = useState<number[][]>(() => Array.from({ length: 6 }, () => Array(6).fill(-1)));
  const [solution, setSolution] = useState<SolState[][]>(() => Array.from({ length: 6 }, () => Array(6).fill("")));
  const [hasSolution, setHasSolution] = useState(false);
  const [activeRegion, setActiveRegion] = useState(0);
  const [painting, setPainting] = useState(false);
  const [erasing, setErasing] = useState(false);
  const [status, setStatus] = useState<SolverStatus>({ type: "edit", msg: "Draw regions on the grid above" });
  const [solveLog, setSolveLog] = useState("");
  const [winDetail, setWinDetail] = useState("");
  const [showWin, setShowWin] = useState(false);
  const [use3x3, setUse3x3] = useState(true);
  const [exportText, setExportText] = useState("");
  const [solving, setSolving] = useState(false);

  // Release mouse paint/erase on mouseup
  useEffect(() => {
    const up = () => { setPainting(false); setErasing(false); };
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, []);

  const buildGrid = useCallback((n?: number, keepData?: boolean) => {
    const size = n ?? N;
    if (!keepData) setGrid(Array.from({ length: size }, () => Array(size).fill(-1)));
    setSolution(Array.from({ length: size }, () => Array(size).fill("")));
    setHasSolution(false);
    setShowWin(false);
    setSolveLog("");
    setStatus({ type: "edit", msg: "Draw regions on the grid" });
    if (n !== undefined) setN(n);
  }, [N]);

  const clearSolution = useCallback(() => {
    setSolution(Array.from({ length: N }, () => Array(N).fill("")));
    setHasSolution(false);
    setShowWin(false);
    setSolveLog("");
  }, [N]);

  const paintCell = useCallback((r: number, c: number) => {
    if (hasSolution) clearSolution();
    setGrid(prev => {
      const next = prev.map(row => [...row]);
      next[r][c] = activeRegion;
      return next;
    });
  }, [hasSolution, activeRegion, clearSolution]);

  const eraseCell = useCallback((r: number, c: number) => {
    if (hasSolution) clearSolution();
    setGrid(prev => {
      const next = prev.map(row => [...row]);
      next[r][c] = -1;
      return next;
    });
  }, [hasSolution, clearSolution]);

  const validateRegions = useCallback((): boolean => {
    const regs = new Set<number>();
    let unassigned = 0;
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++) {
        if (grid[r][c] === -1) unassigned++;
        else regs.add(grid[r][c]);
      }
    if (unassigned > 0) {
      setStatus({ type: "err", msg: `${unassigned} unassigned cell(s) — paint all cells first` });
      return false;
    }
    if (regs.size !== N) {
      setStatus({ type: "err", msg: `${regs.size} region(s) found but need exactly ${N}` });
      return false;
    }
    setStatus({ type: "ok", msg: `✓ ${regs.size} regions on ${N}×${N} grid — ready to solve` });
    return true;
  }, [N, grid]);

  const solve = useCallback(() => {
    if (!validateRegions()) return;
    clearSolution();
    setStatus({ type: "solve", msg: "Solving…" });
    setSolveLog("Running backtracker…");
    setSolving(true);

    setTimeout(() => {
      const regs = [...new Set(grid.flat())].sort((a, b) => a - b);
      const regionCells: Record<number, [number, number][]> = {};
      regs.forEach(r => { regionCells[r] = []; });
      for (let r = 0; r < N; r++)
        for (let c = 0; c < N; c++)
          regionCells[grid[r][c]].push([r, c]);

      const kings: [number, number][] = [];
      const usedRow = new Set<number>(), usedCol = new Set<number>(), usedReg = new Set<number>();

      function conflicts(r: number, c: number) {
        if (usedRow.has(r) || usedCol.has(c) || usedReg.has(grid[r][c])) return true;
        if (use3x3)
          for (const [kr, kc] of kings)
            if (Math.abs(kr - r) <= 1 && Math.abs(kc - c) <= 1) return true;
        return false;
      }

      let calls = 0;
      function bt(regIdx: number): boolean {
        calls++;
        if (regIdx === regs.length) return true;
        const reg = regs[regIdx];
        for (const [r, c] of regionCells[reg]) {
          if (!conflicts(r, c)) {
            kings.push([r, c]); usedRow.add(r); usedCol.add(c); usedReg.add(reg);
            if (bt(regIdx + 1)) return true;
            kings.pop(); usedRow.delete(r); usedCol.delete(c); usedReg.delete(reg);
          }
        }
        return false;
      }

      const t0 = performance.now();
      const found = bt(0);
      const ms = (performance.now() - t0).toFixed(1);

      setSolving(false);
      if (!found) {
        setStatus({ type: "err", msg: "No solution found — check your regions" });
        setSolveLog(`Explored ${calls} states in ${ms}ms`);
        return;
      }

      const newSol: SolState[][] = Array.from({ length: N }, () => Array(N).fill(""));
      for (const [r, c] of kings) {
        newSol[r][c] = "king";
        if (use3x3) {
          for (let dr = -1; dr <= 1; dr++)
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const nr = r + dr, nc = c + dc;
              if (nr >= 0 && nr < N && nc >= 0 && nc < N && newSol[nr][nc] === "")
                newSol[nr][nc] = "territory";
            }
        }
        for (let i = 0; i < N; i++) {
          if (newSol[r][i] === "") newSol[r][i] = "blocked";
          if (newSol[i][c] === "") newSol[i][c] = "blocked";
        }
      }

      setSolution(newSol);
      setHasSolution(true);
      setStatus({ type: "ok", msg: `✓ Solved! ${kings.length} kings placed` });
      setSolveLog(`${calls} states explored · ${ms}ms`);
      setWinDetail(`${N}×${N} grid · ${use3x3 ? "3×3 territory" : "no territory"} · ${calls} states · ${ms}ms`);
      setShowWin(true);
    }, 30);
  }, [N, grid, use3x3, validateRegions, clearSolution]);

  const fillFlood = useCallback(() => {
    let nextReg = 0;
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++)
        if (grid[r][c] !== -1) nextReg = Math.max(nextReg, grid[r][c] + 1);

    const newGrid = grid.map(row => [...row]);
    const visited = Array.from({ length: N }, () => Array(N).fill(false));
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++) {
        if (newGrid[r][c] === -1 && !visited[r][c]) {
          const fill = nextReg++;
          const q: [number, number][] = [[r, c]];
          visited[r][c] = true;
          while (q.length) {
            const [cr, cc] = q.shift()!;
            newGrid[cr][cc] = fill;
            for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]] as [number,number][]) {
              const nr = cr + dr, nc = cc + dc;
              if (nr >= 0 && nr < N && nc >= 0 && nc < N && newGrid[nr][nc] === -1 && !visited[nr][nc]) {
                visited[nr][nc] = true;
                q.push([nr, nc]);
              }
            }
          }
        }
      }
    setGrid(newGrid);
  }, [N, grid]);

  const loadExample = useCallback(() => {
    const n = 7;
    setSizeInput(n);
    setN(n);
    setGrid(EXAMPLE_GRID.map(r => [...r]));
    setSolution(Array.from({ length: n }, () => Array(n).fill("")));
    setHasSolution(false);
    setShowWin(false);
    setStatus({ type: "ok", msg: "7×7 example loaded — click Solve!" });
    setSolveLog("");
  }, []);

  const exportJSON = useCallback(() => {
    setExportText(JSON.stringify({ size: N, regions: grid }, null, 2));
  }, [N, grid]);

  const copyCode = useCallback(() => {
    const rows = grid.map(r => "[" + r.join(",") + "]").join(",\n  ");
    const code = `regions: [\n  ${rows}\n]`;
    navigator.clipboard.writeText(code).catch(() => {});
    setExportText(code);
  }, [grid]);

  return {
    N, sizeInput, setSizeInput,
    grid, solution, hasSolution,
    activeRegion, setActiveRegion,
    painting, setPainting,
    erasing, setErasing,
    status, solveLog, winDetail, showWin,
    use3x3, setUse3x3,
    exportText, solving,
    buildGrid, paintCell, eraseCell,
    clearSolution, fillFlood, loadExample,
    solve, validateRegions,
    exportJSON, copyCode,
  };
}
