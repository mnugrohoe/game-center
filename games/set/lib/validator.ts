// validator.ts

import { SetCard } from "./types";

/**
 * Validates whether a feature collection satisfies SET rules.
 *
 * A feature is considered valid when:
 * - all values are identical
 * OR
 * - all values are unique
 *
 * Examples:
 * - ["red", "red", "red"] → valid
 * - ["red", "green", "purple"] → valid
 * - ["red", "red", "green"] → invalid
 *
 * @typeParam T - Feature value type.
 * @param values - Feature values to validate.
 * @returns True if the feature satisfies SET rules.
 */
export function validFeature<T>(values: readonly T[]): boolean {
  const unique = new Set(values).size;

  return unique === 1 || unique === values.length;
}

/**
 * Validates whether three cards form a legal SET.
 *
 * SET rules:
 * - Exactly 3 cards are required.
 * - Card IDs must all be unique.
 * - Each feature must be either:
 *   - all identical
 *   - all different
 *
 * Features checked:
 * - symbol
 * - color
 * - texture
 * - count
 *
 * @param cards - Candidate SET cards.
 * @returns True if the cards form a valid SET.
 */
export function isValidSet(cards: readonly SetCard[]): boolean {
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
