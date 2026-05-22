// generator.ts

import { ALL_CARDS } from "./constants";
import { SET_DIFF_TIERS } from "./difficulty";

import { completeSet, findAllSets } from "./solver";

import type { Difficulty, SetCard } from "./types";

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
  metrics: BoardMetrics;
}

export interface BoardMetrics {
  totalSets: number;
  deadCards: number;
  overlapAverage: number;
  overlapMax: number;
}

/*
───────────────────────────────────────
UTILS
───────────────────────────────────────
*/

function pick<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

function replaceCard(
  cards: SetCard[],
  oldCardId: string,
  nextCard: SetCard,
): SetCard[] {
  return cards.map((c) => {
    if (c.id === oldCardId) {
      return nextCard;
    }

    return c;
  });
}

/*
───────────────────────────────────────
USAGE MAP
───────────────────────────────────────
*/

function buildUsageMap(
  sets: [SetCard, SetCard, SetCard][],
): Map<string, number> {
  const usage = new Map<string, number>();

  for (const set of sets) {
    for (const card of set) {
      usage.set(card.id, (usage.get(card.id) ?? 0) + 1);
    }
  }

  return usage;
}

/*
───────────────────────────────────────
ANALYZE BOARD
───────────────────────────────────────
*/

function analyzeBoard(
  cards: SetCard[],
  sets: [SetCard, SetCard, SetCard][],
): BoardMetrics {
  const usage = buildUsageMap(sets);

  let deadCards = 0;

  for (const card of cards) {
    if (!usage.has(card.id)) {
      deadCards++;
    }
  }

  const overlaps = [...usage.values()];

  const overlapAverage =
    overlaps.length === 0
      ? 0
      : overlaps.reduce((a, b) => a + b, 0) / overlaps.length;

  const overlapMax = Math.max(...overlaps, 0);

  return {
    totalSets: sets.length,
    deadCards,
    overlapAverage,
    overlapMax,
  };
}

/*
───────────────────────────────────────
VALIDATE
───────────────────────────────────────
*/

function validateBoard(
  tier: Difficulty,
  cards: SetCard[],
  sets: [SetCard, SetCard, SetCard][],
): boolean {
  /*
  ───────────────────────────────────────
  TARGET SETS
  ───────────────────────────────────────
  */

  if (sets.length < tier.targetSets) {
    return false;
  }

  if (sets.length > tier.targetSets + tier.maxExtraSets) {
    return false;
  }

  return true;
}

/*
───────────────────────────────────────
INITIAL RANDOM BOARD
───────────────────────────────────────
*/

function createInitialBoard(size: number, rng: () => number): SetCard[] {
  return shuffle([...ALL_CARDS], rng).slice(0, size);
}

/*
───────────────────────────────────────
ADD SET MUTATION
Force create 1 valid set
───────────────────────────────────────
*/

function addSetMutation(board: SetCard[], rng: () => number): SetCard[] {
  const solvedSets = findAllSets(board);

  const usage = buildUsageMap(solvedSets);

  /*
  ───────────────────────────────────────
  PRIORITY:
  replace dead cards first
  ───────────────────────────────────────
  */

  const deadCards = board.filter((c) => !usage.has(c.id));

  const replaceTarget =
    deadCards.length > 0 ? pick(deadCards, rng) : pick(board, rng);

  /*
  ───────────────────────────────────────
  PICK 2 RANDOM CARDS
  ───────────────────────────────────────
  */

  const a = pick(board, rng);

  const candidates = board.filter((c) => c.id !== a.id);

  const b = pick(candidates, rng);

  /*
  ───────────────────────────────────────
  COMPLETE SET
  ───────────────────────────────────────
  */

  const needed = completeSet(a, b);

  /*
  ───────────────────────────────────────
  AVOID DUPLICATES
  ───────────────────────────────────────
  */

  const exists = board.some((c) => c.id === needed.id);

  if (exists) {
    return board;
  }

  return replaceCard(board, replaceTarget.id, needed);
}

/*
───────────────────────────────────────
BREAK SET MUTATION
Reduce excessive sets
───────────────────────────────────────
*/

function breakSetMutation(board: SetCard[], rng: () => number): SetCard[] {
  const solvedSets = findAllSets(board);

  const usage = buildUsageMap(solvedSets);

  /*
  ───────────────────────────────────────
  PICK MOST OVERUSED CARD
  ───────────────────────────────────────
  */

  let worstCardId: string | null = null;

  let highestUsage = -1;

  for (const [id, count] of usage.entries()) {
    if (count > highestUsage) {
      highestUsage = count;

      worstCardId = id;
    }
  }

  if (!worstCardId) {
    return board;
  }

  /*
  ───────────────────────────────────────
  FIND SAFE REPLACEMENT
  ───────────────────────────────────────
  */

  const usedIds = new Set(board.map((c) => c.id));

  const pool = shuffle(
    ALL_CARDS.filter((c) => !usedIds.has(c.id)),
    rng,
  );

  let bestBoard = board;

  let bestSetCount = solvedSets.length;

  for (const candidate of pool.slice(0, 20)) {
    const nextBoard = replaceCard(board, worstCardId, candidate);

    const nextSets = findAllSets(nextBoard);

    if (nextSets.length < bestSetCount) {
      bestSetCount = nextSets.length;

      bestBoard = nextBoard;
    }
  }

  return bestBoard;
}

/*
───────────────────────────────────────
OPTIMIZER
Incremental repair algorithm
───────────────────────────────────────
*/

function optimizeBoard(
  tier: Difficulty,
  initialBoard: SetCard[],
  rng: () => number,
): SetCard[] {
  let board = [...initialBoard];

  /*
  ───────────────────────────────────────
  CONVERGENCE LOOP
  ───────────────────────────────────────
  */

  for (let step = 0; step < 200; step++) {
    const solvedSets = findAllSets(board);

    /*
    ───────────────────────────────────────
    SUCCESS
    ───────────────────────────────────────
    */

    if (validateBoard(tier, board, solvedSets)) {
      return board;
    }

    /*
    ───────────────────────────────────────
    NEED MORE SETS
    ───────────────────────────────────────
    */

    if (solvedSets.length < tier.targetSets) {
      board = addSetMutation(board, rng);

      continue;
    }

    /*
    ───────────────────────────────────────
    TOO MANY SETS
    ───────────────────────────────────────
    */

    if (solvedSets.length > tier.targetSets + tier.maxExtraSets) {
      board = breakSetMutation(board, rng);

      continue;
    }

    /*
    ───────────────────────────────────────
    MICRO SHUFFLE
    ───────────────────────────────────────
    */

    board = shuffle(board, rng);
  }

  /*
  ───────────────────────────────────────
  FALLBACK
  practically impossible now
  ───────────────────────────────────────
  */

  return board;
}

/*
───────────────────────────────────────
MAIN GENERATOR
───────────────────────────────────────
*/

export function generateSetBoard(
  tier: Difficulty,
  seed: number,
): GeneratedSetBoard {
  const rng = mkRng(seed);

  const size = tier.boardCols * tier.boardRows;

  /*
  ───────────────────────────────────────
  INITIAL BOARD
  ───────────────────────────────────────
  */

  const initialBoard = createInitialBoard(size, rng);

  /*
  ───────────────────────────────────────
  OPTIMIZE
  ───────────────────────────────────────
  */

  const board = optimizeBoard(tier, initialBoard, rng);

  /*
  ───────────────────────────────────────
  SOLVE FINAL
  ───────────────────────────────────────
  */

  const solvedSets = findAllSets(board);

  /*
  ───────────────────────────────────────
  METRICS
  ───────────────────────────────────────
  */

  const metrics = analyzeBoard(board, solvedSets);

  return {
    cards: board,

    sets: solvedSets,

    tier,

    seed,

    metrics,
  };
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
    Math.floor(levelToDiffScore(level)),
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
