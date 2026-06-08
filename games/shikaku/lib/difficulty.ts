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
import { mkRng, seedFromLevel } from "@/shared/algorithms";

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

interface ShikakuDiffTier extends DiffTier {
  minBoard: number;
  maxBoard: number;
}

export const SHIKAKU_TIERS: ShikakuDiffTier[] = [
  {
    name: "Beginner",
    icon: "□",
    diffScore: 1,
    minBoard: 5,
    maxBoard: 6,
    color: "#4FC3F7", // Sky Blue
    dim: "#29B6F6",
    bright: "#B3E5FC",
  },

  {
    name: "Easy",
    icon: "▣",
    diffScore: 2,
    minBoard: 7,
    maxBoard: 10,
    color: "#66BB6A", // Green
    dim: "#4CAF50",
    bright: "#C8E6C9",
  },

  {
    name: "Skilled",
    icon: "▤",
    diffScore: 3,
    minBoard: 8,
    maxBoard: 12,
    color: "#26C6DA", // Cyan
    dim: "#00BCD4",
    bright: "#B2EBF2",
  },

  {
    name: "Advanced",
    icon: "▥",
    diffScore: 4,
    minBoard: 9,
    maxBoard: 14,
    color: "#D4E157", // Lime
    dim: "#C0CA33",
    bright: "#F0F4C3",
  },

  {
    name: "Expert",
    icon: "▦",
    diffScore: 5,
    minBoard: 10,
    maxBoard: 16,
    color: "#FFCA28", // Amber
    dim: "#FFB300",
    bright: "#FFECB3",
  },

  {
    name: "Master",
    icon: "▧",
    diffScore: 6,
    minBoard: 12,
    maxBoard: 18,
    color: "#BA68C8", // Purple
    dim: "#AB47BC",
    bright: "#E1BEE7",
  },

  {
    name: "Grandmaster",
    icon: "▨",
    diffScore: 7,
    minBoard: 14,
    maxBoard: 20,
    color: "#FF8A65", // Orange
    dim: "#FF7043",
    bright: "#FFCCBC",
  },

  {
    name: "Legend",
    icon: "◈",
    diffScore: 8,
    minBoard: 16,
    maxBoard: 22,
    color: "#EF5350", // Red
    dim: "#E53935",
    bright: "#FFCDD2",
  },

  {
    name: "Nightmare",
    icon: "⬢",
    diffScore: 9,
    minBoard: 18,
    maxBoard: 23,
    color: "#EC407A", // Magenta
    dim: "#D81B60",
    bright: "#F8BBD0",
  },
];

export const SHIKAKU_MIN_AREA = 2;

// ─────────────────────────────────────────────────────────────────────────────
// Puzzle Parameters
// ─────────────────────────────────────────────────────────────────────────────

export interface ShikakuParams {
  width: number;
  height: number;
  rectCount: number;

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

  tier: ShikakuDiffTier;
  seed: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Score → Params
// ─────────────────────────────────────────────────────────────────────────────

export function generateShikakuParams(
  diffScore: number,
  seed: number,
): ShikakuParams {
  const rng = mkRng(seed);
  const idx = clamp(Math.round(diffScore) - 1, 0, SHIKAKU_TIERS.length - 1);
  const tier = SHIKAKU_TIERS[idx];
  const maxIdx = SHIKAKU_TIERS.length - 1;
  const minArea = SHIKAKU_MIN_AREA;

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

  const compactness = clamp(0.92 - (0.72 * idx) / maxIdx, 0.1, 1.0);
  const sizeVariance = clamp(0.15 + (0.85 * idx) / maxIdx, 0, 1);
  const anchorAmbiguity = clamp(idx / maxIdx, 0, 1);

  const hardLimit = Math.floor(boardArea / minArea);

  const minRectCount = Math.max(4, Math.ceil(boardArea / 8));
  const maxRectCount = Math.min(hardLimit, Math.floor(boardArea / 4));

  const targetDensity = lerp(0.26, 0.12, idx / maxIdx);
  const idealRectCount = boardArea * targetDensity;
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
    compactness: adjustedCompactness,
    sizeVariance,
    anchorAmbiguity,
    tier,
    seed,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function getShikakuParamsByLevel(level: number): ShikakuParams {
  const levelSeed = seedFromLevel(level);
  const diffScore = levelToDiffScore(level);
  return generateShikakuParams(diffScore, levelSeed);
}

export function getShikakuParamsByTierIdx(
  tierIdx: number,
  seed: number,
): ShikakuParams {
  const diffScore = SHIKAKU_TIERS[tierIdx].diffScore;
  return generateShikakuParams(diffScore, seed);
}
