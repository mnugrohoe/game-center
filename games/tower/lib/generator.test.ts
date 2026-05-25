// generator.test.ts

import { describe, expect, it } from "vitest";

import {
  generateTowerTarget,
  generateByDifficulty,
  generateByTier,
  generateByLevel,
} from "./generator";

import { TOWER_DIFF_TIERS } from "./difficulty";

describe("generateTowerTarget", () => {
  it("generates a tower with the requested size", () => {
    const result = generateTowerTarget(10, 3, 5, 1, 123);

    expect(result.length).toBe(10);
  });

  it("only uses valid color indexes", () => {
    const result = generateTowerTarget(20, 4, 8, 1, 999);

    for (const value of result) {
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(4);
    }
  });

  it("ensures every color appears at least once", () => {
    const result = generateTowerTarget(12, 4, 6, 1, 777);

    for (let i = 1; i <= 4; i++) {
      expect(result.includes(i)).toBe(true);
    }
  });

  it("does not exceed maxSameColor usage", () => {
    const result = generateTowerTarget(20, 3, 7, 1, 456);
    const usage = new Map<number, number>();

    for (const value of result) {
      usage.set(value, (usage.get(value) ?? 0) + 1);
    }

    for (const count of usage.values()) {
      expect(count).toBeLessThanOrEqual(7);
    }
  });

  it("is deterministic for the same seed", () => {
    const a = generateTowerTarget(15, 4, 6, 2, 12345);
    const b = generateTowerTarget(15, 4, 6, 2, 12345);

    expect(a).toEqual(b);
  });

  it("produces different results for different seeds", () => {
    const a = generateTowerTarget(15, 4, 6, 2, 1);
    const b = generateTowerTarget(15, 4, 6, 2, 2);

    expect(a).not.toEqual(b);
  });
});

describe("generateByDifficulty", () => {
  it("generates using a valid difficulty score", () => {
    const result = generateByDifficulty(1);
    expect(result.length).toBeGreaterThan(0);
  });

  it("throws for invalid difficulty scores", () => {
    expect(() => generateByDifficulty(999)).toThrowError();
  });

  it("is deterministic with identical entropy", () => {
    const a = generateByDifficulty(2, 777);
    const b = generateByDifficulty(2, 777);

    expect(a).toEqual(b);
  });
});

describe("generateByTier", () => {
  it("generates using a valid tier index", () => {
    const result = generateByTier(0);

    expect(result.length).toBeGreaterThan(0);
  });

  it("throws for invalid tier indexes", () => {
    expect(() => generateByTier(999)).toThrowError();
  });

  it("is deterministic with identical entropy", () => {
    const a = generateByTier(1, 123);
    const b = generateByTier(1, 123);

    expect(a).toEqual(b);
  });
});

describe("generateByLevel", () => {
  it("generates using player level", () => {
    const result = generateByLevel(10);

    expect(result.length).toBeGreaterThan(0);
  });

  it("is deterministic for the same level", () => {
    const a = generateByLevel(25);
    const b = generateByLevel(25);

    expect(a).toEqual(b);
  });

  it("supports all defined tiers", () => {
    for (const tier of TOWER_DIFF_TIERS) {
      const result = generateByDifficulty(tier.diffScore);

      expect(result.length).toBe(tier.size);
    }
  });
});
