// validator.ts

import { SetCard } from "./types";

export function validFeature<T>(values: T[]): boolean {
  const unique = new Set(values).size;

  return unique === 1 || unique === 3;
}

export function isValidSet(cards: SetCard[]): boolean {
  if (cards.length !== 3) return false;

  return (
    validFeature(cards.map((c) => c.symbol)) &&
    validFeature(cards.map((c) => c.color)) &&
    validFeature(cards.map((c) => c.texture)) &&
    validFeature(cards.map((c) => c.count))
  );
}
