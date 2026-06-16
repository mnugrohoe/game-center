/**
 * games/tower/lib/generator.ts
 *
 * Sequence puzzle color generator system.
 *
 * Architecture:
 * params configuration
 * → deterministic rng initialization
 * → rule-constrained stream assembly
 * → automated fallback evaluation
 */

import { mkRng, shuffle } from "@/shared/algorithms";
import { towerParamsGenerator, type TowerParams } from "./difficulty";
import { createPuzzleGenerator } from "@/shared/utils/generator";

// ─── Public & Internal Types ──────────────────────────────────────────────────

export interface GeneratorOptions {
  maxTowerHeight?: number;
  entropyFactor?: number;
}

export interface TowerPuzzle {
  size: number;
  maxTowerHeight: number;
  targetSequence: number[];
  params: TowerParams;
}

// ─── Core Optimized Generator ─────────────────────────────────────────────────

/**
 * Generates a tower color sequence puzzle match.
 *
 * Each number in the array represents an active color asset index.
 * Example: [1, 2, 0, 1, 2]
 */
export function generateTowerSequence(
  size: number,
  uniqueColorsCount: number,
  maxSameColor: number,
  variance: number,
  rng: () => number,
): TowerPuzzle["targetSequence"] {
  if (size <= 0) {
    throw new Error("Tower size must be greater than 0");
  }
  if (uniqueColorsCount <= 0) {
    throw new Error("Unique colors count must be greater than 0");
  }

  const result: number[] = [];

  // Track total color usage frequencies
  const usage = new Map<number, number>();

  // Build zero-indexed identifiers (0, 1, 2, 3...)
  const colorIds = Array.from({ length: uniqueColorsCount }, (_, i) => i);

  /**
   * Goal 1: Ensure every color appears once when space allows.
   * Prevents overflowing the array length boundary.
   */
  for (const colorId of colorIds) {
    if (result.length >= size) {
      break;
    }
    result.push(colorId);
    usage.set(colorId, 1);
  }

  /**
   * Goal 2: Fill remaining slots while preserving placement limits.
   */
  while (result.length < size) {
    let attempts = 0;
    let placed = false;

    while (attempts < 100) {
      attempts++;
      const next = colorIds[Math.floor(rng() * colorIds.length)];
      const used = usage.get(next) ?? 0;

      // Rule: Prevent global overflow allocation
      if (used >= maxSameColor) {
        continue;
      }

      // Rule: Prevent immediate sequential triple streaks
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
     * Fallback Protection Mode
     */
    if (!placed) {
      const fallback = colorIds.find((id) => {
        const used = usage.get(id) ?? 0;
        if (used >= maxSameColor) {
          return false;
        }

        const last = result[result.length - 1];
        const beforeLast = result[result.length - 2];
        return !(id === last && id === beforeLast);
      });

      const emergency = fallback ?? colorIds[0];
      result.push(emergency);
      usage.set(emergency, (usage.get(emergency) ?? 0) + 1);
    }
  }

  /**
   * Goal 3: Multi-pass entropy variance shuffling.
   */
  for (let i = 0; i < variance; i++) {
    shuffle(result, rng);
  }

  /**
   * Goal 4: Post-shuffle layout linear patch step.
   * Runs in O(N) execution time with zero backtracking loops.
   */
  for (let i = 2; i < result.length; i++) {
    if (result[i] === result[i - 1] && result[i] === result[i - 2]) {
      // Find an alternative color that breaks the forward streak safely
      for (const colorId of colorIds) {
        // Must break the back-streak from this perspective
        if (colorId === result[i - 1]) continue;

        // Ensure choosing this won't trigger a forward triple streak down the line
        if (
          i + 2 < result.length &&
          colorId === result[i + 1] &&
          colorId === result[i + 2]
        )
          continue;
        if (
          i + 1 < result.length &&
          i >= 1 &&
          colorId === result[i - 1] &&
          colorId === result[i + 1]
        )
          continue;

        result[i] = colorId;
        break;
      }
    }
  }

  return result.slice(0, size);
}

// ─── Puzzle Generator Implementation ──────────────────────────────────────────

export function generateTower(params: TowerParams): TowerPuzzle {
  const rng = mkRng(params.seed);

  const targetSequence = generateTowerSequence(
    params.size,
    params.uniqueColors,
    params.maxSameColor,
    params.tier.variance,
    rng,
  );

  return {
    size: params.size,
    maxTowerHeight: params.maxTowerHeight,
    targetSequence,
    params,
  };
}

export const towerGenerator = createPuzzleGenerator(
  generateTower,
  towerParamsGenerator,
);
