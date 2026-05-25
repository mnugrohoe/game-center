import { describe, it, expect } from "vitest";

import { mkRng } from "@/shared/algorithms";

import {
  generateCard,
  generateSetBoard,
  generateByDifficulty,
  generateByTier,
  generateByLevel,
} from "./generator";

import { SET_DIFF_TIERS } from "./difficulty";
import { findAllSets } from "./solver";
import { isValidSet } from "./validator";
import { SetCard } from "./types";

/**
 * =========================
 * HELPERS
 * =========================
 */

function assertUniqueCards(cards: { id: string }[]) {
  const set = new Set(cards.map((c) => c.id));
  expect(set.size).toBe(cards.length);
}

function assertValidSets(board: SetCard[]) {
  const sets = findAllSets(board);
  for (const set of sets) {
    expect(isValidSet(set)).toBe(true);
  }
}

/**
 * =========================
 * generateCard
 * =========================
 */

describe("generateCard", () => {
  it("should generate deterministic card from seed", () => {
    const rng = mkRng(123);

    const a = generateCard(rng);
    const b = generateCard(mkRng(123));

    expect(a.id).toBe(b.id);
  });

  it("should produce valid structure", () => {
    const card = generateCard(mkRng(999));

    expect(card).toHaveProperty("id");
    expect(card).toHaveProperty("symbol");
    expect(card).toHaveProperty("color");
    expect(card).toHaveProperty("texture");
    expect(card).toHaveProperty("count");
  });
});

/**
 * =========================
 * generateSetBoard
 * =========================
 */

describe("generateSetBoard", () => {
  it("should generate valid board structure", () => {
    const tier = SET_DIFF_TIERS[0];
    const result = generateSetBoard(tier, 42);

    expect(result.cards.length).toBe(tier.boardCols * tier.boardRows);
    expect(result.sets).toBeDefined();
    expect(result.metrics).toBeDefined();
    expect(result.seed).toBe(42);
  });

  it("should generate unique cards only", () => {
    const tier = SET_DIFF_TIERS[1];
    const result = generateSetBoard(tier, 123);

    assertUniqueCards(result.cards);
  });

  it("should only produce valid sets", () => {
    const tier = SET_DIFF_TIERS[2];
    const result = generateSetBoard(tier, 99);

    assertValidSets(result.cards);
  });

  it("should be deterministic for same seed", () => {
    const tier = SET_DIFF_TIERS[1];

    const a = generateSetBoard(tier, 777);
    const b = generateSetBoard(tier, 777);

    expect(a.cards.map((c) => c.id)).toEqual(b.cards.map((c) => c.id));
    expect(a.sets.length).toBe(b.sets.length);
  });

  it("should produce metrics correctly shaped", () => {
    const tier = SET_DIFF_TIERS[0];

    const result = generateSetBoard(tier, 1);

    expect(typeof result.metrics.totalSets).toBe("number");
    expect(typeof result.metrics.deadCards).toBe("number");
    expect(typeof result.metrics.overlapAverage).toBe("number");
    expect(typeof result.metrics.overlapMax).toBe("number");
  });
});

/**
 * =========================
 * generateByDifficulty
 * =========================
 */

describe("generateByDifficulty", () => {
  it("should generate valid board from diffScore", () => {
    const result = generateByDifficulty(0, 1);

    expect(result.cards.length).toBeGreaterThan(0);
  });

  it("should throw for invalid diffScore", () => {
    expect(() => generateByDifficulty(9999)).toThrow();
  });

  it("should be deterministic with same entropy", () => {
    const a = generateByDifficulty(1, 5);
    const b = generateByDifficulty(1, 5);

    expect(a.cards.map((c) => c.id)).toEqual(b.cards.map((c) => c.id));
  });
});

/**
 * =========================
 * generateByTier
 * =========================
 */

describe("generateByTier", () => {
  it("should generate valid tier board", () => {
    const result = generateByTier(0, 1);

    expect(result.cards.length).toBeGreaterThan(0);
  });

  it("should throw for invalid tier", () => {
    expect(() => generateByTier(999)).toThrow();
  });

  it("should be deterministic", () => {
    const a = generateByTier(1, 2);
    const b = generateByTier(1, 2);

    expect(a.cards.map((c) => c.id)).toEqual(b.cards.map((c) => c.id));
  });
});

/**
 * =========================
 * generateByLevel
 * =========================
 */

describe("generateByLevel", () => {
  it("should generate board from level", () => {
    const result = generateByLevel(10);

    expect(result.cards.length).toBeGreaterThan(0);
  });

  it("should be deterministic for same level", () => {
    const a = generateByLevel(20);
    const b = generateByLevel(20);

    expect(a.cards.map((c) => c.id)).toEqual(b.cards.map((c) => c.id));
  });

  it("should always match valid tier range", () => {
    const result = generateByLevel(999);

    expect(result.tier).toBeDefined();
    expect(result.cards.length).toBeGreaterThan(0);
  });
});
