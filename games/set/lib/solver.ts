// solver.ts

import { COLORS, COUNTS, SYMBOLS, TEXTURES } from "./constants";

import { SetCard } from "./types";

import { isValidSet } from "./validator";

/**
 * Generates a deterministic unique signature for a SET card.
 *
 * The signature is used for:
 * - map lookups
 * - deduplication
 * - canonical card reconstruction
 *
 * @param card - SET card.
 * @returns Pipe-delimited card signature.
 */
export function cardSignature(card: Omit<SetCard, "id">): string {
  return [card.symbol, card.color, card.texture, card.count].join("-");
}

/**
 * Finds every valid SET combination on a board.
 *
 * Performs a brute-force search across all 3-card combinations.
 *
 * @param cards - Board cards.
 * @returns Array of all valid SET triples.
 */
export function findAllSets(cards: SetCard[]): [SetCard, SetCard, SetCard][] {
  const sets: [SetCard, SetCard, SetCard][] = [];

  for (let i = 0; i < cards.length - 2; i++) {
    for (let j = i + 1; j < cards.length - 1; j++) {
      for (let k = j + 1; k < cards.length; k++) {
        const combo: [SetCard, SetCard, SetCard] = [
          cards[i],
          cards[j],
          cards[k],
        ];

        if (isValidSet(combo)) {
          sets.push(combo);
        }
      }
    }
  }

  return sets;
}

/**
 * Computes the required third feature value needed to complete a SET.
 *
 * SET rule:
 * - If two values are identical, the third must match.
 * - If two values differ, the third must be the remaining unique value.
 *
 * @typeParam T - Feature value type.
 * @param a - First feature value.
 * @param b - Second feature value.
 * @param all - Full list of possible feature values.
 * @returns Completing feature value.
 */
function completeFeature<T>(a: T, b: T, all: readonly T[]): T {
  if (a === b) {
    return a;
  }

  return all.find((v) => v !== a && v !== b)!;
}

/**
 * Computes the exact third card required to complete a valid SET.
 *
 * Uses SET rules independently across:
 * - symbol
 * - color
 * - texture
 * - count
 *
 * The resulting feature combination is resolved into the canonical
 * card instance using the global card lookup table.
 *
 * @param a - First card.
 * @param b - Second card.
 * @returns The unique completing SET card.
 * @throws Error if the reconstructed card cannot be found.
 */
export function completeSet(a: SetCard, b: SetCard): SetCard {
  const completed: Omit<SetCard, "id"> = {
    symbol: completeFeature(a.symbol, b.symbol, SYMBOLS),
    color: completeFeature(a.color, b.color, COLORS),
    texture: completeFeature(a.texture, b.texture, TEXTURES),
    count: completeFeature(a.count, b.count, COUNTS),
  };

  const signature = cardSignature(completed);

  const realCard: SetCard = {
    id: signature,
    ...completed,
  };

  if (!realCard) {
    throw new Error(`Unable to find real SET card: ${signature}`);
  }

  return realCard;
}
