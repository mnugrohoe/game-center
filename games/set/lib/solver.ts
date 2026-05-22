// solver.ts

import { COLORS, COUNTS, SYMBOLS, TEXTURES } from "./constants";
import { SetCard } from "./types";
import { isValidSet } from "./validator";

/*
───────────────────────────────────────
SOLVE ALL SETS
───────────────────────────────────────
*/

export function findAllSets(cards: SetCard[]) {
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

/*
───────────────────────────────────────
COMPLETE FEATURE
───────────────────────────────────────
*/

function completeFeature<T>(a: T, b: T, all: readonly T[]): T {
  /**
   * Same -> same
   */
  if (a === b) return a;

  /**
   * Different -> third unique value
   */
  return all.find((v) => v !== a && v !== b)!;
}

/*
───────────────────────────────────────
COMPLETE SET
Given 2 cards, compute the 3rd.
───────────────────────────────────────
*/

export function completeSet(a: SetCard, b: SetCard): SetCard {
  return {
    id: crypto.randomUUID(),

    symbol: completeFeature(a.symbol, b.symbol, SYMBOLS),

    color: completeFeature(a.color, b.color, COLORS),

    texture: completeFeature(a.texture, b.texture, TEXTURES),

    count: completeFeature(a.count, b.count, COUNTS),
  };
}
