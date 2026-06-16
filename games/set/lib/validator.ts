// games/set/lib/validator.ts

import type { CardType } from "./types";

/**
 * Validates whether a feature collection satisfies SET rules.
 * * A feature is considered valid when:
 * - all values are identical
 * OR
 * - all values are completely unique
 */
export function validFeature<T>(values: readonly T[]): boolean {
  const unique = new Set(values).size;
  return unique === 1 || unique === values.length;
}

/**
 * Validates whether three cards form a legal, playable SET.
 */
export function isValidSet(cards: readonly CardType[]): boolean {
  if (cards.length !== 3) {
    return false;
  }

  const uniqueCards = new Set(cards.map((c) => c.id));
  if (uniqueCards.size !== 3) {
    return false;
  }

  return (
    validFeature(cards.map((c) => c.symbol)) &&
    validFeature(cards.map((c) => c.color)) &&
    validFeature(cards.map((c) => c.texture)) &&
    validFeature(cards.map((c) => c.count))
  );
}
