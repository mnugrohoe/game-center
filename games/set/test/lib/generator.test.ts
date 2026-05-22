// generator.test.ts

import { describe, expect, it } from "vitest";

import {
  generateByDifficulty,
  generateByLevel,
  generateByTier,
  generateSetBoard,
} from "@/games/set/lib/generator";

import { SET_DIFF_TIERS } from "@/games/set/lib/difficulty";
import { findAllSets } from "@/games/set/lib/solver";
import type { SetCard } from "@/games/set/lib/types";

/*
───────────────────────────────────────
HELPERS
───────────────────────────────────────
*/

function normalizeSet(set: [SetCard, SetCard, SetCard]) {
  return set
    .map((c) => c.id)
    .sort()
    .join("-");
}

/*
───────────────────────────────────────
generateSetBoard
───────────────────────────────────────
*/

describe("generateSetBoard", () => {
  it("generates a board", () => {
    const tier = SET_DIFF_TIERS[0];

    const result = generateSetBoard(tier, 12345);

    expect(result.cards.length).toBe(tier.boardCols * tier.boardRows);

    expect(result.sets.length).toBeGreaterThan(0);
  });

  it("returns solved sets matching solver output", () => {
    const tier = SET_DIFF_TIERS[0];

    const result = generateSetBoard(tier, 999);

    const solved = findAllSets(result.cards);

    const a = solved.map(normalizeSet).sort();

    const b = result.sets.map(normalizeSet).sort();

    expect(a).toEqual(b);
  });

  it("contains at least required amount of sets", () => {
    for (const tier of SET_DIFF_TIERS) {
      const result = generateSetBoard(tier, 123);

      expect(result.sets.length).toBeGreaterThanOrEqual(tier.ensureSets);
    }
  });

  it("does not exceed set cap by too much", () => {
    for (const tier of SET_DIFF_TIERS) {
      const result = generateSetBoard(tier, 456);

      expect(result.sets.length).toBeLessThanOrEqual(tier.ensureSets + 3);
    }
  });

  it("has unique cards", () => {
    const tier = SET_DIFF_TIERS[0];

    const result = generateSetBoard(tier, 888);

    const ids = result.cards.map((c) => c.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("allows overlapping sets", () => {
    const tier = SET_DIFF_TIERS[2];

    const result = generateSetBoard(tier, 777);

    const usage = new Map<string, number>();

    for (const set of result.sets) {
      for (const card of set) {
        usage.set(card.id, (usage.get(card.id) ?? 0) + 1);
      }
    }

    const overlappingCards = [...usage.values()].filter((v) => v > 1);

    expect(overlappingCards.length).toBeGreaterThan(0);
  });

  it("limits dead cards", () => {
    const tier = SET_DIFF_TIERS[1];

    const result = generateSetBoard(tier, 444);

    const usage = new Map<string, number>();

    for (const card of result.cards) {
      usage.set(card.id, 0);
    }

    for (const set of result.sets) {
      for (const card of set) {
        usage.set(card.id, (usage.get(card.id) ?? 0) + 1);
      }
    }

    const deadCards = [...usage.values()].filter((v) => v === 0);

    expect(deadCards.length).toBeLessThan(5);
  });

  it("is deterministic for same seed", () => {
    const tier = SET_DIFF_TIERS[0];

    const a = generateSetBoard(tier, 123456);

    const b = generateSetBoard(tier, 123456);

    const idsA = a.cards.map((c) => c.id);

    const idsB = b.cards.map((c) => c.id);

    expect(idsA).toEqual(idsB);
  });

  it("produces different boards for different seeds", () => {
    const tier = SET_DIFF_TIERS[0];

    const a = generateSetBoard(tier, 111);

    const b = generateSetBoard(tier, 222);

    const idsA = a.cards.map((c) => c.id);

    const idsB = b.cards.map((c) => c.id);

    expect(idsA).not.toEqual(idsB);
  });
});

/*
───────────────────────────────────────
generateByDifficulty
───────────────────────────────────────
*/

describe("generateByDifficulty", () => {
  it("generates from diff score", () => {
    const result = generateByDifficulty(0);

    expect(result.cards.length).toBeGreaterThan(0);
  });

  it("throws on invalid diff score", () => {
    expect(() => generateByDifficulty(9999)).toThrow();
  });
});

/*
───────────────────────────────────────
generateByTier
───────────────────────────────────────
*/

describe("generateByTier", () => {
  it("generates from tier index", () => {
    const result = generateByTier(0);

    expect(result.cards.length).toBeGreaterThan(0);
  });

  it("throws on invalid tier", () => {
    expect(() => generateByTier(9999)).toThrow();
  });
});

/*
───────────────────────────────────────
generateByLevel
───────────────────────────────────────
*/

describe("generateByLevel", () => {
  it("generates from level", () => {
    const result = generateByLevel(1);

    expect(result.cards.length).toBeGreaterThan(0);
  });

  it("clamps very high levels safely", () => {
    const result = generateByLevel(999999);

    expect(result.cards.length).toBeGreaterThan(0);
  });

  it("clamps negative levels safely", () => {
    const result = generateByLevel(-999);

    expect(result.cards.length).toBeGreaterThan(0);
  });
});
