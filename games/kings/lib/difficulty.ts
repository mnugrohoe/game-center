/**
 * games/kings/lib/difficulty.ts
 *
 * Kings-specific difficulty config.
 * DIFF_TIERS defined ONCE here — not in core/const, not in lib/utils.
 * Extends the shared DiffTier interface with Kings-specific grid bounds.
 */
import type { DiffTier } from "@/shared/types";
import {
  levelToDiffScore,
  diffScoreToTierIdx,
  levelToTierIdx,
  normalizeScore,
  lerp,
  clamp,
} from "@/shared/algorithms/difficulty";
import { mkRng, seedFromDiff, seedFromLevel } from "@/shared/algorithms";

// Re-export shared helpers so game code can import from one place.
export {
  levelToDiffScore,
  diffScoreToTierIdx,
  levelToTierIdx,
  normalizeScore,
  lerp,
  clamp,
};

// ── Kings tier definition ─────────────────────────────────────────────────────

export interface KingsDiffTier extends DiffTier {
  minGrid: number;
  maxGrid: number;
}

export const DIFF_TIERS: KingsDiffTier[] = [
  {
    name: "Initiate",
    icon: "✦",
    diffScore: 1,
    minGrid: 4,
    maxGrid: 5,
    color: "#4a9e6a",
    dim: "#2a5e3a",
    bright: "#7ed4a0",
  },
  {
    name: "Squire",
    icon: "⚔",
    diffScore: 2,
    minGrid: 5,
    maxGrid: 6,
    color: "#5a9e7a",
    dim: "#3a6e4a",
    bright: "#8adaaa",
  },
  {
    name: "Knight",
    icon: "🛡",
    diffScore: 3,
    minGrid: 6,
    maxGrid: 7,
    color: "#4a7abe",
    dim: "#2a4a7e",
    bright: "#8ab4ee",
  },
  {
    name: "Baron",
    icon: "⚜",
    diffScore: 4,
    minGrid: 7,
    maxGrid: 8,
    color: "#7a9a2a",
    dim: "#4a6a10",
    bright: "#b4d45a",
  },
  {
    name: "Lord",
    icon: "👑",
    diffScore: 5,
    minGrid: 7,
    maxGrid: 9,
    color: "#a07a2a",
    dim: "#6a4a10",
    bright: "#d4aa5a",
  },
  {
    name: "King",
    icon: "♚",
    diffScore: 6,
    minGrid: 8,
    maxGrid: 10,
    color: "#9e4a9e",
    dim: "#5e2a6e",
    bright: "#cc80cc",
  },
  {
    name: "Warlord",
    icon: "⚡",
    diffScore: 7,
    minGrid: 9,
    maxGrid: 11,
    color: "#be4a4a",
    dim: "#7e1a1a",
    bright: "#ee8888",
  },
  {
    name: "Champion",
    icon: "🔱",
    diffScore: 8,
    minGrid: 10,
    maxGrid: 12,
    color: "#cc6622",
    dim: "#8a3008",
    bright: "#ff9966",
  },
  {
    name: "Demon",
    icon: "☠",
    diffScore: 9,
    minGrid: 11,
    maxGrid: 13,
    color: "#cc2222",
    dim: "#8a0808",
    bright: "#ff6666",
  },
];

// ── Score → puzzle params ─────────────────────────────────────────────────────

export interface PuzzleParams {
  N: number; /* grid size                            */
  compactness: number; /* 0–1: 1=round blobs, 0=spiky          */
  sizeVariance: number; /* 0–1: 0=equal, 1=wildly unequal       */
  label: string;
}

const LABELS = [
  "Trivial",
  "Very Easy",
  "Easy",
  "Moderate",
  "Medium",
  "Tricky",
  "Hard",
  "Very Hard",
  "Brutal",
];

export function diffScoreToParams(
  score: number,
  rng: () => number,
): PuzzleParams {
  const norm = normalizeScore(score);
  const baseN = lerp(4, 13, norm);
  const N = clamp(Math.round(baseN + (rng() - 0.5) * 1.2), 4, 13);
  const compactness = clamp(lerp(0.9, 0.1, norm), 0.1, 0.95);
  const sizeVariance = clamp(lerp(0.0, 1.0, norm), 0.0, 1.0);
  const label = LABELS[clamp(Math.round(score) - 1, 0, 8)];
  return { N, compactness, sizeVariance, label };
}

export function getParamsByLevel(level: number) {
  const diffScore = levelToDiffScore(level);
  const seed = seedFromLevel(level);
  const rng = mkRng(seed);
  return diffScoreToParams(diffScore, rng);
}
export function getParamsByTierIdx(tierIdx: number) {
  const diffScore = DIFF_TIERS[tierIdx].diffScore;
  const seed = seedFromDiff(tierIdx, Date.now());
  const rng = mkRng(seed);
  return diffScoreToParams(diffScore, rng);
}
