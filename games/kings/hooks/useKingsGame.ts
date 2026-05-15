// hooks/useKingGame.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  mkRng,
  seedFromDiff,
  seedFromLevel,
  generateRegions,
  diffScoreToParams,
  levelToDiffScore,
  diffScoreToTierIdx,
  PuzzleParams,
} from "../core/utils";
import { DIFF_TIERS } from "../core/const";
import { CellState, GenerateResult } from "../core/types";

export interface GeneratedPuzzle {
  grid: number[][];
  solution: [number, number][];
  N: number;
  diffScore: number;
  tierIdx: number;
  params: PuzzleParams;
}

export type KingGameContextType = ReturnType<typeof useKingGame>;

const pendingClicks = new Map<string, ReturnType<typeof setTimeout>>();

export function useKingGame() {
  const [mode, setMode] = useState<"level" | "diff">("level");
  const [currentLevel, setCurrentLevel] = useState(1);
  const [selectedTier, setSelectedTier] = useState(0);
  const [generating, setGenerating] = useState(false);

  // Game state
  const [currentGrid, setCurrentGrid] = useState<number[][] | null>(null);
  const [currentSolution, setCurrentSolution] = useState<
    [number, number][] | null
  >(null);
  const [currentN, setCurrentN] = useState(0);

  const [currentTierIdx, setCurrentTierIdx] = useState(0);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [puzzle, setPuzzle] = useState<GeneratedPuzzle | null>(null);

  const [cellStates, setCellStates] = useState<CellState[][]>([]);
  const [autoLocked, setAutoLocked] = useState<boolean[][]>([]);
  const [moveHistory, setMoveHistory] = useState<
    { states: CellState[][]; locked: boolean[][] }[]
  >([]);
  const [won, setWon] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const startRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (running) {
      timerRef.current = setInterval(
        () => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)),
        1000,
      );
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running]);

  const tierIdx = diffScoreToTierIdx(levelToDiffScore(currentLevel));
  const tier = DIFF_TIERS[tierIdx];

  function levelPct(l: number) {
    return Math.min(99, (Math.log(l + 1) / Math.log(10000)) * 100);
  }

  const generate = useCallback(() => {
    setGenerating(true);
    setTimeout(() => {
      let diffScore: number;
      let seed: number;

      if (mode === "level") {
        diffScore = levelToDiffScore(currentLevel);
        seed = seedFromLevel(currentLevel);
      } else {
        diffScore = DIFF_TIERS[selectedTier].diffScore;
        seed = seedFromDiff(selectedTier, Date.now());
      }

      const rng = mkRng(seed);
      const params = diffScoreToParams(diffScore, rng);
      const result: GenerateResult | null = generateRegions(
        params.N,
        rng,
        params.compactness,
        params.sizeVariance,
      );

      setGenerating(false);
      if (!result) {
        alert("Generation failed — try again.");
        return;
      }

      setPuzzle({
        grid: result.grid,
        solution: result.solution,
        N: params.N,
        diffScore,
        tierIdx: diffScoreToTierIdx(diffScore),
        params,
      });

      setCurrentGrid(result.grid);
      setCurrentSolution(result.solution);
      setCurrentN(params.N);
      setAutoLocked(
        recalcAuto(
          Array.from(
            { length: params.N },
            () => Array(params.N).fill(0) as CellState[],
          ),
          result.grid,
          params.N,
        ),
      );
      setWon(false);
      setRunning(true);
      setElapsed(0);
      startRef.current = Date.now();
    }, 50);
  }, [mode, currentLevel, selectedTier]);

  function hasConflict(
    states: CellState[][],
    g: number[][],
    r: number,
    c: number,
    n: number,
  ) {
    const reg = g[r][c];
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        if (i === r && j === c) continue;
        if (states[i][j] === 2) {
          if (i === r || j === c || g[i][j] === reg) return true;
          if (Math.abs(i - r) <= 1 && Math.abs(j - c) <= 1) return true;
        }
      }
    return false;
  }

  function recalcAuto(states: CellState[][], g: number[][], n: number) {
    const locked = Array.from({ length: n }, () => Array(n).fill(false));
    for (let r = 0; r < n; r++)
      for (let c = 0; c < n; c++) {
        if (states[r][c] === 2) {
          const reg = g[r][c];
          for (let i = 0; i < n; i++)
            for (let j = 0; j < n; j++) {
              if (states[i][j] !== 2) {
                if (
                  i === r ||
                  j === c ||
                  g[i][j] === reg ||
                  (Math.abs(i - r) <= 1 && Math.abs(j - c) <= 1)
                )
                  locked[i][j] = true;
              }
            }
        }
      }
    return locked;
  }

  function checkWin(states: CellState[][], g: number[][], n: number) {
    const kings: [number, number][] = [];
    for (let r = 0; r < n; r++)
      for (let c = 0; c < n; c++) if (states[r][c] === 2) kings.push([r, c]);
    if (kings.length !== n) return false;
    for (const [r, c] of kings)
      if (hasConflict(states, g, r, c, n)) return false;
    return true;
  }

  function doPlaceKing(r: number, c: number) {
    if (!currentGrid) return;
    setCellStates((prev) => {
      setMoveHistory((h) => [
        ...h.slice(-79),
        {
          states: prev.map((row) => [...row] as CellState[]),
          locked: autoLocked.map((row) => [...row]),
        },
      ]);
      const next = prev.map((row) => [...row] as CellState[]);
      next[r][c] = 2;
      const nl = recalcAuto(next, currentGrid, currentN);
      setAutoLocked(nl);
      if (checkWin(next, currentGrid, currentN)) {
        setWon(true);
        setRunning(false);
      }
      return next;
    });
  }

  function handleLeft(r: number, c: number) {
    if (!currentGrid) return;
    if (autoLocked[r][c] && cellStates[r][c] === 0) return;
    const cur = cellStates[r][c];
    if (cur === 1 || cur === 2) {
      setMoveHistory((h) => [
        ...h.slice(-79),
        {
          states: cellStates.map((row) => [...row] as CellState[]),
          locked: autoLocked.map((row) => [...row]),
        },
      ]);
      setCellStates((prev) => {
        const n = prev.map((r) => [...r] as CellState[]);
        n[r][c] = 0;
        setAutoLocked(recalcAuto(n, currentGrid!, currentN));
        return n;
      });
      return;
    }
    const key = `${r},${c}`;
    clearTimeout(pendingClicks.get(key));
    pendingClicks.set(
      key,
      setTimeout(() => {
        pendingClicks.delete(key);
        setCellStates((prev) => {
          if (prev[r][c] !== 0) return prev;
          setMoveHistory((h) => [
            ...h.slice(-79),
            {
              states: prev.map((row) => [...row] as CellState[]),
              locked: autoLocked.map((row) => [...row]),
            },
          ]);
          const n = prev.map((r) => [...r] as CellState[]);
          n[r][c] = 1;
          return n;
        });
      }, 220),
    );
  }

  function handleDbl(r: number, c: number) {
    if (!currentGrid) return;
    const key = `${r},${c}`;
    clearTimeout(pendingClicks.get(key));
    pendingClicks.delete(key);
    if (autoLocked[r][c] && cellStates[r][c] === 0) return;
    if (cellStates[r][c] === 2) {
      setMoveHistory((h) => [
        ...h.slice(-79),
        {
          states: cellStates.map((row) => [...row] as CellState[]),
          locked: autoLocked.map((row) => [...row]),
        },
      ]);
      setCellStates((prev) => {
        const n = prev.map((r) => [...r] as CellState[]);
        n[r][c] = 0;
        setAutoLocked(recalcAuto(n, currentGrid!, currentN));
        return n;
      });
      return;
    }
    if (cellStates[r][c] === 1)
      setCellStates((prev) => {
        const n = prev.map((r) => [...r] as CellState[]);
        n[r][c] = 0;
        return n;
      });
    doPlaceKing(r, c);
  }

  function handleRight(e: React.MouseEvent, r: number, c: number) {
    e.preventDefault();
    if (!currentGrid) return;
    if (autoLocked[r][c] && cellStates[r][c] === 0) return;
    if (cellStates[r][c] === 2) {
      setMoveHistory((h) => [
        ...h.slice(-79),
        {
          states: cellStates.map((row) => [...row] as CellState[]),
          locked: autoLocked.map((row) => [...row]),
        },
      ]);
      setCellStates((prev) => {
        const n = prev.map((r) => [...r] as CellState[]);
        n[r][c] = 0;
        setAutoLocked(recalcAuto(n, currentGrid!, currentN));
        return n;
      });
      return;
    }
    if (cellStates[r][c] === 1)
      setCellStates((prev) => {
        const n = prev.map((r) => [...r] as CellState[]);
        n[r][c] = 0;
        return n;
      });
    doPlaceKing(r, c);
  }

  function handleChangeLevel(val: number) {
    setCurrentLevel(val);
    setCurrentTierIdx(diffScoreToTierIdx(levelToDiffScore(val)));
  }

  function undoMove() {
    if (!moveHistory.length) return;
    const s = moveHistory[moveHistory.length - 1];
    setMoveHistory((h) => h.slice(0, -1));
    setCellStates(s.states.map((row) => [...row] as CellState[]));
    setAutoLocked(s.locked.map((row) => [...row]));
  }

  function resetPuzzle() {
    if (!currentGrid) return;
    const n = currentN;
    setCellStates(
      Array.from({ length: n }, () => Array(n).fill(0) as CellState[]),
    );
    setAutoLocked(Array.from({ length: n }, () => Array(n).fill(false)));
    setMoveHistory([]);
    setWon(false);
    setElapsed(0);
    setRunning(true);
    startRef.current = Date.now();
  }

  function clearMarks() {
    setMoveHistory((h) => [
      ...h.slice(-79),
      {
        states: cellStates.map((r) => [...r] as CellState[]),
        locked: autoLocked.map((r) => [...r]),
      },
    ]);
    setCellStates((prev) =>
      prev.map((row) => row.map((v) => (v === 1 ? 0 : v)) as CellState[]),
    );
  }

  function showHint() {
    if (!currentSolution || !currentGrid) return;
    for (const [r, c] of currentSolution) {
      if (cellStates[r]?.[c] !== 2) {
        const el = document.querySelector(
          `[data-gen-cell="${r}-${c}"]`,
        ) as HTMLElement;
        if (el) {
          el.style.boxShadow = "0 0 0 3px rgba(201,168,76,0.8)";
          setTimeout(() => {
            el.style.boxShadow = "";
          }, 1200);
        }
        return;
      }
    }
  }

  const numKings = cellStates.flat().filter((v) => v === 2).length;
  const conflictMap = (() => {
    if (!currentGrid || !currentN) return [] as boolean[][];
    const map = Array.from({ length: currentN }, () =>
      Array(currentN).fill(false),
    );

    for (let r = 0; r < currentN; r++) {
      for (let c = 0; c < currentN; c++) {
        if (cellStates[r][c] === 2) {
          map[r][c] = hasConflict(cellStates, currentGrid, r, c, currentN);
        }
      }
    }

    return map;
  })();

  const hasAnyConflict = conflictMap.some((row) => row.some(Boolean));

  const territory = currentGrid
    ? Array.from({ length: currentN }, () => Array(currentN).fill(false))
    : [];
  if (currentGrid) {
    for (let r = 0; r < currentN; r++)
      for (let c = 0; c < currentN; c++) {
        if (cellStates[r]?.[c] === 2) {
          for (let dr = -1; dr <= 1; dr++)
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const nr = r + dr,
                nc = c + dc;
              if (nr >= 0 && nr < currentN && nc >= 0 && nc < currentN)
                territory[nr][nc] = true;
            }
        }
      }
  }

  const cellPx = currentGrid
    ? Math.max(30, Math.min(56, Math.floor(500 / currentN)))
    : 44;

  /*
  ───────────────────────────────────────
  EXPORT
  ───────────────────────────────────────
  */

  return {
    // mode
    mode,
    setMode,

    currentLevel,
    setCurrentLevel,

    selectedTier,
    setSelectedTier,

    generating,

    // tier
    tier,
    tierIdx,
    currentTierIdx,

    // board
    currentGrid,
    currentSolution,
    currentN,
    cellStates,
    autoLocked,
    territory,

    // stats
    numKings,
    conflictMap,
    hasAnyConflict,

    won,
    elapsed,
    moveHistory,

    // sizing
    cellPx,

    // actions
    generate,
    handleLeft,
    handleDbl,
    handleRight,
    handleChangeLevel,
    undoMove,
    resetPuzzle,
    clearMarks,
    showHint,

    // helpers
    levelPct,
    hasConflict,
  };
}
