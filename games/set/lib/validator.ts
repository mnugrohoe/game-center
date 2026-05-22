// validator.ts

import { SetCard } from "./types";

/*
───────────────────────────────────────
VALID FEATURE
A feature is valid when:
- all same
OR
- all different
───────────────────────────────────────
*/

export function validFeature<T>(values: readonly T[]): boolean {
  const unique = new Set(values).size;

  return unique === 1 || unique === values.length;
}

/*
───────────────────────────────────────
VALID SET
───────────────────────────────────────
*/

export function isValidSet(cards: readonly SetCard[]): boolean {
  /*
  ───────────────────────────────────────
  MUST BE EXACTLY 3
  ───────────────────────────────────────
  */

  if (cards.length !== 3) {
    return false;
  }

  /*
  ───────────────────────────────────────
  PREVENT DUPLICATE CARD IDS
  Important after graph generation.
  ───────────────────────────────────────
  */

  const uniqueCards = new Set(cards.map((c) => c.id));

  if (uniqueCards.size !== 3) {
    return false;
  }

  /*
  ───────────────────────────────────────
  FEATURE VALIDATION
  ───────────────────────────────────────
  */

  return (
    validFeature(cards.map((c) => c.symbol)) &&
    validFeature(cards.map((c) => c.color)) &&
    validFeature(cards.map((c) => c.texture)) &&
    validFeature(cards.map((c) => c.count))
  );
}
