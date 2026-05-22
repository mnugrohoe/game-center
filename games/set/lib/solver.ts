// solver.ts

import { ALL_CARDS, COLORS, COUNTS, SYMBOLS, TEXTURES } from "./constants";

import { SetCard } from "./types";

import { isValidSet } from "./validator";

/*
───────────────────────────────────────
CARD LOOKUP
───────────────────────────────────────
*/

const CARD_LOOKUP = new Map<string, SetCard>();

for (const card of ALL_CARDS) {
  CARD_LOOKUP.set(cardSignature(card), card);
}

/*
───────────────────────────────────────
SIGNATURE
───────────────────────────────────────
*/

export function cardSignature(card: SetCard): string {
  return [card.symbol, card.color, card.texture, card.count].join("|");
}

/*
───────────────────────────────────────
SOLVE ALL SETS
───────────────────────────────────────
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

/*
───────────────────────────────────────
COMPLETE FEATURE
───────────────────────────────────────
*/

function completeFeature<T>(a: T, b: T, all: readonly T[]): T {
  /*
  ───────────────────────────────────────
  SAME -> SAME
  ───────────────────────────────────────
  */

  if (a === b) {
    return a;
  }

  /*
  ───────────────────────────────────────
  DIFFERENT -> THIRD UNIQUE
  ───────────────────────────────────────
  */

  return all.find((v) => v !== a && v !== b)!;
}

/*
───────────────────────────────────────
COMPLETE SET
Given 2 cards, compute the REAL 3rd card.
───────────────────────────────────────
*/

export function completeSet(a: SetCard, b: SetCard): SetCard {
  const completed: Omit<SetCard, "id"> = {
    symbol: completeFeature(a.symbol, b.symbol, SYMBOLS),

    color: completeFeature(a.color, b.color, COLORS),

    texture: completeFeature(a.texture, b.texture, TEXTURES),

    count: completeFeature(a.count, b.count, COUNTS),
  };

  const signature = [
    completed.symbol,
    completed.color,
    completed.texture,
    completed.count,
  ].join("|");

  const realCard = CARD_LOOKUP.get(signature);

  if (!realCard) {
    throw new Error(`Unable to find real SET card: ${signature}`);
  }

  return realCard;
}
