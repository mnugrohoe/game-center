// generator.ts

import { TOWER_DIFF_TIERS, COLOR_POOL, TowerDiffTier } from "./difficulty";

import {
  mkRng,
  shuffle,
  seedFromDiff,
  seedFromLevel,
  levelToDiffScore,
  clamp,
} from "@/shared/algorithms";

export type TowerTarget = number[];

/**
 * Generate tower pattern.
 *
 * Result example:
 * [1,2,3,1,2]
 *
 * Numbers represent color indexes.
 */
export function generateTowerTarget(
  size: number,
  uniqueColors: number,
  maxSameColor: number,
  variance: number,
  seed: number,
): TowerTarget {
  const rng = mkRng(seed);

  const result: number[] = [];

  /**
   * Build available color indexes.
   *
   * Example:
   * uniqueColors = 3
   * => [1,2,3]
   */
  const colors = Array.from({ length: uniqueColors }, (_, i) => i + 1);

  /**
   * Track total usage.
   */
  const usage = new Map<number, number>();

  /**
   * Ensure every color appears once.
   */
  for (const color of colors) {
    result.push(color);
    usage.set(color, 1);
  }

  /**
   * Fill remaining slots.
   */
  while (result.length < size) {
    let attempts = 0;

    while (attempts < 100) {
      attempts++;

      const next = colors[Math.floor(rng() * colors.length)];

      const used = usage.get(next) ?? 0;

      /**
       * Prevent too many same colors globally.
       */
      if (used >= maxSameColor) {
        continue;
      }

      /**
       * Prevent ugly streaks.
       */
      const last = result[result.length - 1];
      const beforeLast = result[result.length - 2];

      if (next === last && next === beforeLast) {
        continue;
      }

      result.push(next);
      usage.set(next, used + 1);

      break;
    }
  }

  /**
   * Extra chaos scaling.
   */
  for (let i = 0; i < variance; i++) {
    shuffle(result, rng);
  }

  /**
   * Cleanup post-shuffle streaks.
   */
  for (let i = 2; i < result.length; i++) {
    if (result[i] === result[i - 1] && result[i] === result[i - 2]) {
      const swapIdx = Math.floor(rng() * i);

      [result[i], result[swapIdx]] = [result[swapIdx], result[i]];
    }
  }

  return result;
}

/**
 * Generate by difficulty score.
 */
export function generateByDifficulty(
  diffScore: number,
  entropy = 1,
): TowerTarget {
  const tier = TOWER_DIFF_TIERS.find((t) => t.diffScore === diffScore);

  if (!tier) {
    throw new Error(`No difficulty tier found for score: ${diffScore}`);
  }

  const seed = seedFromDiff(diffScore, entropy);

  return generateTowerTarget(
    tier.size,
    tier.uniqueColors,
    tier.maxSameColor,
    tier.variance,
    seed,
  );
}

export function generateByTier(tierIdx: number, entropy = 1): TowerTarget {
  const tier = TOWER_DIFF_TIERS[tierIdx];

  if (!tier) {
    throw new Error(`There's no Tier at index: ${tierIdx}`);
  }
  const seed = seedFromDiff(tier.diffScore, entropy);

  return generateTowerTarget(
    tier.size,
    tier.uniqueColors,
    tier.maxSameColor,
    tier.variance,
    seed,
  );
}

/**
 * Generate by level.
 */
export function generateByLevel(level: number): TowerTarget {
  const diffScore = clamp(levelToDiffScore(level), 1, TOWER_DIFF_TIERS.length);

  const tier = TOWER_DIFF_TIERS.find((t) => t.diffScore === diffScore);

  if (!tier) {
    throw new Error(`No difficulty tier found for score: ${diffScore}`);
  }

  const seed = seedFromLevel(level);

  return generateTowerTarget(
    tier.size,
    tier.uniqueColors,
    tier.maxSameColor,
    tier.variance,
    seed,
  );
}

/**
 * Build visual color pool.
 *
 * Example:
 * generateColorPool(5)
 * => ['#ff0000', '#00ff00', ...]
 */
export function generateColorPool(size: number): string[] {
  const pool = [...COLOR_POOL];

  /**
   * Randomize base colors.
   */
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, size);
}
