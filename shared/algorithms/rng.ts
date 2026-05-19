/**
 * @module rng
 * Deterministic seedable pseudo-random number generator.
 *
 * Algorithm: Mulberry32 — fast, high quality, 32-bit state.
 * Same seed always produces the same sequence, making it safe for
 * reproducible puzzle generation (same level number = same puzzle).
 *
 * Usage (any game):
 *   import { mkRng, shuffle } from "@/shared/algorithms/rng";
 *   const rng = mkRng(12345);
 *   const x = rng(); // [0, 1)
 *   const shuffled = shuffle([1,2,3,4], rng);
 */

import type { RngFn } from "../types";

/**
 * Creates a deterministic pseudo-random number generator from a seed.
 * Returns a function that produces values in [0, 1).
 *
 * @param seed - Any 32-bit integer. Same seed → same sequence.
 */
export function mkRng(seed: number): RngFn {
  let s = seed >>> 0; // coerce to unsigned 32-bit
  return (): number => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Fisher-Yates shuffle — in-place, returns the array for chaining.
 * Uses the provided RNG so shuffle is deterministic with a fixed seed.
 *
 * @param arr - Array to shuffle in-place.
 * @param rng - Seeded RNG function.
 */
export function shuffle<T>(arr: T[], rng: RngFn): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Derives a reproducible seed from a level number.
 * Different multipliers/XOR constants ensure levels map to very different seeds.
 *
 * @param level - Game level (1-based).
 */
export function seedFromLevel(level: number): number {
  return ((level * 2654435761) ^ 0xdeadbeef) >>> 0;
}

/**
 * Derives a seed from a difficulty tier index + entropy value.
 * Entropy can be Date.now() for non-reproducible, or a fixed int for reproducible.
 *
 * @param tierIdx  - Difficulty tier (0-based index).
 * @param entropy  - Variable input; use Date.now() for unique seeds.
 */
export function seedFromDiff(tierIdx: number, entropy: number): number {
  return ((tierIdx * 999983 + entropy * 2654435761) ^ 0xabcdef12) >>> 0;
}

/**
 * Weighted random selection — picks index proportional to weights array.
 * Useful for biased region selection in generators.
 *
 * @param weights - Non-negative weight per item. Must sum > 0.
 * @param rng     - Seeded RNG function.
 * @returns Index of the selected item.
 */
export function weightedRandom(weights: number[], rng: RngFn): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let pick = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    pick -= weights[i];
    if (pick <= 0) return i;
  }
  return weights.length - 1;
}
