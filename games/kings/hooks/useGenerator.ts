"use client";

import { useState, useCallback } from "react";
import { PuzzleParams, GenerateResult, getParamsByLevel } from "../lib/index";
import {
  DIFF_TIERS,
  generateByLevel,
  generateByTierIdx,
  getParamsByTierIdx,
} from "../lib/index";
import { diffScoreToTierIdx, levelToDiffScore } from "@/shared/algorithms";

export type GeneratorMode = "level" | "diff";

export interface GeneratedPuzzle {
  grid: number[][];
  solution: [number, number][];
  N: number;
  diffScore: number;
  tierIdx: number;
  params: PuzzleParams;
}

export interface UseGeneratorReturn {
  mode: GeneratorMode;
  setMode: (m: GeneratorMode) => void;
  currentLevel: number;
  setCurrentLevel: (l: number) => void;
  selectedTier: number;
  setSelectedTier: (t: number) => void;
  generating: boolean;
  puzzle: GeneratedPuzzle | null;
  generate: () => void;
}

export function useGenerator(): UseGeneratorReturn {
  const [mode, setMode] = useState<GeneratorMode>("level");
  const [currentLevel, setCurrentLevel] = useState(1);
  const [selectedTier, setSelectedTier] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [puzzle, setPuzzle] = useState<GeneratedPuzzle | null>(null);

  const generate = useCallback(() => {
    setGenerating(true);
    setTimeout(() => {
      const diffScore: number =
        mode === "level"
          ? levelToDiffScore(currentLevel)
          : DIFF_TIERS[selectedTier].diffScore;

      const params =
        mode === "level"
          ? getParamsByLevel(currentLevel)
          : getParamsByTierIdx(selectedTier);

      const result: GenerateResult | null =
        mode === "level"
          ? generateByLevel(currentLevel)
          : generateByTierIdx(selectedTier);

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
        tierIdx: diffScoreToTierIdx(diffScore, DIFF_TIERS.length),
        params,
      });
    }, 50);
  }, [mode, currentLevel, selectedTier]);

  return {
    mode,
    setMode,
    currentLevel,
    setCurrentLevel,
    selectedTier,
    setSelectedTier,
    generating,
    puzzle,
    generate,
  };
}
