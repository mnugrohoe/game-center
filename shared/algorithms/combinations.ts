/**
 * @module combinations
 * Generic combination generation and search utilities.
 *
 * Find n-combinations of items with optional filtering/validation.
 * Game-agnostic — works with any items and predicates.
 *
 * Used by: Set (find all valid card triples), Poker (hand analysis), etc.
 *
 * Usage:
 *   import { findCombinations, findAllNCombinations } from "@/shared/algorithms";
 */

/**
 * Finds all n-combinations of array items that satisfy a predicate.
 *
 * A combination is a selection of n items where order doesn't matter.
 * This generates all unique n-sized subsets.
 *
 * @typeParam T - Item type.
 * @param items - Array of items.
 * @param n - Size of combinations (e.g., 3 for triples, 2 for pairs).
 * @param isValid - Optional filter: only include combinations where isValid(...) = true.
 * @returns Array of n-combinations that pass validation.
 *
 * @example
 * // Find all valid card triples
 * const cards = [cardA, cardB, cardC, cardD];
 * const triples = findCombinations(cards, 3, (a, b, c) => isValidSet([a, b, c]));
 *
 * @example
 * // Find all pairs
 * const pairs = findCombinations([1, 2, 3], 2);
 * // [[1, 2], [1, 3], [2, 3]]
 */
export function findCombinations<T>(
  items: readonly T[],
  n: number,
  isValid?: (...args: T[]) => boolean,
): T[][] {
  if (n <= 0) return [];
  if (n > items.length) return [];

  if (n === 1) {
    return items.map((item) => [item]);
  }

  const result: T[][] = [];

  function backtrack(start: number, current: T[]): void {
    if (current.length === n) {
      if (!isValid || isValid(...current)) {
        result.push([...current]);
      }
      return;
    }

    for (let i = start; i < items.length; i++) {
      current.push(items[i]);
      backtrack(i + 1, current);
      current.pop();
    }
  }

  backtrack(0, []);
  return result;
}

/**
 * Finds n-combinations specialized for common case: triples (n=3).
 * Faster than generic version due to loop unrolling.
 *
 * @typeParam T - Item type.
 * @param items - Array of items.
 * @param isValid - Optional filter for valid triples.
 * @returns All valid triples.
 *
 * @example
 * const triples = findTriples(cards, (a, b, c) => isValidSet([a, b, c]));
 */
export function findTriples<T>(
  items: readonly T[],
  isValid?: (a: T, b: T, c: T) => boolean,
): [T, T, T][] {
  const result: [T, T, T][] = [];

  for (let i = 0; i < items.length - 2; i++) {
    for (let j = i + 1; j < items.length - 1; j++) {
      for (let k = j + 1; k < items.length; k++) {
        const triple: [T, T, T] = [items[i], items[j], items[k]];
        if (!isValid || isValid(items[i], items[j], items[k])) {
          result.push(triple);
        }
      }
    }
  }

  return result;
}

/**
 * Finds n-combinations specialized for pairs (n=2).
 * Even faster due to simple nested loop.
 *
 * @typeParam T - Item type.
 * @param items - Array of items.
 * @param isValid - Optional filter for valid pairs.
 * @returns All valid pairs.
 *
 * @example
 * const pairs = findPairs(items, (a, b) => canMatch(a, b));
 */
export function findPairs<T>(
  items: readonly T[],
  isValid?: (a: T, b: T) => boolean,
): [T, T][] {
  const result: [T, T][] = [];

  for (let i = 0; i < items.length - 1; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (!isValid || isValid(items[i], items[j])) {
        result.push([items[i], items[j]]);
      }
    }
  }

  return result;
}

/**
 * Counts n-combinations without generating them (for memory efficiency).
 *
 * Formula: C(n, k) = n! / (k! * (n-k)!)
 *
 * @param totalItems - Total number of items.
 * @param n - Size of combinations.
 * @returns Count of all n-combinations.
 *
 * @example
 * countCombinations(52, 5);  // Number of 5-card poker hands
 */
export function countCombinations(totalItems: number, n: number): number {
  if (n > totalItems || n < 0) return 0;
  if (n === 0 || n === totalItems) return 1;

  // Optimize: C(n, k) = C(n, n-k)
  n = Math.min(n, totalItems - n);

  let result = 1;
  for (let i = 0; i < n; i++) {
    result *= totalItems - i;
    result /= i + 1;
  }

  return Math.round(result);
}

/**
 * Generates all permutations (order matters).
 * Much slower than combinations — use only when order is significant.
 *
 * @typeParam T - Item type.
 * @param items - Array of items.
 * @param n - Length of permutations (default: items.length).
 * @returns All n-permutations.
 *
 * @example
 * const perms = findPermutations([1, 2, 3], 2);
 * // [[1, 2], [1, 3], [2, 1], [2, 3], [3, 1], [3, 2]]
 */
export function findPermutations<T>(items: readonly T[], n?: number): T[][] {
  const length = n ?? items.length;
  if (length <= 0 || length > items.length) return [];

  const result: T[][] = [];
  const used = new Array(items.length).fill(false);

  function backtrack(current: T[]): void {
    if (current.length === length) {
      result.push([...current]);
      return;
    }

    for (let i = 0; i < items.length; i++) {
      if (!used[i]) {
        used[i] = true;
        current.push(items[i]);
        backtrack(current);
        current.pop();
        used[i] = false;
      }
    }
  }

  backtrack([]);
  return result;
}

/**
 * Finds first n-combination that satisfies predicate (short-circuit).
 * Faster than findCombinations when you only need one match.
 *
 * @typeParam T - Item type.
 * @param items - Array of items.
 * @param n - Size of combinations.
 * @param isValid - Predicate to check.
 * @returns First matching combination, or null if none found.
 *
 * @example
 * const first = findFirstCombination(cards, 3, (a, b, c) => isValidSet([a, b, c]));
 */
export function findFirstCombination<T>(
  items: readonly T[],
  n: number,
  isValid: (...args: T[]) => boolean,
): T[] | null {
  if (n <= 0 || n > items.length) return null;

  function backtrack(start: number, current: T[]): T[] | null {
    if (current.length === n) {
      if (isValid(...current)) return [...current];
      return null;
    }

    for (let i = start; i < items.length; i++) {
      current.push(items[i]);
      const found = backtrack(i + 1, current);
      if (found) return found;
      current.pop();
    }

    return null;
  }

  return backtrack(0, []);
}

/**
 * Group items by a key function, then find combinations within each group.
 * Useful for "cards by color" → "find sets of same-color triples".
 *
 * @typeParam T - Item type.
 * @typeParam K - Key type.
 * @param items - Array of items.
 * @param keyFn - Function to extract grouping key.
 * @param n - Combination size.
 * @param isValid - Optional filter.
 * @returns Combinations grouped by key.
 *
 * @example
 * const byColor = findCombinationsByGroup(
 *   cards,
 *   (c) => c.color,
 *   3,
 *   (a, b, c) => isValidSet([a, b, c])
 * );
 * // { red: [...], blue: [...] }
 */
export function findCombinationsByGroup<T, K extends string | number>(
  items: readonly T[],
  keyFn: (item: T) => K,
  n: number,
  isValid?: (...args: T[]) => boolean,
): Record<K, T[][]> {
  const groups: Record<K, T[]> = {} as Record<K, T[]>;

  // Group items
  for (const item of items) {
    const key = keyFn(item);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }

  // Find combinations in each group
  const result: Record<K, T[][]> = {} as Record<K, T[][]>;
  for (const key in groups) {
    result[key] = findCombinations(groups[key], n, isValid);
  }

  return result;
}
