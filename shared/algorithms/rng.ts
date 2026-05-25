/**
 * @module rng
 * Fast deterministic pseudo-random utilities.
 */

import type { RngFn } from "../types";

const UINT32_MAX_PLUS_1 = 4294967296;

/**
 * Creates a deterministic PRNG from a 32-bit seed.
 * Mulberry32: small state, fast, good enough for puzzle generation.
 *
 * @param seed - Any number; only the low 32 bits are used.
 * @returns A function producing values in [0, 1).
 */
export function mkRng(seed: number): RngFn {
  let s = seed >>> 0;

  return function rng(): number {
    s = (s + 0x6d2b79f5) >>> 0;

    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);

    return ((t ^ (t >>> 14)) >>> 0) / UINT32_MAX_PLUS_1;
  };
}

/**
 * Returns a random integer in [0, max).
 * Faster than `Math.floor(rng() * max)` when reused in hot paths.
 */
export function nextInt(rng: RngFn, max: number): number {
  return (rng() * max) | 0;
}

/**
 * Fisher-Yates shuffle, in-place.
 * Uses a temp variable instead of destructuring to reduce overhead.
 */
export function shuffle<T>(arr: T[], rng: RngFn = Math.random): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (rng() * (i + 1)) | 0;
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

/**
 * Derives a reproducible seed from a level number.
 *
 * @param level - Game level (typically 1-based).
 */
export function seedFromLevel(level: number): number {
  const x = level >>> 0;
  return Math.imul(x ^ 0x9e3779b9, 0x85ebca6b) >>> 0;
}

/**
 * Derives a seed from tier index + entropy.
 *
 * @param tierIdx - Difficulty tier index.
 * @param entropy - Extra entropy source such as Date.now().
 */
export function seedFromDiff(tierIdx: number, entropy: number): number {
  let x = (tierIdx >>> 0) ^ (entropy >>> 0);
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b);
  x ^= x >>> 16;
  return x >>> 0;
}

/**
 * Weighted random selection.
 * Pass `totalWeight` if you already know it to avoid recomputing it.
 *
 * @param weights - Non-negative weights.
 * @param rng - Seeded RNG.
 * @param totalWeight - Optional sum of all weights.
 */
export function weightedRandom(
  weights: readonly number[],
  rng: RngFn,
  totalWeight?: number,
): number {
  const total = totalWeight === undefined ? sumWeights(weights) : totalWeight;

  let pick = rng() * total;

  for (let i = 0; i < weights.length; i++) {
    pick -= weights[i];
    if (pick <= 0) return i;
  }

  return weights.length - 1;
}

/**
 * Sums weights in a tight loop.
 */
export function sumWeights(weights: readonly number[]): number {
  let total = 0;
  for (let i = 0; i < weights.length; i++) {
    total += weights[i];
  }
  return total;
}
