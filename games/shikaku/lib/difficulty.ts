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

import { mkRng, seedFromDiff, seedFromLevel } from "@/shared/algorithms";

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

export const DIFF_TIERS: RectDiffTier[] = [
  {
    name: "Beginner",
    icon: "□",
    diffScore: 1,
    minBoard: 4,
    maxBoard: 4,
    color: "#4a9e6a",
    dim: "#2a5e3a",
    bright: "#7ed4a0",
  },

  {
    name: "Easy",
    icon: "▣",
    diffScore: 2,
    minBoard: 5,
    maxBoard: 5,
    color: "#5a9e7a",
    dim: "#3a6e4a",
    bright: "#8adaaa",
  },

  {
    name: "Skilled",
    icon: "▤",
    diffScore: 3,
    minBoard: 5,
    maxBoard: 6,
    color: "#4a7abe",
    dim: "#2a4a7e",
    bright: "#8ab4ee",
  },

  {
    name: "Advanced",
    icon: "▥",
    diffScore: 4,
    minBoard: 6,
    maxBoard: 7,
    color: "#7a9a2a",
    dim: "#4a6a10",
    bright: "#b4d45a",
  },

  {
    name: "Expert",
    icon: "▦",
    diffScore: 5,
    minBoard: 7,
    maxBoard: 8,
    color: "#a07a2a",
    dim: "#6a4a10",
    bright: "#d4aa5a",
  },

  {
    name: "Master",
    icon: "▧",
    diffScore: 6,
    minBoard: 8,
    maxBoard: 9,
    color: "#9e4a9e",
    dim: "#5e2a6e",
    bright: "#cc80cc",
  },

  {
    name: "Grandmaster",
    icon: "▨",
    diffScore: 7,
    minBoard: 9,
    maxBoard: 10,
    color: "#be4a4a",
    dim: "#7e1a1a",
    bright: "#ee8888",
  },

  {
    name: "Legend",
    icon: "◈",
    diffScore: 8,
    minBoard: 10,
    maxBoard: 11,
    color: "#cc6622",
    dim: "#8a3008",
    bright: "#ff9966",
  },

  {
    name: "Nightmare",
    icon: "⬢",
    diffScore: 9,
    minBoard: 11,
    maxBoard: 12,
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
  const norm = normalizeScore(score);

  // ── Board Size ────────────────────────────────────────────────────────────

  const boardSize = clamp(
    Math.round(lerp(4, 12, norm) + (rng() - 0.5) * 1.2),
    4,
    12,
  );

  // ── Rectangle Count ───────────────────────────────────────────────────────

  const rectCount = clamp(
    Math.round(lerp(4, 24, norm) + (rng() - 0.5) * 2),
    4,
    24,
  );

  // ── Minimum Area ──────────────────────────────────────────────────────────

  const minArea = clamp(Math.round(lerp(5, 1, norm)), 1, 5);

  // ── Compactness ───────────────────────────────────────────────────────────

  const compactness = clamp(lerp(0.95, 0.15, norm), 0.1, 1.0);

  // ── Size Variance ─────────────────────────────────────────────────────────

  const sizeVariance = clamp(lerp(0.1, 1.0, norm), 0.0, 1.0);

  // ── Anchor Ambiguity ─────────────────────────────────────────────────────

  const anchorAmbiguity = clamp(lerp(0.0, 1.0, norm), 0.0, 1.0);

  const label = LABELS[clamp(Math.round(score) - 1, 0, LABELS.length - 1)];

  return {
    width: boardSize,
    height: boardSize,

    rectCount,

    minArea,

    compactness,
    sizeVariance,
    anchorAmbiguity,

    label,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function getParamsByLevel(level: number): PuzzleParams {
  const diffScore = levelToDiffScore(level);

  const seed = seedFromLevel(level);

  const rng = mkRng(seed);

  return diffScoreToParams(diffScore, rng);
}

export function getParamsByTierIdx(tierIdx: number): PuzzleParams {
  const diffScore = DIFF_TIERS[tierIdx].diffScore;

  const seed = seedFromDiff(tierIdx, Date.now());

  const rng = mkRng(seed);

  return diffScoreToParams(diffScore, rng);
}
