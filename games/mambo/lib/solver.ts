import type { MamboCellValue, MamboConstraint } from "../types";

/**
 * Returns true if placing a given value at specific coordinates does not violate
 * local row/column quotas or create a group of three adjacent identical cells.
 *
 * @param grid - The current matrix layout configuration.
 * @param r - Target row coordinate index.
 * @param c - Target column coordinate index.
 * @param val - Candidate cell value (1 for Sun, 2 for Moon).
 * @param size - Full dimension depth size of the square grid matrix.
 * @returns Boolean representing validity of the potential placement.
 */
export function isValidPlacement(
  grid: MamboCellValue[][],
  r: number,
  c: number,
  val: MamboCellValue,
  size: number,
): boolean {
  const half = size / 2;

  let rowCount = 0;
  for (let j = 0; j < size; j++) {
    const cellVal = j === c ? val : grid[r][j];
    if (cellVal === val) rowCount++;
  }
  if (rowCount > half) return false;

  let colCount = 0;
  for (let i = 0; i < size; i++) {
    const cellVal = i === r ? val : grid[i][c];
    if (cellVal === val) colCount++;
  }
  if (colCount > half) return false;

  if (c >= 2 && grid[r][c - 1] === val && grid[r][c - 2] === val) return false;
  if (
    c >= 1 &&
    c + 1 < size &&
    grid[r][c - 1] === val &&
    grid[r][c + 1] === val
  )
    return false;
  if (c + 2 < size && grid[r][c + 1] === val && grid[r][c + 2] === val)
    return false;

  if (r >= 2 && grid[r - 1][c] === val && grid[r - 2][c] === val) return false;
  if (
    r >= 1 &&
    r + 1 < size &&
    grid[r - 1][c] === val &&
    grid[r + 1][c] === val
  )
    return false;
  if (r + 2 < size && grid[r + 1][c] === val && grid[r + 2][c] === val)
    return false;

  return true;
}

/**
 * Solves an arbitrary Mambo grid layout using an iterative backtracking matrix loop.
 * Designed to process initial preset layers safely without wiping user changes.
 *
 * @param grid - Current puzzle layout containing values from 0 to 2.
 * @param constraints - Positional equal or unequal constraint definitions.
 * @param size - Full dimension depth size of the square grid matrix.
 * @returns Completed matrix representation grid layout, or null if unresolvable.
 */
export function solveMambo(
  grid: MamboCellValue[][],
  constraints: MamboConstraint[],
  size: number,
): MamboCellValue[][] | null {
  const total = size * size;

  const g: MamboCellValue[][] = new Array(size);
  for (let r = 0; r < size; r++) {
    g[r] = [...grid[r]];
  }

  const isPreset = new Uint8Array(total);
  for (let i = 0; i < total; i++) {
    const r = (i / size) | 0;
    const c = i % size;
    if (g[r][c] !== 0) {
      isPreset[i] = 1;
    }
  }

  const tried = new Uint8Array(total);
  let pos = 0;

  while (pos >= 0 && pos < total) {
    if (isPreset[pos] === 1) {
      pos++;
      continue;
    }

    const r = (pos / size) | 0;
    const c = pos % size;
    g[r][c] = 0;

    let placed = false;

    while (tried[pos] < 2 && !placed) {
      tried[pos]++;
      const candidate = tried[pos] as MamboCellValue;

      if (isValidPlacement(g, r, c, candidate, size)) {
        g[r][c] = candidate;

        let constraintValid = true;
        for (let i = 0; i < constraints.length; i++) {
          const cn = constraints[i];
          if ((cn.r1 === r && cn.c1 === c) || (cn.r2 === r && cn.c2 === c)) {
            const valA = g[cn.r1][cn.c1];
            const valB = g[cn.r2][cn.c2];

            if (valA !== 0 && valB !== 0) {
              if (cn.type === "=" && valA !== valB) {
                constraintValid = false;
                break;
              }
              if (cn.type === "x" && valA === valB) {
                constraintValid = false;
                break;
              }
            }
          }
        }

        if (constraintValid) {
          placed = true;
          pos++;
        }
      }
    }

    if (placed) continue;

    g[r][c] = 0;
    tried[pos] = 0;
    pos--;

    while (pos >= 0 && isPreset[pos] === 1) {
      pos--;
    }
  }

  if (pos === total) {
    for (let i = 0; i < constraints.length; i++) {
      const cn = constraints[i];
      const valA = g[cn.r1][cn.c1];
      const valB = g[cn.r2][cn.c2];
      if (cn.type === "=" && valA !== valB) return null;
      if (cn.type === "x" && valA === valB) return null;
    }
    return g;
  }

  return null;
}
