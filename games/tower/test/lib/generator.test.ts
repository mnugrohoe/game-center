// tower-generator.test.ts

import {
  generateByDifficulty,
  generateByLevel,
  generateByTier,
} from "@/games/tower/lib/generator";

describe("Tower Generator", () => {
  describe("generateByLevel()", () => {
    it("should generate same result for same level", () => {
      const a = generateByLevel(10);
      const b = generateByLevel(10);

      expect(a).toEqual(b);
    });

    it("should generate different result for different level", () => {
      const a = generateByLevel(10);
      const b = generateByLevel(11);

      expect(a).not.toEqual(b);
    });
  });

  describe("generateByDifficulty()", () => {
    it("should generate deterministic result with same entropy", () => {
      const a = generateByDifficulty(3, 999);
      const b = generateByDifficulty(3, 999);

      expect(a).toEqual(b);
    });

    it("should generate different result with different entropy", () => {
      const a = generateByDifficulty(3, 111);
      const b = generateByDifficulty(3, 222);

      expect(a).not.toEqual(b);
    });
  });

  describe("generateByTier()", () => {
    it("should return valid tower size", () => {
      const result = generateByTier(0, 123);

      // size 3 => total 4 slots
      expect(result.length).toBe(4);
    });

    it("should contain only valid variance values", () => {
      const result = generateByTier(2, 123);

      for (const n of result) {
        expect(n).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(4);
      }
    });

    it("should guarantee every variance appears at least once", () => {
      const result = generateByTier(3, 555);

      const unique = [...new Set(result)];

      // tier 3 variance = 5
      expect(unique.length).toBe(5);
    });

    it("should avoid triple streaks", () => {
      const result = generateByTier(5, 999);

      let hasTriple = false;

      for (let i = 2; i < result.length; i++) {
        if (result[i] === result[i - 1] && result[i] === result[i - 2]) {
          hasTriple = true;
        }
      }

      expect(hasTriple).toBe(false);
    });
  });
});
