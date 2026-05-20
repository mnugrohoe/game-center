"use client";

import { useState, useCallback, useRef } from "react";
import type { MamboPuzzle, GeneratorMode } from "../types";
import { generateMamboPuzzle } from "../lib/puzzle";
import { levelToTierIdx } from "../lib/difficulty";

export interface UseGeneratorReturn {
  mode: GeneratorMode;
  setMode: (m: GeneratorMode) => void;
  level: number;
  setLevel: (l: number) => void;
  levelInput: string;
  setLevelInput: (s: string) => void;
  diffId: number;
  setDiffId: (d: number) => void;
  puzzle: MamboPuzzle | null;
  /** Per-diff play counters (index = diffId). */
  diffCounters: number[];
  generateByLevel: () => void;
  generateByDiff: () => void;
  generateNext: () => void;
}

export function useGenerator(): UseGeneratorReturn {
  const [mode,       setMode]       = useState<GeneratorMode>("level");
  const [level,      setLevel]      = useState(1);
  const [levelInput, setLevelInput] = useState("1");
  const [diffId,     setDiffId]     = useState(2);
  const [puzzle,     setPuzzle]     = useState<MamboPuzzle | null>(null);

  // Per-diff counters (shown as #N badge on cards)
  const [diffCounters, setDiffCounters] = useState<number[]>(Array(9).fill(0));

  // Internal session counter for level mode
  const levelCounterRef = useRef<Record<number, number>>({});

  function incDiff(id: number) {
    setDiffCounters((prev) => {
      const next = [...prev];
      next[id] = (next[id] ?? 0) + 1;
      return next;
    });
  }

  const generateByLevel = useCallback(() => {
    const lv  = Math.max(1, parseInt(levelInput) || 1);
    setLevel(lv);
    setLevelInput(String(lv));
    const did = levelToTierIdx(lv);
    levelCounterRef.current[lv] = (levelCounterRef.current[lv] ?? 0) + 1;
    const data = generateMamboPuzzle(did);
    data.gameLevel = lv;
    data.levelNum  = levelCounterRef.current[lv];
    setPuzzle(data);
  }, [levelInput]);

  const generateByDiff = useCallback(() => {
    incDiff(diffId);
    const data = generateMamboPuzzle(diffId);
    data.levelNum = diffCounters[diffId] + 1;
    setPuzzle(data);
  }, [diffId, diffCounters]);

  const generateNext = useCallback(() => {
    if (!puzzle) return;

    if (puzzle.gameLevel !== undefined) {
      // level mode → advance one level
      const nextLv = puzzle.gameLevel + 1;
      setLevel(nextLv);
      setLevelInput(String(nextLv));
      const did = levelToTierIdx(nextLv);
      levelCounterRef.current[nextLv] = (levelCounterRef.current[nextLv] ?? 0) + 1;
      const data = generateMamboPuzzle(did);
      data.gameLevel = nextLv;
      data.levelNum  = levelCounterRef.current[nextLv];
      setPuzzle(data);
    } else {
      // diff mode → same diff
      incDiff(puzzle.diffId);
      const data = generateMamboPuzzle(puzzle.diffId);
      data.levelNum = diffCounters[puzzle.diffId] + 1;
      setPuzzle(data);
    }
  }, [puzzle, diffCounters]);

  return {
    mode, setMode,
    level, setLevel,
    levelInput, setLevelInput,
    diffId, setDiffId,
    puzzle, diffCounters,
    generateByLevel,
    generateByDiff,
    generateNext,
  };
}
