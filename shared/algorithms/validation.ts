/**
 * @module validation
 * Generic validation utilities for puzzle features.
 *
 * Checks whether feature collections satisfy common puzzle rules:
 * - all-same: all values are identical
 * - all-different: all values are unique
 * - custom: caller-defined validation
 *
 * Used by: Set (card features), Bingo (row/col), etc.
 *
 * Usage:
 *   import { validAllSameOrDifferent } from "@/shared/algorithms";
 */

/**
 * Validates whether a feature collection satisfies "all-same OR all-different" rule.
 *
 * This is a common puzzle rule where:
 * - all values are identical  → valid
 * - all values are unique     → valid
 * - mixed (some same, some different) → invalid
 *
 * Examples:
 * - ["red", "red", "red"] → true (all same)
 * - ["red", "green", "blue"] → true (all different)
 * - ["red", "red", "green"] → false (mixed)
 *
 * @typeParam T - Feature value type (string, number, object, etc.)
 * @param values - Feature values to validate.
 * @returns True if all values are identical OR all unique.
 */
export function validAllSameOrDifferent<T>(values: readonly T[]): boolean {
  const uniqueCount = new Set(values).size;
  return uniqueCount === 1 || uniqueCount === values.length;
}

/**
 * Validates whether all values in collection are identical.
 *
 * @param values - Values to check.
 * @returns True if all values are the same.
 *
 * @example
 * validAllSame([5, 5, 5]) → true
 * validAllSame([5, 5, 6]) → false
 */
export function validAllSame<T>(values: readonly T[]): boolean {
  return new Set(values).size <= 1;
}

/**
 * Validates whether all values in collection are different.
 *
 * @param values - Values to check.
 * @returns True if all values are unique.
 *
 * @example
 * validAllDifferent([1, 2, 3]) → true
 * validAllDifferent([1, 2, 1]) → false
 */
export function validAllDifferent<T>(values: readonly T[]): boolean {
  return new Set(values).size === values.length;
}

/**
 * Validates whether exactly N values match a predicate.
 * Useful for "exactly half the row is value X" checks.
 *
 * @param values - Values to check.
 * @param predicate - Function that returns true for matching values.
 * @param count - Expected number of matches.
 * @returns True if exactly `count` values match predicate.
 *
 * @example
 * validCount([1,1,2,2], v => v === 1, 2) → true
 * validCount([1,1,1,2], v => v === 1, 2) → false
 */
export function validCount<T>(
  values: readonly T[],
  predicate: (v: T) => boolean,
  count: number,
): boolean {
  return values.filter(predicate).length === count;
}

/**
 * Validates whether a sequence contains no 3+ consecutive identical values.
 * Used by puzzles like Mambo (no 3 adjacent suns/moons).
 *
 * @param sequence - Sequence to check.
 * @returns True if no 3+ consecutive values are identical.
 *
 * @example
 * noConsecutiveTriple([1, 1, 2, 2]) → true
 * noConsecutiveTriple([1, 1, 1, 2]) → false (3 ones in a row)
 */
export function noConsecutiveTriple<T>(sequence: readonly T[]): boolean {
  for (let i = 0; i <= sequence.length - 3; i++) {
    if (
      sequence[i] &&
      sequence[i] === sequence[i + 1] &&
      sequence[i + 1] === sequence[i + 2]
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Validates whether consecutive items in sequence are alternating.
 * Used for patterns like: up, down, up, down.
 *
 * @param sequence - Sequence to check.
 * @param isAlternating - Function returning true if (a, b) is valid consecutive pair.
 * @returns True if all consecutive pairs satisfy predicate.
 *
 * @example
 * const isAlternating = (a, b) => a !== b;
 * validAlternating([1, 2, 1, 2], isAlternating) → true
 * validAlternating([1, 1, 2, 2], isAlternating) → false
 */
export function validAlternating<T>(
  sequence: readonly T[],
  isAlternating: (a: T, b: T) => boolean,
): boolean {
  for (let i = 0; i < sequence.length - 1; i++) {
    if (!isAlternating(sequence[i], sequence[i + 1])) {
      return false;
    }
  }
  return true;
}

/**
 * Checks if value appears exactly `maxAllowed` times in sequence.
 * Useful for "can't have 3 suns in the same row" checks.
 *
 * @param sequence - Sequence to check.
 * @param value - Value to count.
 * @param maxAllowed - Maximum allowed occurrences.
 * @returns True if value appears ≤ maxAllowed times.
 *
 * @example
 * maxOccurrences([1, 1, 1, 2], 1, 2) → false
 * maxOccurrences([1, 1, 2, 2], 1, 2) → true
 */
export function maxOccurrences<T>(
  sequence: readonly T[],
  value: T,
  maxAllowed: number,
): boolean {
  return sequence.filter((v) => v === value).length <= maxAllowed;
}
