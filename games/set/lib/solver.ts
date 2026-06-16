// games/set/lib/solver.ts

import { COLORS, COUNTS, SYMBOLS, TEXTURES } from "./constants";
import type { CardType } from "./types";
import { isValidSet } from "./validator";

/**
 * Generates a deterministic unique signature string for a SET card.
 * Uses a hyphen-delimited format matching generator lookup structures.
 */
export function cardSignature(card: Omit<CardType, "id">): string {
  return [card.symbol, card.color, card.texture, card.count].join("-");
}

/**
 * Finds every valid SET combination on a board with optimized execution time.
 * Reduces loop checks from O(N^3) to O(N^2) using a Map index lookup.
 */
export function findAllSets(
  cards: CardType[],
): [CardType, CardType, CardType][] {
  const sets: [CardType, CardType, CardType][] = [];
  const cardIndexMap = new Map<string, { card: CardType; index: number }>();

  for (let i = 0; i < cards.length; i++) {
    cardIndexMap.set(cards[i].id, { card: cards[i], index: i });
  }

  for (let i = 0; i < cards.length - 1; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      const cardA = cards[i];
      const cardB = cards[j];

      const neededCard = completeSet(cardA, cardB);
      const matchData = cardIndexMap.get(neededCard.id);

      if (matchData) {
        const { card: match, index: matchIdx } = matchData;

        if (i < matchIdx && j < matchIdx) {
          const combo: [CardType, CardType, CardType] = [cardA, cardB, match];
          if (isValidSet(combo)) {
            sets.push(combo);
          }
        }
      }
    }
  }

  return sets;
}

/**
 * Computes the required third feature value needed to complete a valid matching triplet.
 */
function completeFeature<T>(a: T, b: T, all: readonly T[]): T {
  if (a === b) return a;
  return all.find((v) => v !== a && v !== b)!;
}

/**
 * Computes the exact third card signature required to satisfy a valid SET rule.
 */
export function completeSet(a: CardType, b: CardType): CardType {
  const completed: Omit<CardType, "id"> = {
    symbol: completeFeature(a.symbol, b.symbol, SYMBOLS),
    color: completeFeature(a.color, b.color, COLORS),
    texture: completeFeature(a.texture, b.texture, TEXTURES),
    count: completeFeature(a.count, b.count, COUNTS),
  };

  const signature = cardSignature(completed);

  return {
    id: signature,
    ...completed,
  };
}
