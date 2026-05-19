"use client";

import { useState, useCallback } from "react";
import type { PuzzleParams } from "../lib/index";
import {
  DIFF_TIERS,
  levelToDiffScore, diffScoreToParams, diffScoreToTierIdx,
  seedFromLevel, seedFromDiff,
  mkRng, generateKingsRegions,
} from "../lib/index";
import type { GenerateResult } from "../types";

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
      const result: GenerateResult | null = generateKingsRegions(
        params.N, rng, params.compactness, params.sizeVariance
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
    }, 50);
  }, [mode, currentLevel, selectedTier]);

  return {
    mode, setMode,
    currentLevel, setCurrentLevel,
    selectedTier, setSelectedTier,
    generating, puzzle,
    generate,
  };
}
