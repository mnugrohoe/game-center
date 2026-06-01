/**
 * shared/algorithms/difficulty.ts
 *
 * Wave-based difficulty system — game-agnostic.
 * NO imports from any game folder. DiffTier lives in shared/types.
 *
 * Maps level → score (1–9) using:
 *   log base curve  → overall upward trend
 *   3 sine waves    → non-monotonic oscillation
 *   seeded noise    → same level always same score
 */
import { mkRng } from "./rng";

// ── Core wave ────────────────────────────────────────────────────────────────

export interface WaveDifficultyOptions {
  level: number;
  minScore?: number; /* default 1   */
  maxScore?: number; /* default 9   */
  logBase?: number; /* default 1000 */
  waveAmplitudes?: [number, number, number]; /* default [0.9, 0.5, 0.3] */
  waveFreqs?: [number, number, number]; /* default [0.31, 0.07, 0.013] */
  noiseAmp?: number; /* default 0.6 */
}

export function waveDifficulty(opts: WaveDifficultyOptions): number {
  const {
    level,
    minScore = 1,
    maxScore = 9,
    logBase = 1000,
    waveAmplitudes = [0.9, 0.5, 0.3],
    waveFreqs = [0.31, 0.07, 0.013],
    noiseAmp = 0.6,
  } = opts;

  const range = maxScore - minScore;
  const base =
    minScore + (range * Math.log(Math.max(1, level))) / Math.log(logBase);

  const wave =
    waveAmplitudes[0] * Math.sin(level * waveFreqs[0] + 1.1) +
    waveAmplitudes[1] * Math.sin(level * waveFreqs[1] + 2.3) +
    waveAmplitudes[2] * Math.sin(level * waveFreqs[2] + 0.7);

  const rng = mkRng((level * 2654435761) ^ 0xc0ffee);
  const noise = (rng() - 0.5) * 2 * noiseAmp;

  return Math.max(minScore, Math.min(maxScore, base + wave + noise));
}

// ── Convenience wrappers (default options) ────────────────────────────────────

/** Score 1–9 for a given level with default wave params. */
export function levelToDiffScore(level: number): number {
  return waveDifficulty({ level });
}

/** Normalize a raw score to 0–1. */
export function normalizeScore(score: number, min = 1, max = 9): number {
  return (score - min) / (max - min);
}

/** Linear interpolation (clamps t to [0,1]). */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

/** Clamp value to [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Convert raw score → 0-based tier index.
 * @param numTiers   Total tiers (e.g. 9)
 */
export function diffScoreToTierIdx(score: number, numTiers: number): number {
  const norm = Math.max(0, Math.min(1, normalizeScore(score)));
  return Math.min(numTiers - 1, Math.floor(norm * numTiers));
}

/**
 * Direct level → tier index.
 * @param numTiers   Total tiers in the game's DIFF_TIERS array
 */
export function levelToTierIdx(level: number, numTiers: number): number {
  return diffScoreToTierIdx(levelToDiffScore(level), numTiers);
}

/** Sample the wave ±halfWindow around centerLevel for chart rendering. */
export function sampleWave(
  centerLevel: number,
  halfWindow = 20,
  opts: Omit<WaveDifficultyOptions, "level"> = {},
): { level: number; score: number }[] {
  const result: { level: number; score: number }[] = [];
  for (let i = -halfWindow; i <= halfWindow; i++) {
    const level = Math.max(1, centerLevel + i);
    result.push({ level, score: waveDifficulty({ level, ...opts }) });
  }
  return result;
}
