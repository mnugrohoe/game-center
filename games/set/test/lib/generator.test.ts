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
    .join("|");
}

function buildUsageMap(sets: [SetCard, SetCard, SetCard][]) {
  const usage = new Map<string, number>();

  for (const set of sets) {
    for (const card of set) {
      usage.set(card.id, (usage.get(card.id) ?? 0) + 1);
    }
  }

  return usage;
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

  it("contains unique cards only", () => {
    const tier = SET_DIFF_TIERS[0];

    const result = generateSetBoard(tier, 888);

    const ids = result.cards.map((c) => c.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("matches target board size", () => {
    for (const tier of SET_DIFF_TIERS) {
      const result = generateSetBoard(tier, 111);

      expect(result.cards.length).toBe(tier.boardCols * tier.boardRows);
    }
  });

  it("meets minimum target sets", () => {
    for (const tier of SET_DIFF_TIERS) {
      const result = generateSetBoard(tier, 222);

      expect(result.sets.length).toBeGreaterThanOrEqual(tier.targetSets);
    }
  });

  it("does not exceed allowed extra sets", () => {
    for (const tier of SET_DIFF_TIERS) {
      const result = generateSetBoard(tier, 333);

      expect(result.sets.length).toBeLessThanOrEqual(
        tier.targetSets + tier.maxExtraSets + 1,
      );
    }
  });

  it("supports overlapping sets on higher difficulties", () => {
    const tier = SET_DIFF_TIERS[3];

    const result = generateSetBoard(tier, 555);

    const usage = buildUsageMap(result.sets);

    const overlapping = [...usage.values()].filter((v) => v > 1);

    expect(overlapping.length).toBeGreaterThan(0);
  });

  it("is deterministic for same seed", () => {
    const tier = SET_DIFF_TIERS[0];

    const a = generateSetBoard(tier, 777777);

    const b = generateSetBoard(tier, 777777);

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

  it("returns metrics", () => {
    const tier = SET_DIFF_TIERS[2];

    const result = generateSetBoard(tier, 9999);

    expect(result.metrics.totalSets).toBe(result.sets.length);

    expect(result.metrics.deadCards).toBeGreaterThanOrEqual(0);

    expect(result.metrics.overlapAverage).toBeGreaterThanOrEqual(0);

    expect(result.metrics.overlapMax).toBeGreaterThanOrEqual(0);
  });

  it("metrics match actual board analysis", () => {
    const tier = SET_DIFF_TIERS[2];

    const result = generateSetBoard(tier, 999);

    const usage = buildUsageMap(result.sets);

    let deadCards = 0;

    for (const card of result.cards) {
      if (!usage.has(card.id)) {
        deadCards++;
      }
    }

    expect(result.metrics.totalSets).toBe(result.sets.length);

    expect(result.metrics.deadCards).toBe(deadCards);
  });

  it("all returned sets are unique", () => {
    const tier = SET_DIFF_TIERS[2];

    const result = generateSetBoard(tier, 13579);

    const normalized = result.sets.map(normalizeSet);

    expect(new Set(normalized).size).toBe(normalized.length);
  });

  it("all sets contain exactly 3 unique cards", () => {
    const tier = SET_DIFF_TIERS[2];

    const result = generateSetBoard(tier, 24680);

    for (const set of result.sets) {
      const ids = set.map((c) => c.id);

      expect(new Set(ids).size).toBe(3);
    }
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
