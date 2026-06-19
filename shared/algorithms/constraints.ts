/**
 * @module constraints
 * Generic constraint validation utilities for grid-based puzzles.
 *
 * Common constraints appear in munknown puzzles:
 * - Row/column quotas (exactly N of value X)
 * - No consecutive triples
 * - Parity (alternating values)
 * - Pair constraints (two cells must match/differ)
 *
 * Game-agnostic — works for Mambo, Sudoku, Bingo, etc.
 *
 * Usage:
 *   import { checkRowQuota, checkNoTriple, checkPairConstraint } from "@/shared/algorithms";
 */

/**
 * Validates whether a row/column has correct quota of a value.
 * Returns true if count of `value` in sequence is ≤ maxAllowed.
 *
 * Useful for: "each row must have exactly N suns"
 *
 * @param sequence - Row or column to check.
 * @param value - Value to count.
 * @param maxAllowed - Maximum allowed occurrences.
 * @returns True if quota is not exceeded.
 *
 * @example
 * // Mambo: each row must have ≤ 3 suns (N/2 when N=6)
 * checkQuota([1, 1, 0, 0, 0, 0], 1, 3);  // true
 * checkQuota([1, 1, 1, 1, 0, 0], 1, 3);  // false
 */
export function checkQuota<T>(
  sequence: readonly T[],
  value: T,
  maxAllowed: number,
): boolean {
  return sequence.filter((v) => v === value).length <= maxAllowed;
}

/**
 * Validates that sequence has EXACTLY a count of value.
 * Returns true if count matches exactly.
 *
 * @param sequence - Row/column to check.
 * @param value - Value to count.
 * @param exactCount - Expected exact count.
 * @returns True if count matches.
 *
 * @example
 * checkExactQuota([1, 1, 2, 2], 1, 2);  // true
 * checkExactQuota([1, 1, 2, 2], 1, 3);  // false
 */
export function checkExactQuota<T>(
  sequence: readonly T[],
  value: T,
  exactCount: number,
): boolean {
  return sequence.filter((v) => v === value).length === exactCount;
}

/**
 * Validates that no 3+ consecutive elements are identical.
 * Used by Mambo, munknown logic puzzles.
 *
 * @param sequence - Row/column to check.
 * @returns True if no 3+ consecutive identical values exist.
 *
 * @example
 * checkNoConsecutiveTriple([1, 1, 2, 2]);      // true
 * checkNoConsecutiveTriple([1, 1, 1, 2]);      // false (three 1s)
 * checkNoConsecutiveTriple([1, 2, 1, 2]);      // true
 */
export function checkNoConsecutiveTriple<T>(sequence: readonly T[]): boolean {
  for (let i = 0; i <= sequence.length - 3; i++) {
    if (
      sequence[i] !== 0 &&
      sequence[i] === sequence[i + 1] &&
      sequence[i + 1] === sequence[i + 2]
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Validates parity constraint: all consecutive pairs must differ.
 * Creates alternating pattern: A, B, A, B, ...
 *
 * @param sequence - Row/column to check.
 * @param onlyFilled - If true, skip empty/zero cells.
 * @returns True if all non-zero pairs differ.
 *
 * @example
 * checkAlternating([1, 2, 1, 2]);      // true
 * checkAlternating([1, 1, 2, 2]);      // false
 */
export function checkAlternating<T>(
  sequence: readonly T[],
  onlyFilled = true,
): boolean {
  const filtered = onlyFilled ? sequence.filter((v) => v) : sequence;

  for (let i = 0; i < filtered.length - 1; i++) {
    if (filtered[i] === filtered[i + 1]) return false;
  }

  return true;
}

/**
 * Pair constraint: two specific cells must satisfy a relation.
 *
 * @param value1 - First cell value.
 * @param value2 - Second cell value.
 * @param type - Constraint type: "=" (must match) or "x" (must differ).
 * @returns True if constraint satisfied.
 *
 * @example
 * // Cells must match
 * checkPairConstraint(1, 1, "=");  // true
 * checkPairConstraint(1, 2, "=");  // false
 *
 * // Cells must differ
 * checkPairConstraint(1, 2, "x");  // true
 * checkPairConstraint(1, 1, "x");  // false
 */
export function checkPairConstraint(
  value1: unknown,
  value2: unknown,
  type: "=" | "x",
): boolean {
  if (type === "=") {
    return value1 === value2 || value1 === 0 || value2 === 0;
  } else {
    // type === "x"
    if (value1 === 0 || value2 === 0) return true;
    return value1 !== value2;
  }
}

/**
 * Validates whether placing a value at a grid cell maintains all constraints.
 *
 * @param grid - Current grid state (0 = empty).
 * @param r - Row index.
 * @param c - Column index.
 * @param value - Value to place.
 * @param constraints - Array of constraint functions.
 * @returns True if placement is valid.
 *
 * @example
 * const isValid = checkCellConstraints(
 *   grid, r, c, value,
 *   [
 *     (g, r, c, v) => checkQuota(g[r], v, 3),
 *     (g, r, c, v) => checkNoConsecutiveTriple(g[r])
 *   ]
 * );
 */
export function checkCellConstraints(
  grid: readonly unknown[][],
  r: number,
  c: number,
  value: unknown,
  constraints: Array<
    (g: readonly unknown[][], r: number, c: number, v: unknown) => boolean
  >,
): boolean {
  for (const constraint of constraints) {
    if (!constraint(grid, r, c, value)) return false;
  }
  return true;
}

/**
 * Validates entire row against multiple constraints.
 * Simulates placing value at (r, c) and checks row validity.
 *
 * @param grid - Grid (0 = empty).
 * @param r - Row index.
 * @param c - Column to place value.
 * @param value - Value to place.
 * @param size - Grid size (for copy).
 * @param constraints - Array of row constraint functions.
 * @returns True if row would be valid.
 *
 * @example
 * const valid = checkRowWithConstraints(
 *   grid, r, c, value, 6,
 *   [
 *     (row) => checkNoConsecutiveTriple(row),
 *     (row) => checkQuota(row, 1, 3),
 *     (row) => checkQuota(row, 2, 3)
 *   ]
 * );
 */
export function checkRowWithConstraints(
  grid: readonly unknown[][],
  r: number,
  c: number,
  value: unknown,
  size: number,
  constraints: Array<(row: readonly unknown[]) => boolean>,
): boolean {
  // Simulate row with value placed
  const row = [...grid[r]];
  row[c] = value;

  // Check all constraints
  for (const constraint of constraints) {
    if (!constraint(row)) return false;
  }

  return true;
}

/**
 * Validates entire column against multiple constraints.
 * Like checkRowWithConstraints but for columns.
 *
 * @param grid - Grid (0 = empty).
 * @param r - Row of placement.
 * @param c - Column index.
 * @param value - Value to place.
 * @param size - Grid size.
 * @param constraints - Array of column constraint functions.
 * @returns True if column would be valid.
 */
export function checkColWithConstraints(
  grid: readonly unknown[][],
  r: number,
  c: number,
  value: unknown,
  size: number,
  constraints: Array<(col: readonly unknown[]) => boolean>,
): boolean {
  // Simulate column with value placed
  const col = grid.map((row) => row[c]);
  col[r] = value;

  // Check all constraints
  for (const constraint of constraints) {
    if (!constraint(col)) return false;
  }

  return true;
}

/**
 * Validates edge constraint between two adjacent cells.
 * Used by Mambo, Link puzzles, etc.
 *
 * @param cell1 - First cell value.
 * @param cell2 - Neighbor cell value.
 * @param edgeType - "=" (must match) or "x" (must differ).
 * @returns True if edge constraint satisfied.
 *
 * @example
 * // Cells separated by "=" edge must match
 * checkEdge(1, 1, "=");  // true
 */
export function checkEdge(
  cell1: unknown,
  cell2: unknown,
  edgeType: "=" | "x",
): boolean {
  // Both cells unfilled
  if (!cell1 && !cell2) return true;

  // One cell unfilled
  if (!cell1 || !cell2) return true;

  // Both filled: check constraint
  if (edgeType === "=") return cell1 === cell2;
  if (edgeType === "x") return cell1 !== cell2;

  return false;
}

/**
 * Validates all edge constraints for a specific cell.
 *
 * @param grid - Grid (0 = empty).
 * @param r - Row index.
 * @param c - Column index.
 * @param edges - Array of { direction, type } where direction is "up"|"down"|"left"|"right"
 * @returns True if all applicable edge constraints valid.
 *
 * @example
 * const valid = checkCellEdges(grid, r, c, [
 *   { direction: "up", type: "=" },    // top cell must match
 *   { direction: "right", type: "x" }  // right cell must differ
 * ]);
 */
export function checkCellEdges(
  grid: readonly unknown[][],
  r: number,
  c: number,
  edges: Array<{
    direction: "up" | "down" | "left" | "right";
    type: "=" | "x";
  }>,
): boolean {
  const size = grid.length;

  for (const { direction, type } of edges) {
    let nr = r,
      nc = c;

    if (direction === "up") nr = r - 1;
    else if (direction === "down") nr = r + 1;
    else if (direction === "left") nc = c - 1;
    else if (direction === "right") nc = c + 1;

    // Out of bounds
    if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;

    if (!checkEdge(grid[r][c], grid[nr][nc], type)) return false;
  }

  return true;
}
