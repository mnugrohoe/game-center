/**
 * games/shikaku/lib/difficulty.ts
 *
 * Rectangle puzzle difficulty system.
 *
 * Architecture:
 * level
 * → diff score
 * → procedural params
 * → generator
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
import { mkRng } from "@/shared/algorithms";

// ─────────────────────────────────────────────────────────────────────────────
// Re-export shared helpers
// ─────────────────────────────────────────────────────────────────────────────

export {
  levelToDiffScore,
  diffScoreToTierIdx,
  levelToTierIdx,
  normalizeScore,
  lerp,
  clamp,
};

// ─────────────────────────────────────────────────────────────────────────────
// Tier Definition
// ─────────────────────────────────────────────────────────────────────────────

export interface RectDiffTier extends DiffTier {
  minBoard: number;
  maxBoard: number;
}

export const SHIKAKU_TIERS: RectDiffTier[] = [
  {
    name: "Beginner",
    icon: "□",
    diffScore: 1,
    minBoard: 5,
    maxBoard: 6, // diff 2
    color: "#4a9e6a",
    dim: "#2a5e3a",
    bright: "#7ed4a0",
  },

  {
    name: "Easy",
    icon: "▣",
    diffScore: 2,
    minBoard: 7,
    maxBoard: 10, // diff 3
    color: "#5a9e7a",
    dim: "#3a6e4a",
    bright: "#8adaaa",
  },

  {
    name: "Skilled",
    icon: "▤",
    diffScore: 3,
    minBoard: 8,
    maxBoard: 12, // diff 4
    color: "#4a7abe",
    dim: "#2a4a7e",
    bright: "#8ab4ee",
  },

  {
    name: "Advanced",
    icon: "▥",
    diffScore: 4,
    minBoard: 9,
    maxBoard: 14, // diff 5
    color: "#7a9a2a",
    dim: "#4a6a10",
    bright: "#b4d45a",
  },

  {
    name: "Expert",
    icon: "▦",
    diffScore: 5,
    minBoard: 10,
    maxBoard: 16, // diff 6
    color: "#a07a2a",
    dim: "#6a4a10",
    bright: "#d4aa5a",
  },

  {
    name: "Master",
    icon: "▧",
    diffScore: 6,
    minBoard: 12,
    maxBoard: 18, // diff 6
    color: "#9e4a9e",
    dim: "#5e2a6e",
    bright: "#cc80cc",
  },

  {
    name: "Grandmaster",
    icon: "▨",
    diffScore: 7,
    minBoard: 14,
    maxBoard: 20, // diff 6
    color: "#be4a4a",
    dim: "#7e1a1a",
    bright: "#ee8888",
  },

  {
    name: "Legend",
    icon: "◈",
    diffScore: 8,
    minBoard: 16,
    maxBoard: 22, // diff 6
    color: "#cc6622",
    dim: "#8a3008",
    bright: "#ff9966",
  },

  {
    name: "Nightmare",
    icon: "⬢",
    diffScore: 9,
    minBoard: 18,
    maxBoard: 23, // diff 5
    color: "#cc2222",
    dim: "#8a0808",
    bright: "#ff6666",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Puzzle Parameters
// ─────────────────────────────────────────────────────────────────────────────

export interface PuzzleParams {
  width: number;
  height: number;
  rectCount: number;

  /**
   * Minimum rectangle area allowed.
   *
   * Higher:
   * - easier
   * - chunkier regions
   *
   * Lower:
   * - tiny regions
   * - more ambiguity
   */
  minArea: number;

  /**
   * Rectangle shape quality.
   *
   * 1.0 = square-ish
   * 0.0 = long skinny regions
   */
  compactness: number;

  /**
   * Region size variation.
   *
   * 0.0 = uniform sizes
   * 1.0 = chaotic sizes
   */
  sizeVariance: number;

  /**
   * Anchor trickiness.
   *
   * 0.0 = informative anchors
   * 1.0 = misleading anchors
   */
  anchorAmbiguity: number;

  label: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Labels
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Score → Params
// ─────────────────────────────────────────────────────────────────────────────

export function diffScoreToParams(
  score: number,
  rng: () => number,
): PuzzleParams {
  const idx = clamp(Math.round(score) - 1, 0, SHIKAKU_TIERS.length - 1);
  const tier = SHIKAKU_TIERS[idx];
  const maxIdx = SHIKAKU_TIERS.length - 1;

  const getSize = () =>
    clamp(
      Math.round(
        tier.minBoard +
          ((tier.maxBoard - tier.minBoard) * idx) / maxIdx +
          (rng() - 0.5) * 1.5,
      ),
      tier.minBoard,
      tier.maxBoard,
    );

  const boardWidth = getSize();
  const boardHeight = clamp(
    getSize() + Math.round((rng() - 0.5) * 2),
    tier.minBoard,
    tier.maxBoard,
  );

  const boardArea = boardWidth * boardHeight;

  const minArea = 2;
  const compactness = clamp(0.92 - (0.72 * idx) / maxIdx, 0.1, 1.0);
  const sizeVariance = clamp(0.15 + (0.85 * idx) / maxIdx, 0, 1);
  const anchorAmbiguity = clamp(idx / maxIdx, 0, 1);

  const hardLimit = Math.floor(boardArea / minArea);

  // Target average sub-board area: easy ≈ 6, hard ≈ 4
  const targetAvgRectArea = clamp(
    6 - (2 * idx) / maxIdx + (rng() - 0.5) * 0.35,
    4,
    6,
  );

  const minRectCount = Math.max(4, Math.ceil(boardArea / 6));
  const maxRectCount = Math.min(
    LABELS.length,
    hardLimit,
    Math.floor(boardArea / 4),
  );

  const idealRectCount = boardArea / targetAvgRectArea;

  // Slight jitter, but keep average area in the 4–6 range
  const rectCount = clamp(
    Math.round(idealRectCount * (0.9 + (rng() - 0.5) * 0.2)),
    minRectCount,
    maxRectCount,
  );

  const density = rectCount / boardArea;

  const adjustedCompactness = clamp(
    compactness * (1.0 - density * 0.18),
    0.1,
    1.0,
  );

  return {
    width: boardWidth,
    height: boardHeight,
    rectCount,
    minArea,
    compactness: adjustedCompactness,
    sizeVariance,
    anchorAmbiguity,
    label: LABELS[idx],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function getShikakuParamsByLevel(
  level: number,
  rng: () => number,
): PuzzleParams {
  const diffScore = levelToDiffScore(level);
  return diffScoreToParams(diffScore, rng);
}

export function getShikakuParamsByTierIdx(
  tierIdx: number,
  rng?: () => number,
): PuzzleParams {
  const range = rng || mkRng(Date.now());
  const diffScore = SHIKAKU_TIERS[tierIdx].diffScore;
  return diffScoreToParams(diffScore, range);
}
