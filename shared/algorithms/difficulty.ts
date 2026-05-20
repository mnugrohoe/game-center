/**
 * @module difficulty
 * Wave-based difficulty system — game-agnostic.
 *
 * Maps a level number to a difficulty score (1–N) using:
 *   - A logarithmic base curve (difficulty grows slowly, never plateaus)
 *   - Multiple overlapping sine waves (non-monotonic oscillation)
 *   - Per-level deterministic noise (same level → same score, always)
 *
 * This makes difficulty feel organic: occasionally hard at early levels,
 * occasionally easy at late levels, but with a clear upward trend.
 *
 * Usage (any game):
 *   import { waveDifficulty, normalizeScore } from "@/shared/algorithms/difficulty";
 *
 *   const score = waveDifficulty({ level: 42 }); // 1.0–9.0
 */
import { DiffTier } from "@/games/kings/lib/utils";
import { mkRng } from "./rng";

// ─── Core wave difficulty ──────────────────────────────────────────────────────

export interface WaveDifficultyOptions {
  /** Level number (1-based). */
  level: number;
  /** Min difficulty score. Default 1. */
  minScore?: number;
  /** Max difficulty score. Default 9. */
  maxScore?: number;
  /**
   * Log base for the growth curve.
   * Higher = grows faster. Default: level 1000 reaches ~maxScore.
   */
  logBase?: number;
  /**
   * Wave amplitudes [primary, secondary, tertiary].
   * Default [0.9, 0.5, 0.3] — enough variance to be interesting.
   */
  waveAmplitudes?: [number, number, number];
  /**
   * Wave frequencies [primary, secondary, tertiary].
   * Default [0.31, 0.07, 0.013].
   */
  waveFrequencies?: [number, number, number];
  /** Max noise amplitude (±). Default 0.6. */
  noiseAmplitude?: number;
}

/**
 * Computes a non-monotonic difficulty score for a level.
 * Same level always produces the same score (deterministic).
 *
 * @returns Score in [minScore, maxScore].
 */
export function waveDifficulty(opts: WaveDifficultyOptions): number {
  const {
    level,
    minScore = 1,
    maxScore = 9,
    logBase = 1000,
    waveAmplitudes = [0.9, 0.5, 0.3],
    waveFrequencies = [0.31, 0.07, 0.013],
    noiseAmplitude = 0.6,
  } = opts;

  const range = maxScore - minScore;

  // Logarithmic base: minScore at level 1, approaching maxScore at logBase
  const base =
    minScore + (range * Math.log(Math.max(1, level))) / Math.log(logBase);

  // Three overlapping sine waves at different frequencies + phase offsets
  const wave =
    waveAmplitudes[0] * Math.sin(level * waveFrequencies[0] + 1.1) +
    waveAmplitudes[1] * Math.sin(level * waveFrequencies[1] + 2.3) +
    waveAmplitudes[2] * Math.sin(level * waveFrequencies[2] + 0.7);

  // Deterministic per-level noise — unique per level, same every time
  const rng = mkRng((level * 2654435761) ^ 0xc0ffee);
  const noise = (rng() - 0.5) * 2 * noiseAmplitude;

  return Math.max(minScore, Math.min(maxScore, base + wave + noise));
}

// ─── Score utilities ──────────────────────────────────────────────────────────

/**
 * Normalizes a difficulty score to a 0–1 range.
 *
 * @param score    - Raw score from waveDifficulty.
 * @param minScore - Lower bound of score range.
 * @param maxScore - Upper bound of score range.
 */
export function normalizeScore(
  score: number,
  minScore = 1,
  maxScore = 9,
): number {
  return (score - minScore) / (maxScore - minScore);
}

/**
 * Converts a score to a 0-based tier index.
 *
 * @param score    - Raw difficulty score.
 * @param numTiers - Total number of tiers.
 * @param minScore - Lower bound. Default 1.
 * @param maxScore - Upper bound. Default 9.
 */
export function scoreTToierIdx(
  score: number,
  numTiers: number,
  minScore = 1,
  maxScore = 9,
): number {
  const norm = normalizeScore(score, minScore, maxScore);
  return Math.max(0, Math.min(numTiers - 1, Math.floor(norm * numTiers)));
}

/**
 * Samples the difficulty wave over a range of levels.
 * Useful for rendering a preview chart.
 *
 * @param centerLevel - The level to center the window on.
 * @param halfWindow  - Number of levels on each side. Default 20.
 * @param opts        - Same options as waveDifficulty (minus `level`).
 * @returns Array of { level, score } pairs.
 */
export function sampleWave(
  centerLevel: number,
  halfWindow = 20,
  opts: Omit<WaveDifficultyOptions, "level"> = {},
): { level: number; score: number }[] {
  const result: { level: number; score: number }[] = [];
  for (let i = -halfWindow; i <= halfWindow; i++) {
    const level = Math.max(1, centerLevel + i);
    const score = waveDifficulty({ level, ...opts });
    result.push({ level, score });
  }
  return result;
}

// ─── Interpolation helpers ────────────────────────────────────────────────────

/**
 * Linear interpolation — clamps t to [0, 1].
 * Useful for mapping scores to parameter ranges.
 *
 * @example
 *   // Grid size 4 at score 1, 13 at score 9:
 *   const N = lerp(4, 13, normalizeScore(score));
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

/**
 * Clamps a value to [min, max].
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ─── Score → tier ─────────────────────────────────────────────────────────────

/**
 * Converts a difficulty score to a tier index.
 *
 * @param score       - Raw difficulty score.
 * @param diff_length - Total number of tiers.
 * @returns Tier index in [0, diff_length - 1].
 *
 * @example
 *   const score = waveDifficulty({ level: 42 });
 *   const tierIdx = diffScoreToTierIdx(score, 5); // 5 tiers total
 */
export function diffScoreToTierIdx(score: number, diff_length: number): number {
  return scoreTToierIdx(score, diff_length);
}

/**
 * Converts a level number to a difficulty score (1–9) using the waveDifficulty function.
 *
 * @param level - The level number (1-based).
 * @returns Difficulty score in the range [1, 9].
 *
 * @example
 *   const score = levelToDiffScore(42); // 1.0–9.0
 */
export function levelToDiffScore(level: number): number {
  return waveDifficulty({ level });
}

/**
 * Converts a level number to a tier index based on its difficulty score.
 *
 * @param level       - The level number (1-based).
 * @param diff_length - Total number of tiers.
 * @returns Tier index in [0, diff_length - 1].
 *
 * @example
 *   const tierIdx = levelToTierIdx(42, 5); // 5 tiers total
 */
export function levelToTierIdx(level: number, diff_length: number): number {
  return diffScoreToTierIdx(levelToDiffScore(level), diff_length);
}
