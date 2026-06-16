// games/set/lib/difficulty.ts

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
export interface SetDiffTier extends DiffTier {
  minCards: number;
  maxCards: number;
}

export const SET_TIERS: SetDiffTier[] = [
  {
    name: "Beginner",
    icon: "△",
    diffScore: 1,
    minCards: 12,
    maxCards: 12,
    color: "#4FC3F7", // Sky Blue
    dim: "#29B6F6",
    bright: "#B3E5FC",
  },
  {
    name: "Easy",
    icon: "▲",
    diffScore: 2,
    minCards: 12,
    maxCards: 15,
    color: "#66BB6A", // Green
    dim: "#4CAF50",
    bright: "#C8E6C9",
  },
  {
    name: "Skilled",
    icon: "∴",
    diffScore: 3,
    minCards: 15,
    maxCards: 15,
    color: "#26C6DA", // Cyan
    dim: "#00BCD4",
    bright: "#B2EBF2",
  },
  {
    name: "Advanced",
    icon: "❖",
    diffScore: 4,
    minCards: 15,
    maxCards: 16,
    color: "#D4E157", // Lime
    dim: "#C0CA33",
    bright: "#F0F4C3",
  },
  {
    name: "Expert",
    icon: "⧉",
    diffScore: 5,
    minCards: 16,
    maxCards: 18,
    color: "#FFCA28", // Amber
    dim: "#FFB300",
    bright: "#FFECB3",
  },
  {
    name: "Master",
    icon: "⛶",
    diffScore: 6,
    minCards: 18,
    maxCards: 20,
    color: "#BA68C8", // Purple
    dim: "#AB47BC",
    bright: "#E1BEE7",
  },
  {
    name: "Grandmaster",
    icon: "⁕",
    diffScore: 7,
    minCards: 18,
    maxCards: 24,
    color: "#FF8A65", // Orange
    dim: "#FF7043",
    bright: "#FFCCBC",
  },
  {
    name: "Legend",
    icon: "⬡",
    diffScore: 8,
    minCards: 24,
    maxCards: 27,
    color: "#EF5350", // Red
    dim: "#E53935",
    bright: "#FFCDD2",
  },
  {
    name: "Nightmare",
    icon: "⬢",
    diffScore: 9,
    minCards: 27,
    maxCards: 30,
    color: "#EC407A", // Magenta
    dim: "#D81B60",
    bright: "#F8BBD0",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SET Procedural Parameters
// ─────────────────────────────────────────────────────────────────────────────
export interface SetParams {
  totalCards: number;
  targetSets: number;
  overlapFactor: number;
  maxExtraSets: number;
  nearMissTarget: number;
  entropy: number;
  visualNoise: number;
  timer?: number; // Game session time limit in seconds
  hintPenalty: number;
  tier: SetDiffTier;
  seed: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Score → Params Formula Engine
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Score → Params Formula Engine
// ─────────────────────────────────────────────────────────────────────────────
export function generateSetParams(diffScore: number, seed: number): SetParams {
  const rng = mkRng(seed);
  const idx = clamp(Math.round(diffScore) - 1, 0, SET_TIERS.length - 1);
  const tier = SET_TIERS[idx];
  const maxIdx = SET_TIERS.length - 1;
  const progress = idx / maxIdx;

  // Nilai RNG konstan untuk pergeseran positif/negatif (-0.5 sampai 0.5)
  const variance = () => rng() - 0.5;

  // 1. Procedurally determine total targeted card pool using the seed
  const exactMin = tier.minCards;
  const exactMax = tier.maxCards;
  // Menentukan acak murni di dalam rentang min dan max bawaan tier
  const totalCards = clamp(
    Math.round(lerp(exactMin, exactMax, rng())),
    exactMin,
    exactMax,
  );

  // 2. Gameplay difficulty vectors dengan variasi RNG kontekstual
  // targetSets: berikan variasi ±1 set dari baseline progress
  const baseTargetSets = lerp(2, 8, progress);
  const targetSets = clamp(Math.round(baseTargetSets + variance() * 1.5), 2, 9);

  // overlapFactor: berikan variasi acak halus sekitar ±0.3
  const baseOverlap = lerp(0.1, 4.0, progress);
  const overlapFactor = parseFloat(
    clamp(baseOverlap + variance() * 0.6, 0.1, 4.5).toFixed(2),
  );

  // maxExtraSets: berikan variasi ±1 dari baseline progress
  const baseExtraSets = lerp(1, 5, progress);
  const maxExtraSets = clamp(Math.round(baseExtraSets + variance() * 2), 0, 6);

  // nearMissTarget: berikan variasi acak cukup lebar ±3 karena rentangnya besar (0-25)
  const baseNearMiss = lerp(0, 20, progress);
  const nearMissTarget = clamp(
    Math.round(baseNearMiss + variance() * 6),
    0,
    25,
  );

  // 3. Perceptual Chaos Configuration (Variasi persentase atribut ±0.1)
  const baseEntropy = lerp(0.15, 1.0, progress);
  const entropy = parseFloat(
    clamp(baseEntropy + variance() * 0.2, 0.1, 1.0).toFixed(2),
  );

  const baseNoise = lerp(0.1, 1.0, progress);
  const visualNoise = parseFloat(
    clamp(baseNoise + variance() * 0.2, 0.05, 1.0).toFixed(2),
  );

  // 4. Hard Modifiers (Action-driven timers & penalty tracking)
  let timer: number | undefined = undefined;
  if (idx >= 4) {
    // Timer dasar dikurangi/ditambah variasi acak ±15 detik agar waktu bermain dinamis
    const baseTimer = lerp(150, 60, (idx - 4) / (maxIdx - 4));
    timer = clamp(Math.round(baseTimer + variance() * 30), 45, 180);
  }

  // hintPenalty: variasi ±4 poin penalti dari baseline
  const basePenalty = lerp(0, 30, progress);
  const hintPenalty = clamp(Math.round(basePenalty + variance() * 8), 0, 50);

  return {
    totalCards,
    targetSets,
    overlapFactor,
    maxExtraSets,
    nearMissTarget,
    entropy,
    visualNoise,
    timer,
    hintPenalty,
    tier,
    seed,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience Hook / Provider Export
// ─────────────────────────────────────────────────────────────────────────────
export const setParamsGenerator = createParamsProvider(
  SET_TIERS,
  generateSetParams,
);
