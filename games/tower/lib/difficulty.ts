/**
 * games/tower/lib/difficulty.ts
 *
 * Sequence puzzle difficulty system.
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
import { createParamsProvider } from "@/shared/utils/generator";

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

export interface TowerDiffTier extends DiffTier {
  /** Total slot count for the sequence */
  size: number;
  /** Max unique colors available to pull from the pool for this tier */
  uniqueColors: number;
  /** Maximum duplicates allowed for any single color */
  maxSameColor: number;
  /** Additional shuffle/chaos factor */
  variance: number;
}

export const TOWER_DIFF_TIERS: TowerDiffTier[] = [
  {
    name: "Pebble",
    icon: "🌱",
    diffScore: 1,
    size: 3,
    uniqueColors: 3,
    maxSameColor: 1,
    variance: 1,
    color: "#5c8d89",
    dim: "#34524f",
    bright: "#8fd6cf",
  },
  {
    name: "Wood",
    icon: "🌲",
    diffScore: 2,
    size: 3,
    uniqueColors: 3,
    maxSameColor: 2,
    variance: 2,
    color: "#8d6e63",
    dim: "#5d4037",
    bright: "#bcaaa4",
  },
  {
    name: "Stone",
    icon: "🧱",
    diffScore: 3,
    size: 3,
    uniqueColors: 4,
    maxSameColor: 2,
    variance: 3,
    color: "#607d8b",
    dim: "#37474f",
    bright: "#90a4ae",
  },
  {
    name: "Iron",
    icon: "⛓️",
    diffScore: 4,
    size: 4,
    uniqueColors: 4,
    maxSameColor: 3,
    variance: 4,
    color: "#78909c",
    dim: "#455a64",
    bright: "#b0bec5",
  },
  {
    name: "Crystal",
    icon: "💎",
    diffScore: 5,
    size: 4,
    uniqueColors: 5,
    maxSameColor: 3,
    variance: 5,
    color: "#7e57c2",
    dim: "#4527a0",
    bright: "#b39ddb",
  },
  {
    name: "Arcane",
    icon: "🔮",
    diffScore: 6,
    size: 4,
    uniqueColors: 5,
    maxSameColor: 4,
    variance: 6,
    color: "#ab47bc",
    dim: "#6a1b9a",
    bright: "#ce93d8",
  },
  {
    name: "Void",
    icon: "🌌",
    diffScore: 7,
    size: 5,
    uniqueColors: 5,
    maxSameColor: 5,
    variance: 7,
    color: "#5c6bc0",
    dim: "#283593",
    bright: "#9fa8da",
  },
  {
    name: "Inferno",
    icon: "🔥",
    diffScore: 8,
    size: 5,
    uniqueColors: 5,
    maxSameColor: 999,
    variance: 8,
    color: "#e64a19",
    dim: "#bf360c",
    bright: "#ffab91",
  },
  {
    name: "Titan",
    icon: "🏰",
    diffScore: 9,
    size: 5,
    uniqueColors: 5,
    maxSameColor: 999,
    variance: 9,
    color: "#c62828",
    dim: "#7f0000",
    bright: "#ef9a9a",
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Tower Parameters & Live Generation Runtime
// ─────────────────────────────────────────────────────────────────────────────

export interface TowerParams {
  /** The configuration size for this match instance */
  size: number;
  /** Number of distinct color ids available (0 to uniqueColors - 1) */
  uniqueColors: number;
  /** Allowed duplicates constraint rule */
  maxSameColor: number;
  /** Maximum vertical stack limit before collapsing */
  maxTowerHeight: number;
  /** Procedural distribution deviation weight */
  entropyFactor: number;
  tier: TowerDiffTier;
  seed: number;
}

/**
 * Score → Params
 * Translates a normalized continuous difficulty score into unique procedural gameplay parameters.
 */
export function generateTowerParams(
  diffScore: number,
  seed: number,
): TowerParams {
  const rng = mkRng(seed);
  const idx = clamp(Math.round(diffScore) - 1, 0, TOWER_DIFF_TIERS.length - 1);
  const tier = TOWER_DIFF_TIERS[idx];
  const maxIdx = TOWER_DIFF_TIERS.length - 1;

  // Derive contextual entropy factor based on procedural variance and current selection
  const entropyFactor = clamp(
    (tier.variance / 9) * (0.85 + (rng() - 0.5) * 0.3),
    0,
    1.0,
  );

  // Procedurally scale standard tower limit parameters
  // Lower tiers provide a wider margin of safety, high tiers tighten down downwards
  const baseHeight = lerp(12, 8, idx / maxIdx);
  const maxTowerHeight = clamp(
    Math.round(baseHeight + (rng() - 0.5) * 2),
    6,
    15,
  );

  return {
    size: tier.size,
    uniqueColors: tier.uniqueColors,
    maxSameColor: tier.maxSameColor,
    maxTowerHeight,
    entropyFactor,
    tier,
    seed,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience Helpers
// ─────────────────────────────────────────────────────────────────────────────
export const towerParamsGenerator = createParamsProvider(
  TOWER_DIFF_TIERS,
  generateTowerParams,
);
