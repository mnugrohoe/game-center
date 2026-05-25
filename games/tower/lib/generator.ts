// generator.ts

import { TOWER_DIFF_TIERS } from "./difficulty";

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
 * Generates a tower color sequence puzzle.
 *
 * Each number in the returned array represents a color index.
 *
 * Example:
 * [1, 2, 3, 1, 2]
 *
 * Generation goals:
 * - deterministic from seed
 * - every color appears at least once when possible
 * - avoid excessive repeated colors
 * - avoid triple streaks
 * - preserve difficulty-driven randomness
 *
 * @param size - Total tower height.
 * @param uniqueColors - Number of distinct colors available.
 * @param maxSameColor - Maximum allowed usage per color.
 * @param variance - Additional shuffle intensity.
 * @param seed - Deterministic RNG seed.
 * @returns Generated tower target sequence.
 */
export function generateTowerTarget(
  size: number,
  uniqueColors: number,
  maxSameColor: number,
  variance: number,
  seed: number,
): TowerTarget {
  if (size <= 0) {
    throw new Error("Tower size must be greater than 0");
  }

  if (uniqueColors <= 0) {
    throw new Error("uniqueColors must be greater than 0");
  }

  const rng = mkRng(seed);

  const result: number[] = [];

  /**
   * Build available color indexes.
   *
   * Example:
   * uniqueColors = 3
   * => [1, 2, 3]
   */
  const colors = Array.from({ length: uniqueColors }, (_, i) => i + 1);

  /**
   * Track total color usage.
   */
  const usage = new Map<number, number>();

  /**
   * Ensure every color appears once when possible.
   *
   * Prevents overflowing the requested size when:
   * uniqueColors > size
   */
  for (const color of colors) {
    if (result.length >= size) {
      break;
    }

    result.push(color);
    usage.set(color, 1);
  }

  /**
   * Fill remaining slots while respecting constraints.
   */
  while (result.length < size) {
    let attempts = 0;
    let placed = false;

    while (attempts < 100) {
      attempts++;

      const next = colors[Math.floor(rng() * colors.length)];

      const used = usage.get(next) ?? 0;

      /**
       * Prevent excessive global repetition.
       */
      if (used >= maxSameColor) {
        continue;
      }

      /**
       * Prevent triple streaks.
       */
      const last = result[result.length - 1];
      const beforeLast = result[result.length - 2];

      if (next === last && next === beforeLast) {
        continue;
      }

      result.push(next);
      usage.set(next, used + 1);

      placed = true;

      break;
    }

    /**
     * Fallback protection.
     *
     * If constraints become impossible,
     * forcibly insert a valid-ish color to avoid infinite loops.
     */
    if (!placed) {
      const fallback = colors.find((color) => {
        const used = usage.get(color) ?? 0;

        if (used >= maxSameColor) {
          return false;
        }

        const last = result[result.length - 1];
        const beforeLast = result[result.length - 2];

        return !(color === last && color === beforeLast);
      });

      /**
       * Absolute emergency fallback.
       */
      const emergency = fallback ?? colors[0];

      result.push(emergency);
      usage.set(emergency, (usage.get(emergency) ?? 0) + 1);
    }
  }

  /**
   * Additional randomness scaling.
   */
  for (let i = 0; i < variance; i++) {
    shuffle(result, rng);
  }

  /**
   * Cleanup any triple streaks introduced by shuffling.
   */
  for (let i = 2; i < result.length; i++) {
    if (result[i] === result[i - 1] && result[i] === result[i - 2]) {
      let swapIdx = Math.floor(rng() * i);

      /**
       * Retry a few times to find a safer swap target.
       */
      for (let tries = 0; tries < 10; tries++) {
        const candidate = Math.floor(rng() * i);

        if (
          result[candidate] !== result[i] ||
          candidate < 2 ||
          !(
            result[candidate] === result[candidate - 1] &&
            result[candidate] === result[candidate - 2]
          )
        ) {
          swapIdx = candidate;
          break;
        }
      }

      [result[i], result[swapIdx]] = [result[swapIdx], result[i]];
    }
  }

  /**
   * Final hard trim safety.
   */
  return result.slice(0, size);
}

/**
 * Generates a tower puzzle using a difficulty score.
 *
 * @param diffScore - Difficulty score identifier.
 * @param entropy - Additional entropy used for seed generation.
 * @returns Generated tower target.
 * @throws Error if the difficulty score is invalid.
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

/**
 * Generates a tower puzzle using a tier index.
 *
 * @param tierIdx - Difficulty tier index.
 * @param entropy - Additional entropy used for seed generation.
 * @returns Generated tower target.
 * @throws Error if the tier index is invalid.
 */
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
 * Generates a tower puzzle from player progression level.
 *
 * The level is converted into a difficulty score first.
 *
 * @param level - Player level.
 * @returns Generated tower target.
 * @throws Error if no matching difficulty tier exists.
 */
export function generateByLevel(level: number): TowerTarget {
  const diffScore = Math.round(
    clamp(levelToDiffScore(level), 1, TOWER_DIFF_TIERS.length),
  );

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
