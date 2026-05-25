/**
 * Mambo puzzle core logic.
 *
 * Rules:
 *   - Grid is N×N (N always even).
 *   - Each cell: 0=blank, 1=Sun, 2=Moon.
 *   - Each row and column must have exactly N/2 Suns and N/2 Moons.
 *   - No 3 identical values may be adjacent in any row or column.
 *   - Constraints on edges: "=" means the two cells must match, "x" means differ.
 */

import type { CellValue, Constraint, MamboPuzzle } from "../types";

// ─── Placement validation ─────────────────────────────────────────────────────

/**
 * Returns true if placing `val` at [r,c] in `grid` still satisfies all rules.
 * Does NOT check constraints — those are checked separately.
 */
export function isValidPlacement(
  grid: CellValue[][],
  r: number,
  c: number,
  val: CellValue,
  size: number,
): boolean {
  const half = size / 2;

  // Row quota
  if (grid[r].filter((v) => v === val).length >= half) return false;

  // Col quota
  let colCount = 0;
  for (let i = 0; i < size; i++) if (grid[i][c] === val) colCount++;
  if (colCount >= half) return false;

  // No 3 in a row (row direction)
  const row = [...grid[r]];
  row[c] = val;
  for (let i = 0; i <= size - 3; i++)
    if (row[i] && row[i] === row[i + 1] && row[i + 1] === row[i + 2])
      return false;

  // No 3 in a row (col direction)
  const col = grid.map((rw) => rw[c]);
  col[r] = val;
  for (let i = 0; i <= size - 3; i++)
    if (col[i] && col[i] === col[i + 1] && col[i + 1] === col[i + 2])
      return false;

  return true;
}

// ─── Solver ───────────────────────────────────────────────────────────────────

/**
 * Solves a Mambo puzzle grid given optional pre-filled cells and constraints.
 *
 * @param grid        - N×N grid (0=blank, 1=Sun, 2=Moon). Cloned internally.
 * @param constraints - Edge constraints.
 * @param size        - Grid side length.
 * @returns Completed grid, or null if unsolvable.
 */
export function solveMambo(
  grid: CellValue[][],
  constraints: Constraint[],
  size: number,
): CellValue[][] | null {
  const g: CellValue[][] = grid.map((r) => [...r]);

  function bt(pos: number): boolean {
    if (pos === size * size) {
      // Final constraint check
      for (const cn of constraints) {
        const a = g[cn.r1][cn.c1],
          b = g[cn.r2][cn.c2];
        if (cn.type === "=" && a !== b) return false;
        if (cn.type === "x" && a === b) return false;
      }
      return true;
    }

    const r = Math.floor(pos / size);
    const c = pos % size;
    if (g[r][c] !== 0) return bt(pos + 1);

    for (const val of [1, 2] as CellValue[]) {
      if (!isValidPlacement(g, r, c, val, size)) continue;
      g[r][c] = val;

      // Early constraint pruning
      let ok = true;
      for (const cn of constraints) {
        if ((cn.r1 === r && cn.c1 === c) || (cn.r2 === r && cn.c2 === c)) {
          const a = g[cn.r1][cn.c1],
            b = g[cn.r2][cn.c2];
          if (a && b) {
            if (cn.type === "=" && a !== b) {
              ok = false;
              break;
            }
            if (cn.type === "x" && a === b) {
              ok = false;
              break;
            }
          }
        }
      }

      if (ok && bt(pos + 1)) return true;
      g[r][c] = 0;
    }
    return false;
  }

  return bt(0) ? g : null;
}

// ─── Win check (independent — does not compare to stored solution) ────────────

/**
 * Returns true when the user's grid is a fully valid solution.
 * Does NOT compare to the stored solution — any valid arrangement wins.
 */
export function checkWin(grid: CellValue[][], puzzle: MamboPuzzle): boolean {
  const { size, constraints } = puzzle;
  const half = size / 2;

  // All cells must be filled
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) if (!grid[r][c]) return false;

  // Row balance + no-triple
  for (let r = 0; r < size; r++) {
    const row = grid[r];
    if (row.filter((v) => v === 1).length !== half) return false;
    if (row.filter((v) => v === 2).length !== half) return false;
    for (let c = 0; c <= size - 3; c++)
      if (row[c] === row[c + 1] && row[c + 1] === row[c + 2]) return false;
  }

  // Col balance + no-triple
  for (let c = 0; c < size; c++) {
    const col = grid.map((row) => row[c]);
    if (col.filter((v) => v === 1).length !== half) return false;
    if (col.filter((v) => v === 2).length !== half) return false;
    for (let r = 0; r <= size - 3; r++)
      if (col[r] === col[r + 1] && col[r + 1] === col[r + 2]) return false;
  }

  // All constraints
  for (const cn of constraints) {
    const a = grid[cn.r1][cn.c1],
      b = grid[cn.r2][cn.c2];
    if (cn.type === "=" && a !== b) return false;
    if (cn.type === "x" && a === b) return false;
  }

  return true;
}
