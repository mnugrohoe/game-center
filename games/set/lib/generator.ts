// generator.ts

import { ALL_CARDS } from "./constants";
import { SET_DIFF_TIERS } from "./difficulty";
import { findAllSets } from "./solver";

import { Difficulty, SetCard } from "./types";

import {
  clamp,
  levelToDiffScore,
  mkRng,
  seedFromDiff,
  seedFromLevel,
  shuffle,
} from "@/shared/algorithms";

import { validFeature } from "./validator";

export interface GeneratedSetBoard {
  cards: SetCard[];
  sets: [SetCard, SetCard, SetCard][];
  tier: Difficulty;
  seed: number;
}

/*
───────────────────────────────────────
HELPERS
───────────────────────────────────────
*/

function countValidFeatures(cards: [SetCard, SetCard, SetCard]) {
  const [a, b, c] = cards;

  let valid = 0;
  if (validFeature([a.symbol, b.symbol, c.symbol])) valid++;
  if (validFeature([a.color, b.color, c.color])) valid++;
  if (validFeature([a.texture, b.texture, c.texture])) valid++;
  if (validFeature([a.count, b.count, c.count])) valid++;
  return valid;
}

/*
───────────────────────────────────────
CORE
───────────────────────────────────────
*/

export function generateSetBoard(
  tier: Difficulty,
  seed: number,
): GeneratedSetBoard {
  const size = tier.boardCols * tier.boardRows;
  const rng = mkRng(seed);
  const MAX_ATTEMPTS = 2500;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    /**
     * Shuffle full deck.
     */
    const pool = shuffle([...ALL_CARDS], rng);

    /**
     * Build board.
     */
    const cards = pool.slice(0, size);

    /**
     * Solve board.
     */
    const sets = findAllSets(cards);

    /**
     * Too few sets.
     */
    if (sets.length < tier.ensureSets) {
      continue;
    }

    /**
     * Too many sets.
     */
    if (sets.length > tier.ensureSets + 2) {
      continue;
    }

    /**
     * Card usage analysis.
     */
    const usage = new Map<string, number>();

    for (const card of cards) {
      usage.set(card.id, 0);
    }

    for (const set of sets) {
      for (const card of set) {
        usage.set(card.id, (usage.get(card.id) ?? 0) + 1);
      }
    }

    /**
     * Dead cards.
     */
    const deadCards = [...usage.values()].filter((v) => v === 0).length;

    if (deadCards >= 5) {
      continue;
    }

    /**
     * Near miss density.
     */
    if (tier.allowNearMiss) {
      let nearMisses = 0;

      for (let i = 0; i < cards.length - 2; i++) {
        for (let j = i + 1; j < cards.length - 1; j++) {
          for (let k = j + 1; k < cards.length; k++) {
            const combo: [SetCard, SetCard, SetCard] = [
              cards[i],
              cards[j],
              cards[k],
            ];

            /**
             * Near miss:
             * 3 valid feature + 1 invalid feature
             */
            if (countValidFeatures(combo) === 3) {
              nearMisses++;
            }
          }
        }
      }

      if (nearMisses < tier.ensureSets * 2) {
        continue;
      }
    }

    /**
     * SUCCESS
     */
    return {
      cards,
      sets,
      tier,
      seed,
    };
  }

  throw new Error(`Failed generating SET board after ${MAX_ATTEMPTS} attempts`);
}

/*
───────────────────────────────────────
BY DIFFICULTY
───────────────────────────────────────
*/

export function generateByDifficulty(
  diffScore: number,
  entropy = 1,
): GeneratedSetBoard {
  const tier = SET_DIFF_TIERS[diffScore];

  if (!tier) {
    throw new Error(`No difficulty tier found for score: ${diffScore}`);
  }

  const seed = seedFromDiff(diffScore, entropy);

  return generateSetBoard(tier, seed);
}

/*
───────────────────────────────────────
BY TIER
───────────────────────────────────────
*/

export function generateByTier(
  tierIdx: number,
  entropy = 1,
): GeneratedSetBoard {
  const tier = SET_DIFF_TIERS[tierIdx];

  if (!tier) {
    throw new Error(`There's no tier at index: ${tierIdx}`);
  }

  const seed = seedFromDiff(tierIdx, entropy);

  return generateSetBoard(tier, seed);
}

/*
───────────────────────────────────────
BY LEVEL
───────────────────────────────────────
*/

export function generateByLevel(level: number): GeneratedSetBoard {
  const diffScore = clamp(
    levelToDiffScore(level),
    0,
    SET_DIFF_TIERS.length - 1,
  );

  const tier = SET_DIFF_TIERS[diffScore];

  if (!tier) {
    throw new Error(`No difficulty tier found for score: ${diffScore}`);
  }

  const seed = seedFromLevel(level);

  return generateSetBoard(tier, seed);
}
