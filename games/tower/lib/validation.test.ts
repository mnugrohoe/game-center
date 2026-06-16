import { describe, expect, it } from "vitest";
import { validateTowerGuess } from "./validation";

describe("Tower Guess Validation Engine", () => {
  describe("Input Structural Validation", () => {
    it("should throw an error if the guess length does not match target length", () => {
      const target = [0, 1, 2];

      expect(() => validateTowerGuess([0, 1], target)).toThrowError(
        "Guess length must perfectly match the target tower size",
      );

      expect(() => validateTowerGuess([0, 1, 2, 3], target)).toThrowError(
        "Guess length must perfectly match the target tower size",
      );
    });

    it("should handle empty target and guess vectors gracefully", () => {
      // While generator enforces size > 0, validate the logic boundary
      expect(() => validateTowerGuess([], [])).not.toThrow();
      expect(validateTowerGuess([], [])).toEqual({
        exactMatches: 0,
        partialMatches: 0,
        isCorrect: true,
      });
    });
  });

  describe("Deduction Match Mechanics", () => {
    it("should register a perfect sequence match cleanly", () => {
      const target = [0, 1, 2, 3];
      const guess = [0, 1, 2, 3];

      const result = validateTowerGuess(guess, target);

      expect(result).toEqual({
        exactMatches: 4,
        partialMatches: 0,
        isCorrect: true,
      });
    });

    it("should register complete misses across the board", () => {
      const target = [0, 0, 0];
      const guess = [1, 1, 1];

      const result = validateTowerGuess(guess, target);

      expect(result).toEqual({
        exactMatches: 0,
        partialMatches: 0,
        isCorrect: false,
      });
    });

    it("should capture pure shifted positions as partial matches only", () => {
      const target = [0, 1, 2];
      const guess = [1, 2, 0];

      const result = validateTowerGuess(guess, target);

      expect(result).toEqual({
        exactMatches: 0,
        partialMatches: 3,
        isCorrect: false,
      });
    });

    it("should mix exact and partial matches seamlessly on scrambled offsets", () => {
      const target = [0, 1, 2, 3];
      const guess = [0, 3, 1, 2]; // 0 is exact, [1, 2, 3] are shifted

      const result = validateTowerGuess(guess, target);

      expect(result).toEqual({
        exactMatches: 1,
        partialMatches: 3,
        isCorrect: false,
      });
    });
  });

  describe("Duplicate Handling Matrices (Mastermind Rules)", () => {
    it("should not double-clue a single target color instance if user over-guesses it", () => {
      const target = [0, 4, 4, 4]; // Only one '0' exists
      const guess = [0, 0, 0, 0]; // User guessed four '0's

      const result = validateTowerGuess(guess, target);

      // Index 0 is exact. The other three 0s in the guess should find no free target elements.
      expect(result).toEqual({
        exactMatches: 1,
        partialMatches: 0,
        isCorrect: false,
      });
    });

    it("should prioritize exact matching over partial assignment when duplicate targets exist", () => {
      const target = [1, 2, 3, 1]; // '1' at start and end
      const guess = [0, 1, 4, 1]; // Guess has '1' in wrong spot (idx 1) and exact spot (idx 3)

      const result = validateTowerGuess(guess, target);

      // Index 3 is a perfect exact match.
      // Index 1 guess ('1') should claim the target's first '1' (idx 0) as a partial match.
      expect(result).toEqual({
        exactMatches: 1,
        partialMatches: 1,
        isCorrect: false,
      });
    });

    it("should limit partial match tallies to the actual availability frequency within target array", () => {
      const target = [1, 2, 5, 5]; // Only one '1'
      const guess = [3, 1, 1, 1]; // Three '1's guessed in wrong positions

      const result = validateTowerGuess(guess, target);

      // Only one partial match can be consumed from the single target '1'
      expect(result).toEqual({
        exactMatches: 0,
        partialMatches: 1,
        isCorrect: false,
      });
    });

    it("should balance symmetrical duplicates accurately", () => {
      const target = [1, 2, 1, 2];
      const guess = [2, 1, 2, 1];

      const result = validateTowerGuess(guess, target);

      // Zero exact positions, but all colors exist and are duplicated evenly
      expect(result).toEqual({
        exactMatches: 0,
        partialMatches: 4,
        isCorrect: false,
      });
    });
  });
});
