/**
 * games/tower/lib/validation.ts
 *
 * Sequence validation and clue processing engine.
 */

import { TowerPuzzle } from "./generator";

/**
 * Represents the evaluation feedback result for a single player sequence guess.
 */
export interface TowerClue {
  /**
   * Number of correct colors located in the exact correct sequence position.
   * Also known as "Bullseyes".
   */
  exactMatches: number;
  /**
   * Number of correct colors present in the sequence but located in a wrong position.
   * Also known as "Near Misses".
   */
  partialMatches: number;
  /**
   * Flag indicating whether the submitted guess perfectly matches the hidden target sequence.
   */
  isCorrect: boolean;
}

/**
 * Validates a player's guess sequence against the target hidden tower sequence.
 * * @remarks
 * This function utilizes a deterministic two-pass sweep algorithm to evaluate matches.
 * This prevents color duplicates from being double-counted across different slots,
 * matching competitive deduction game standards.
 *
 * @param guess - Array of zero-indexed color indices submitted by the player.
 * @param target - Array of zero-indexed color indices representing the puzzle solution.
 * @returns An object containing the match metrics and win condition state.
 * * @throws {@link Error} Thrown if the array lengths of the guess and target do not match.
 * * @example
 * ```typescript
 * const target = [0, 1, 1, 2];
 * const guess  = [0, 3, 2, 1];
 * const result = validateTowerGuess(guess, target);
 * // result = { exactMatches: 1, partialMatches: 2, isCorrect: false }
 * ```
 */
export function validateTowerGuess(
  guess: TowerPuzzle["targetSequence"],
  target: TowerPuzzle["targetSequence"],
): TowerClue {
  if (guess.length !== target.length) {
    throw new Error("Guess length must perfectly match the target tower size");
  }

  let exactMatches = 0;
  let partialMatches = 0;

  const len = target.length;

  // Track processing flags to isolate indices and block duplicate attribution loops
  const targetMatched = new Array<boolean>(len).fill(false);
  const guessMatched = new Array<boolean>(len).fill(false);

  /**
   * Pass 1: Scan for Exact Matches (Identical color AND absolute position indexing)
   */
  for (let i = 0; i < len; i++) {
    if (guess[i] === target[i]) {
      exactMatches++;
      targetMatched[i] = true;
      guessMatched[i] = true;
    }
  }

  /**
   * Pass 2: Scan for Partial Matches (Identical color index, alternative sequence position)
   */
  for (let i = 0; i < len; i++) {
    // Skip guess slots already consumption-locked during the exact match phase
    if (guessMatched[i]) {
      continue;
    }

    for (let j = 0; j < len; j++) {
      // Pin matching unmapped color target instances to finalize evaluation context
      if (!targetMatched[j] && guess[i] === target[j]) {
        partialMatches++;
        targetMatched[j] = true;
        break;
      }
    }
  }

  return {
    exactMatches,
    partialMatches,
    isCorrect: exactMatches === len,
  };
}
