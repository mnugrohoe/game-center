import { getRandomSeed, levelToDiffScore, seedFromLevel } from "../algorithms";

/**
 * Provides parameters for puzzle generation based on level or tier.
 */
export type ParamsProvider<TParams> = {
  /**
   * Generate params from a level.
   * Level is converted into diffScore + deterministic seed.
   */
  byLevel: (level: number) => TParams;

  /**
   * Generate params from a tier index and seed.
   *
   * @param tierIdx - index of difficulty tier
   * @param seed - random or deterministic seed used for generation
   */
  byTier: (tierIdx: number, seed: number) => TParams;
};

/**
 * Factory to create a ParamsProvider.
 *
 * This abstracts puzzle parameter creation logic:
 * - Level → diffScore + seed (deterministic via level)
 * - Tier → diffScore from tier + external seed
 *
 * @template TParams - generated parameter type
 *
 * @param tiers - list of difficulty tiers containing diffScore mapping
 * @param generateParams - function that builds final params from diffScore and seed
 */
export function createParamsProvider<TParams>(
  tiers: readonly { diffScore: number }[],
  generateParams: (diffScore: number, seed: number) => TParams,
): ParamsProvider<TParams> {
  return {
    byLevel(level: number): TParams {
      const diffScore = levelToDiffScore(level);
      const seed = seedFromLevel(level);

      return generateParams(diffScore, seed);
    },

    byTier(tierIdx: number, seed: number): TParams {
      const tier = tiers[tierIdx];

      if (!tier) {
        throw new Error(`Invalid tier index: ${tierIdx}`);
      }

      return generateParams(tier.diffScore, seed);
    },
  };
}

/**
 * Puzzle generator interface.
 *
 * Supports generating puzzles from:
 * - level (progression-based)
 * - tier (difficulty-based)
 */
export type PuzzleGenerator<TPuzzle> = {
  /**
   * Generate puzzle from level input.
   */
  byLevel: (level: number) => TPuzzle;

  /**
   * Generate puzzle from tier index and seed.
   *
   * Seed is optional and will be auto-generated if not provided.
   */
  byTier: (tierIdx: number, seed: number) => TPuzzle;
};

/**
 * Factory to create a puzzle generator.
 *
 * Combines:
 * - ParamsProvider (responsible for diffScore + seed logic)
 * - generate function (builds final puzzle from params)
 *
 * @template TPuzzle - output puzzle type
 * @template TParams - input params type for generator
 *
 * @param generate - function that converts params into a puzzle
 * @param paramsProvider - provider that resolves params by level/tier
 */
export function createPuzzleGenerator<TPuzzle, TParams>(
  generate: (params: TParams) => TPuzzle,
  paramsProvider: ParamsProvider<TParams>,
): PuzzleGenerator<TPuzzle> {
  return {
    /**
     * Generate puzzle based on level.
     */
    byLevel(level: number): TPuzzle {
      return generate(paramsProvider.byLevel(level));
    },

    /**
     * Generate puzzle based on tier.
     *
     * If seed is not provided, a random seed will be used.
     */
    byTier(tierIdx: number, seed?: number): TPuzzle {
      const resolvedSeed = seed ?? getRandomSeed();

      return generate(paramsProvider.byTier(tierIdx, resolvedSeed));
    },
  };
}
