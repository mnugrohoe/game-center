// rng.test.ts
import { describe, it, expect } from "vitest";

import {
  mkRng,
  shuffle,
  seedFromLevel,
  seedFromDiff,
  weightedRandom,
} from "./rng";

describe("mkRng", () => {
  it("produces deterministic sequences for the same seed", () => {
    const rng1 = mkRng(12345);
    const rng2 = mkRng(12345);

    const seq1 = [rng1(), rng1(), rng1(), rng1()];
    const seq2 = [rng2(), rng2(), rng2(), rng2()];

    expect(seq1).toEqual(seq2);
  });

  it("produces different sequences for different seeds", () => {
    const rng1 = mkRng(1);
    const rng2 = mkRng(2);

    const seq1 = [rng1(), rng1(), rng1()];
    const seq2 = [rng2(), rng2(), rng2()];

    expect(seq1).not.toEqual(seq2);
  });

  it("returns values in the range [0, 1)", () => {
    const rng = mkRng(999);

    for (let i = 0; i < 1000; i++) {
      const value = rng();

      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("handles negative seeds deterministically", () => {
    const rng1 = mkRng(-123);
    const rng2 = mkRng(-123);

    expect(rng1()).toBe(rng2());
  });

  it("handles zero seed", () => {
    const rng = mkRng(0);

    expect(typeof rng()).toBe("number");
  });
});

describe("shuffle", () => {
  it("shuffles array deterministically with seeded RNG", () => {
    const rng1 = mkRng(42);
    const rng2 = mkRng(42);

    const arr1 = shuffle([1, 2, 3, 4, 5], rng1);
    const arr2 = shuffle([1, 2, 3, 4, 5], rng2);

    expect(arr1).toEqual(arr2);
  });

  it("mutates and returns the same array reference", () => {
    const arr = [1, 2, 3];
    const result = shuffle(arr, mkRng(1));

    expect(result).toBe(arr);
  });

  it("preserves all original elements", () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = shuffle([...arr], mkRng(10));

    expect(shuffled.sort()).toEqual(arr);
  });

  it("handles empty arrays", () => {
    expect(shuffle([], mkRng(1))).toEqual([]);
  });

  it("handles single-element arrays", () => {
    expect(shuffle([42], mkRng(1))).toEqual([42]);
  });

  it("works without custom RNG", () => {
    const arr = [1, 2, 3];

    expect(shuffle(arr)).toHaveLength(3);
  });
});

describe("seedFromLevel", () => {
  it("returns deterministic seeds", () => {
    expect(seedFromLevel(100)).toBe(seedFromLevel(100));
  });

  it("returns different seeds for different levels", () => {
    expect(seedFromLevel(1)).not.toBe(seedFromLevel(2));
  });

  it("returns unsigned 32-bit integers", () => {
    const seed = seedFromLevel(999);

    expect(seed).toBeGreaterThanOrEqual(0);
    expect(seed).toBeLessThanOrEqual(0xffffffff);
  });
});

describe("seedFromDiff", () => {
  it("returns deterministic seeds", () => {
    expect(seedFromDiff(3, 12345)).toBe(seedFromDiff(3, 12345));
  });

  it("changes when tier changes", () => {
    expect(seedFromDiff(1, 999)).not.toBe(seedFromDiff(2, 999));
  });

  it("changes when entropy changes", () => {
    expect(seedFromDiff(1, 100)).not.toBe(seedFromDiff(1, 101));
  });

  it("returns unsigned 32-bit integers", () => {
    const seed = seedFromDiff(5, 123456);

    expect(seed).toBeGreaterThanOrEqual(0);
    expect(seed).toBeLessThanOrEqual(0xffffffff);
  });
});

describe("weightedRandom", () => {
  it("returns valid indices", () => {
    const rng = mkRng(1);
    const weights = [1, 2, 3];

    for (let i = 0; i < 100; i++) {
      const idx = weightedRandom(weights, rng);

      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(weights.length);
    }
  });

  it("prefers larger weights statistically", () => {
    const rng = mkRng(42);
    const weights = [1, 100];

    let count0 = 0;
    let count1 = 0;

    for (let i = 0; i < 1000; i++) {
      const idx = weightedRandom(weights, rng);

      if (idx === 0) count0++;
      else count1++;
    }

    expect(count1).toBeGreaterThan(count0);
  });

  it("returns last index as fallback", () => {
    const fakeRng = () => 0.999999;

    const idx = weightedRandom([1, 1, 1], fakeRng);

    expect(idx).toBe(2);
  });

  it("works with a single weight", () => {
    const rng = mkRng(1);

    expect(weightedRandom([10], rng)).toBe(0);
  });

  it("handles zero weights except one positive weight", () => {
    const rng = mkRng(123);

    expect(weightedRandom([0, 0, 10, 0], rng)).toBe(2);
  });
});
