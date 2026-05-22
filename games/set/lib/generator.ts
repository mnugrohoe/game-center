// generator.ts

import { ALL_CARDS } from "./constants";
import { SET_DIFF_TIERS } from "./difficulty";
import { completeSet, findAllSets } from "./solver";

import { Difficulty, SetCard } from "./types";

import {
  clamp,
  levelToDiffScore,
  mkRng,
  seedFromDiff,
  seedFromLevel,
  shuffle,
} from "@/shared/algorithms";

export interface GeneratedSetBoard {
  cards: SetCard[];
  sets: [SetCard, SetCard, SetCard][];
  tier: Difficulty;
  seed: number;
}

/*
───────────────────────────────────────
UTILS
───────────────────────────────────────
*/

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function setKey(cards: [SetCard, SetCard, SetCard]) {
  return cards
    .map((c) => c.id)
    .sort()
    .join("-");
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
  const rng = mkRng(seed);

  const size = tier.boardCols * tier.boardRows;

  const MAX_ATTEMPTS = 250;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    /*
    ───────────────────────────────────────
    STEP 1:
    BUILD INTERCONNECTED SET GRAPH
    ───────────────────────────────────────
    */

    const generatedSets: [SetCard, SetCard, SetCard][] = [];

    const usedCards = new Map<string, SetCard>();

    const deck = shuffle([...ALL_CARDS], rng);

    /**
     * Seed first set
     */
    const a = deck.pop();
    const b = deck.pop();

    if (!a || !b) continue;

    const c = completeSet(a, b);

    /**
     * Prevent accidental duplicates
     */
    if (a.id === c.id || b.id === c.id) {
      continue;
    }

    generatedSets.push([a, b, c]);

    usedCards.set(a.id, a);
    usedCards.set(b.id, b);
    usedCards.set(c.id, c);

    /*
    ───────────────────────────────────────
    STEP 2:
    EXPAND OVERLAPPING SETS
    ───────────────────────────────────────
    */

    let safety = 0;

    while (generatedSets.length < tier.ensureSets && safety < 500) {
      safety++;

      /**
       * Reuse existing card intentionally
       */
      const existing = pick([...usedCards.values()], rng);

      /**
       * Random partner
       */
      const partner = pick(deck, rng);

      /**
       * Complete set
       */
      const third = completeSet(existing, partner);

      /**
       * Invalid self-duplicates
       */
      if (
        existing.id === partner.id ||
        existing.id === third.id ||
        partner.id === third.id
      ) {
        continue;
      }

      const nextSet: [SetCard, SetCard, SetCard] = [existing, partner, third];

      /**
       * Prevent duplicate sets
       */
      const nextKey = setKey(nextSet);

      const duplicate = generatedSets.some((s) => setKey(s) === nextKey);

      if (duplicate) {
        continue;
      }

      generatedSets.push(nextSet);

      usedCards.set(existing.id, existing);
      usedCards.set(partner.id, partner);
      usedCards.set(third.id, third);
    }

    /*
    ───────────────────────────────────────
    STEP 3:
    BUILD FINAL BOARD
    ───────────────────────────────────────
    */

    const boardCards = [...usedCards.values()];

    /**
     * Fill remaining slots
     */
    const remainingDeck = shuffle(
      ALL_CARDS.filter((c) => !usedCards.has(c.id)),
      rng,
    );

    while (boardCards.length < size && remainingDeck.length > 0) {
      const next = remainingDeck.pop();

      if (!next) break;

      boardCards.push(next);
    }

    /**
     * Trim overflow
     */
    const finalCards = shuffle(boardCards.slice(0, size), rng);

    /*
    ───────────────────────────────────────
    STEP 4:
    SOLVE FINAL BOARD
    ───────────────────────────────────────
    */

    const solvedSets = findAllSets(finalCards);

    /*
    ───────────────────────────────────────
    STEP 5:
    VALIDATION
    ───────────────────────────────────────
    */

    /**
     * Too few sets
     */
    if (solvedSets.length < tier.ensureSets) {
      continue;
    }

    /**
     * Too many sets
     */
    if (solvedSets.length > tier.ensureSets + 3) {
      continue;
    }

    /**
     * Dead cards analysis
     */
    const usage = new Map<string, number>();

    for (const card of finalCards) {
      usage.set(card.id, 0);
    }

    for (const set of solvedSets) {
      for (const card of set) {
        usage.set(card.id, (usage.get(card.id) ?? 0) + 1);
      }
    }

    const deadCards = [...usage.values()].filter((v) => v === 0).length;

    /**
     * Too many useless cards
     */
    if (deadCards >= 5) {
      continue;
    }

    /*
    ───────────────────────────────────────
    SUCCESS
    ───────────────────────────────────────
    */

    return {
      cards: finalCards,
      sets: solvedSets,
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
