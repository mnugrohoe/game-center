// games/mambo/lib/validation.ts

import { CellKey, GapCoord } from "@/shared/components/ui/Grid";
import { MamboCellValue, MamboConstraint, MamboPuzzle } from "../types";
import { MAMBO_EMPTY, MAMBO_MOON, MAMBO_SUN } from "./constants";
import { constraintToGapCoord } from "./utils";
import { cellKey } from "@/shared/hooks/useGrid";

/**
 * Independently confirms the solved puzzle matrix layout structure does not contains
 * any illegal vertical or horizontal triple matching adjacent component chains.
 *
 * @param grid - The target matrix grid configuration to evaluate.
 * @param size - Expected square matrix layout dimensions.
 * @returns True if the layout is verified flawless against 3-in-a-row rules.
 */
export function verifyNoThreeInARow(
  grid: MamboCellValue[][],
  size: number,
): boolean {
  if (!grid || !Array.isArray(grid) || grid.length < size) {
    return false;
  }

  for (let r = 0; r < size; r++) {
    const row = grid[r];
    if (!row || row.length < size) {
      return false;
    }

    for (let c = 0; c < size; c++) {
      const val = row[c];
      if (val === 0) return false;

      if (c + 2 < size) {
        if (row[c + 1] === val && row[c + 2] === val) {
          return false;
        }
      }

      if (r + 2 < size) {
        const nextRow1 = grid[r + 1];
        const nextRow2 = grid[r + 2];
        if (
          nextRow1 &&
          nextRow2 &&
          nextRow1[c] === val &&
          nextRow2[c] === val
        ) {
          return false;
        }
      }
    }
  }

  return true;
}

/**
 * Validates a completely filled board state to see if it satisfies all Mambo rules.
 * This evaluation runs independently of the original generation layout answers.
 * Implements strict defensive bounds isolation to protect against grid resizing telemetry mismatches.
 *
 * @param grid - The current structural player moves matrix to validate.
 * @param puzzle - The structural active level configuration layout instance.
 * @returns True if the layout context completely satisfies all balance, matching, and relation rules.
 */
export function checkMamboComplete(
  grid: MamboCellValue[][],
  puzzle: MamboPuzzle,
): boolean {
  if (!puzzle || !grid || !Array.isArray(grid)) {
    return false;
  }

  const { size, constraints } = puzzle;
  if (grid.length < size) {
    return false;
  }

  const half = size / 2;
  const validConstraints = constraints ?? [];

  // 1. Structural Verification Scan & Row/Triple Balance
  for (let r = 0; r < size; r++) {
    const row = grid[r];
    if (!row || row.length < size) {
      return false;
    }

    let sunsInRow = 0;
    let moonsInRow = 0;

    for (let c = 0; c < size; c++) {
      const val = row[c];
      if (val === 0) return false;

      if (val === 1) {
        sunsInRow++;
      } else {
        moonsInRow++;
      }

      // Strict Triple Checks (Horizontal)
      if (c + 2 < size) {
        if (val === row[c + 1] && val === row[c + 2]) {
          return false;
        }
      }

      // Strict Triple Checks (Vertical)
      if (r + 2 < size) {
        const nextRow1 = grid[r + 1];
        const nextRow2 = grid[r + 2];
        if (
          nextRow1 &&
          nextRow2 &&
          val === nextRow1[c] &&
          val === nextRow2[c]
        ) {
          return false;
        }
      }
    }

    if (sunsInRow !== half || moonsInRow !== half) {
      return false;
    }
  }

  // 2. Transposed Column Balance Scan
  for (let c = 0; c < size; c++) {
    let sunsInCol = 0;
    let moonsInCol = 0;

    for (let r = 0; r < size; r++) {
      const row = grid[r];
      if (!row) return false;

      if (row[c] === 1) {
        sunsInCol++;
      } else {
        moonsInCol++;
      }
    }

    if (sunsInCol !== half || moonsInCol !== half) {
      return false;
    }
  }

  // 3. Adjacency Logic Rules Validation
  for (let i = 0; i < validConstraints.length; i++) {
    const cn = validConstraints[i];

    const row1 = grid[cn.r1];
    const row2 = grid[cn.r2];
    if (!row1 || !row2) {
      return false;
    }

    const valA = row1[cn.c1];
    const valB = row2[cn.c2];
    if (valA === undefined || valB === undefined) {
      return false;
    }

    if (cn.type === "=" && valA !== valB) return false;
    if (cn.type === "x" && valA === valB) return false;
  }

  return true;
}

/**
 * @file games/mambo/lib/validation.ts
 * @description Pure validation helpers for Mambo board state.
 * Detects three rule violations:
 *  - Three (or more) consecutive cells of the same symbol in a row/col.
 *  - Row/col symbol counts not balanced (each symbol count must not
 *    exceed half the board size; for odd sizes, off-by-one is tolerated
 *    by the generator but counts still must not exceed ceil(size/2)).
 *  - Adjacency constraints ("=" / "x") violated by current cell values.
 *
 * All functions are pure and side-effect free so they can be unit tested
 * and safely called from useMemo without React dependencies beyond inputs.
 */

export interface MamboValidationResult {
  /** Cells involved in a 3-in-a-row (or longer) run of the same symbol. */
  threeInRowCells: Set<CellKey>;
  /** Cells in a row/col whose symbol counts are unbalanced. */
  countErrorCells: Set<CellKey>;
  /** Constraint gaps ("=" / "x") whose two cells violate the rule. */
  constraintErrorGaps: Set<string>; // key = `${edge}-${x}-${y}` matching GapCoord
}

const EMPTY_RESULT: MamboValidationResult = {
  threeInRowCells: new Set(),
  countErrorCells: new Set(),
  constraintErrorGaps: new Set(),
};

/**
 * Finds every cell that participates in a run of 3+ identical, non-empty
 * symbols, scanning each row and each column independently.
 */
export function findThreeInRowErrors(
  moves: MamboCellValue[][],
  size: number,
): Set<CellKey> {
  const errors = new Set<CellKey>();

  const scanLine = (
    getCell: (i: number) => MamboCellValue,
    getKey: (i: number) => CellKey,
  ) => {
    let runStart = 0;
    let runVal: MamboCellValue = MAMBO_EMPTY.state ?? 0;

    for (let i = 0; i <= size; i++) {
      const val = i < size ? getCell(i) : (MAMBO_EMPTY.state as MamboCellValue);
      const sameAsRun = val !== MAMBO_EMPTY.state && val === runVal;

      if (!sameAsRun) {
        const runLen = i - runStart;
        if (runVal !== MAMBO_EMPTY.state && runLen >= 3) {
          for (let k = runStart; k < i; k++) errors.add(getKey(k));
        }
        runStart = i;
        runVal = val;
      }
    }
  };

  for (let r = 0; r < size; r++) {
    scanLine(
      (c) => moves[r]?.[c] ?? (MAMBO_EMPTY.state as MamboCellValue),
      (c) => cellKey({ x: r, y: c }),
    );
  }

  for (let c = 0; c < size; c++) {
    scanLine(
      (r) => moves[r]?.[c] ?? (MAMBO_EMPTY.state as MamboCellValue),
      (r) => cellKey({ x: r, y: c }),
    );
  }

  return errors;
}

/**
 * Finds every cell belonging to a row or column whose sun/moon counts
 * exceed the allowed maximum (ceil(size/2) each).
 *
 * Only flags cells once the row/col is fully filled (no empty cells),
 * since a partially-filled line can't yet be judged unbalanced.
 */
export function findCountErrors(
  moves: MamboCellValue[][],
  size: number,
): Set<CellKey> {
  const errors = new Set<CellKey>();
  const maxPerLine = Math.ceil(size / 2);

  const checkLine = (cells: { val: MamboCellValue; key: CellKey }[]) => {
    if (cells.some((c) => c.val === MAMBO_EMPTY.state)) return;

    const sunCount = cells.filter((c) => c.val === MAMBO_SUN.state).length;
    const moonCount = cells.filter((c) => c.val === MAMBO_MOON.state).length;

    if (sunCount > maxPerLine || moonCount > maxPerLine) {
      cells.forEach((c) => errors.add(c.key));
    }
  };

  for (let r = 0; r < size; r++) {
    const rowCells = Array.from({ length: size }, (_, c) => ({
      val: moves[r]?.[c] ?? (MAMBO_EMPTY.state as MamboCellValue),
      key: cellKey({ x: r, y: c }),
    }));
    checkLine(rowCells);
  }

  for (let c = 0; c < size; c++) {
    const colCells = Array.from({ length: size }, (_, r) => ({
      val: moves[r]?.[c] ?? (MAMBO_EMPTY.state as MamboCellValue),
      key: cellKey({ x: r, y: c }),
    }));
    checkLine(colCells);
  }

  return errors;
}

/**
 * Finds every adjacency constraint ("=" / "x") whose two cells currently
 * violate the rule. Only flags constraints where both cells are filled.
 *
 * Returns gap keys in the form `${edge}-${x}-${y}` so callers can match
 * against `GapCoord` directly.
 */
export function findConstraintErrors(
  moves: MamboCellValue[][],
  constraints: MamboConstraint[] | undefined,
): Set<string> {
  const errors = new Set<string>();
  if (!constraints) return errors;

  for (const constraint of constraints) {
    const a = moves[constraint.r1]?.[constraint.c1];
    const b = moves[constraint.r2]?.[constraint.c2];

    if (a == null || b == null) continue;
    if (a === MAMBO_EMPTY.state || b === MAMBO_EMPTY.state) continue;

    const isViolated = constraint.type === "=" ? a !== b : a === b; // "x" means must differ

    if (isViolated) {
      const gc = constraintToGapCoord(constraint);
      if (gc) errors.add(gapKey(gc));
    }
  }

  return errors;
}

export function gapKey(g: GapCoord): string {
  return `${g.edge}-${g.x}-${g.y}`;
}

/**
 * Runs all three checks and returns a combined result.
 * Pass an empty/zero size to short-circuit (e.g. before puzzle loads).
 */
export function validateMamboBoard(
  moves: MamboCellValue[][],
  constraints: MamboConstraint[] | undefined,
  size: number,
): MamboValidationResult {
  if (!size) return EMPTY_RESULT;

  return {
    threeInRowCells: findThreeInRowErrors(moves, size),
    countErrorCells: findCountErrors(moves, size),
    constraintErrorGaps: findConstraintErrors(moves, constraints),
  };
}
