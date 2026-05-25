import { COLORS, COUNTS, SYMBOLS, TEXTURES } from "./constants";
import { SET_DIFF_TIERS } from "./difficulty";
import { cardSignature, completeSet, findAllSets } from "./solver";

import type { Difficulty, SetCard } from "./types";

import {
  clamp,
  levelToDiffScore,
  mkRng,
  seedFromDiff,
  seedFromLevel,
  // shuffle,
} from "@/shared/algorithms";

/**
 * =========================
 * TYPES
 * =========================
 */

/**
 * Generated SET board result.
 */
export interface GeneratedSetBoard {
  cards: SetCard[];
  sets: [SetCard, SetCard, SetCard][];
  tier: Difficulty;
  seed: number;
  metrics: BoardMetrics;
}

/**
 * Board quality metrics used for balancing/debugging.
 */
export interface BoardMetrics {
  totalSets: number;
  deadCards: number;
  overlapAverage: number;
  overlapMax: number;
}

/**
 * =========================
 * CONFIG
 * =========================
 */

const MAX_STEPS_FACTOR = 50;

/**
 * =========================
 * UTILS
 * =========================
 */

/**
 * Picks a random element using seeded RNG.
 */
function pick<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

/**
 * Generates a single deterministic SET card.
 */
export function generateCard(rng: () => number): SetCard {
  const card: Omit<SetCard, "id"> = {
    symbol: pick(SYMBOLS, rng),
    color: pick(COLORS, rng),
    texture: pick(TEXTURES, rng),
    count: pick(COUNTS, rng),
  };

  return {
    id: cardSignature(card),
    ...card,
  };
}

/**
 * =========================
 * INITIAL BOARD
 * =========================
 */

/**
 * Creates a unique random board (no duplicate cards).
 */
function createInitialBoard(size: number, rng: () => number): SetCard[] {
  const board: SetCard[] = [];
  const used = new Set<string>();

  let safety = 0;
  const maxSafety = size * 60;

  while (board.length < size && safety++ < maxSafety) {
    const card = generateCard(rng);

    if (used.has(card.id)) continue;

    used.add(card.id);
    board.push(card);
  }

  return board;
}

/**
 * =========================
 * HEURISTIC PAIR SELECTION
 * =========================
 */

/**
 * Picks a better pair candidate (reduces useless replacements).
 */
function pickBestPair(board: SetCard[], rng: () => number): [SetCard, SetCard] {
  if (board.length < 2) {
    throw new Error("Board too small for pairing");
  }

  const a = pick(board, rng);

  let bestB = board[0];
  let bestScore = -1;

  const sampleSize = Math.min(board.length, 12);

  for (let i = 0; i < sampleSize; i++) {
    const b = board[i];
    if (b.id === a.id) continue;

    const c = completeSet(a, b);
    const exists = board.some((x) => x.id === c.id);

    const score = exists ? 0 : 1;

    if (score > bestScore) {
      bestScore = score;
      bestB = b;
    }
  }

  return [a, bestB];
}

/**
 * =========================
 * OPTIMIZER
 * =========================
 */

/**
 * Iteratively improves board until target difficulty is reached.
 *
 * Strategy:
 * - prioritize missing sets
 * - replace dead cards first
 * - avoid duplicates of computed SETs
 */
function optimizeBoard(
  tier: Difficulty,
  initialBoard: SetCard[],
  rng: () => number,
): SetCard[] {
  const board = [...initialBoard];
  const maxSteps = tier.boardCols * tier.boardRows * MAX_STEPS_FACTOR;

  for (let step = 0; step < maxSteps; step++) {
    const sets = findAllSets(board);

    if (sets.length >= tier.targetSets) break;

    /**
     * Build usage map (cards that appear in sets).
     */
    const usage = new Map<string, number>();

    for (const set of sets) {
      for (const c of set) {
        usage.set(c.id, (usage.get(c.id) ?? 0) + 1);
      }
    }

    const dead = board.filter((c) => !usage.has(c.id));
    const replaceTarget = dead.length > 0 ? pick(dead, rng) : pick(board, rng);

    const [a, b] = pickBestPair(board, rng);
    const needed = completeSet(a, b);

    const alreadyExists = board.some((c) => c.id === needed.id);

    if (alreadyExists) continue;

    const nextBoard = board.map((c) =>
      c.id === replaceTarget.id ? needed : c,
    );

    board.splice(0, board.length, ...nextBoard);
  }

  return board;
}

/**
 * =========================
 * METRICS
 * =========================
 */

/**
 * Computes board quality metrics.
 */
function analyzeBoard(
  cards: SetCard[],
  sets: [SetCard, SetCard, SetCard][],
): BoardMetrics {
  const usage = new Map<string, number>();

  for (const set of sets) {
    for (const c of set) {
      usage.set(c.id, (usage.get(c.id) ?? 0) + 1);
    }
  }

  let deadCards = 0;

  for (const c of cards) {
    if (!usage.has(c.id)) deadCards++;
  }

  let sum = 0;
  let max = 0;

  for (const v of usage.values()) {
    sum += v;
    if (v > max) max = v;
  }

  return {
    totalSets: sets.length,
    deadCards,
    overlapAverage: cards.length ? sum / cards.length : 0,
    overlapMax: max,
  };
}

/**
 * =========================
 * PUBLIC API
 * =========================
 */

/**
 * Generates a complete SET board.
 */
export function generateSetBoard(
  tier: Difficulty,
  seed: number,
): GeneratedSetBoard {
  const rng = mkRng(seed);

  const size = tier.boardCols * tier.boardRows;

  const initial = createInitialBoard(size, rng);

  const board = optimizeBoard(tier, initial, rng);

  const sets = findAllSets(board);

  return {
    cards: board,
    sets,
    tier,
    seed,
    metrics: analyzeBoard(board, sets),
  };
}

/**
 * Generate by difficulty score.
 */
export function generateByDifficulty(
  diffScore: number,
  entropy = 1,
): GeneratedSetBoard {
  const tier = SET_DIFF_TIERS[diffScore];

  if (!tier) throw new Error(`Invalid diffScore: ${diffScore}`);

  return generateSetBoard(tier, seedFromDiff(diffScore, entropy));
}

/**
 * Generate by tier index.
 */
export function generateByTier(
  tierIdx: number,
  entropy = 1,
): GeneratedSetBoard {
  const tier = SET_DIFF_TIERS[tierIdx];

  if (!tier) throw new Error(`Invalid tier index: ${tierIdx}`);

  return generateSetBoard(tier, seedFromDiff(tierIdx, entropy));
}

/**
 * Generate by player level progression.
 */
export function generateByLevel(level: number): GeneratedSetBoard {
  const diffScore = clamp(
    Math.floor(levelToDiffScore(level)),
    0,
    SET_DIFF_TIERS.length - 1,
  );

  const tier = SET_DIFF_TIERS[diffScore];

  if (!tier) throw new Error(`No tier for level: ${level}`);

  return generateSetBoard(tier, seedFromLevel(level));
}
