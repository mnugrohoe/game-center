/**
 * Kings difficulty configuration.
 * Bridges the shared wave difficulty system to Kings-specific puzzle parameters.
 */

import { waveDifficulty, scoreTToierIdx, normalizeScore, lerp, clamp } from "@/shared/algorithms/difficulty";
import { seedFromLevel, seedFromDiff, mkRng } from "@/shared/algorithms/rng";

export { seedFromLevel, seedFromDiff, mkRng };

// ─── Tiers ────────────────────────────────────────────────────────────────────

export interface DiffTier {
  name: string;
  icon: string;
  diffScore: number;
  minGrid: number;
  maxGrid: number;
  color: string;
  dim: string;
  bright: string;
}

export const DIFF_TIERS: DiffTier[] = [
  { name: "Initiate", icon: "✦",  diffScore: 1, minGrid: 4,  maxGrid: 5,  color: "#4a9e6a", dim: "#2a5e3a", bright: "#7ed4a0" },
  { name: "Squire",   icon: "⚔",  diffScore: 2, minGrid: 5,  maxGrid: 6,  color: "#5a9e7a", dim: "#3a6e4a", bright: "#8adaaa" },
  { name: "Knight",   icon: "🛡",  diffScore: 3, minGrid: 6,  maxGrid: 7,  color: "#4a7abe", dim: "#2a4a7e", bright: "#8ab4ee" },
  { name: "Baron",    icon: "⚜",  diffScore: 4, minGrid: 7,  maxGrid: 8,  color: "#7a9a2a", dim: "#4a6a10", bright: "#b4d45a" },
  { name: "Lord",     icon: "👑",  diffScore: 5, minGrid: 7,  maxGrid: 9,  color: "#a07a2a", dim: "#6a4a10", bright: "#d4aa5a" },
  { name: "King",     icon: "♚",  diffScore: 6, minGrid: 8,  maxGrid: 10, color: "#9e4a9e", dim: "#5e2a6e", bright: "#cc80cc" },
  { name: "Warlord",  icon: "⚡",  diffScore: 7, minGrid: 9,  maxGrid: 11, color: "#be4a4a", dim: "#7e1a1a", bright: "#ee8888" },
  { name: "Champion", icon: "🔱", diffScore: 8, minGrid: 10, maxGrid: 12, color: "#cc6622", dim: "#8a3008", bright: "#ff9966" },
  { name: "Demon",    icon: "☠",  diffScore: 9, minGrid: 11, maxGrid: 13, color: "#cc2222", dim: "#8a0808", bright: "#ff6666" },
];

// ─── Score → tier ─────────────────────────────────────────────────────────────

/** Converts a raw difficulty score (1–9) to a tier index (0–8). */
export function diffScoreToTierIdx(score: number): number {
  return scoreTToierIdx(score, DIFF_TIERS.length);
}

/** Returns the wave difficulty score for a level (1–9). */
export function levelToDiffScore(level: number): number {
  return waveDifficulty({ level });
}

/** Tier index for a level — shorthand for diffScoreToTierIdx(levelToDiffScore(level)). */
export function levelToTierIdx(level: number): number {
  return diffScoreToTierIdx(levelToDiffScore(level));
}

// ─── Score → puzzle params ─────────────────────────────────────────────────────

export interface PuzzleParams {
  /** Grid size N (= number of regions = number of kings). */
  N: number;
  /**
   * Region compactness bias (0–1).
   * 1 = round blobs (easy), 0 = spiky tentacles (hard).
   */
  compactness: number;
  /**
   * Region size variance (0–1).
   * 0 = equal sizes (easy), 1 = wildly unequal (hard).
   */
  sizeVariance: number;
  /** Human-readable difficulty label. */
  label: string;
}

const DIFFICULTY_LABELS = [
  "Trivial", "Very Easy", "Easy", "Moderate",
  "Medium", "Tricky", "Hard", "Very Hard", "Brutal",
];

/**
 * Converts a difficulty score to concrete Kings puzzle generation parameters.
 * The rng is used only for small N variance so the same score can yield
 * slightly different grid sizes on different generations.
 *
 * @param score - Raw difficulty score (1–9).
 * @param rng   - Seeded RNG for parameter variance.
 */
export function diffScoreToParams(score: number, rng: () => number): PuzzleParams {
  const norm = normalizeScore(score); // 0–1

  // Grid size: 4 at score 1, 13 at score 9, small random variance
  const baseN = lerp(4, 13, norm);
  const nVariance = (rng() - 0.5) * 1.2;
  const N = clamp(Math.round(baseN + nVariance), 4, 13);

  // Compactness drops as difficulty rises (spikier = harder)
  const compactness = clamp(lerp(0.9, 0.1, norm), 0.1, 0.95);

  // Size variance grows as difficulty rises (unequal = harder)
  const sizeVariance = clamp(lerp(0.0, 1.0, norm), 0.0, 1.0);

  const tierIdx = clamp(Math.round(score) - 1, 0, 8);
  const label = DIFFICULTY_LABELS[tierIdx];

  return { N, compactness, sizeVariance, label };
}
