// solver.ts

import { SetCard } from "./types";
import { isValidSet } from "./validator";

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
