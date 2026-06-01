/**
 * Shikaku solver using shared backtracking algorithm
 */

import type { Rect, RectInfo } from "./types";

/**
 * Solves a Shikaku puzzle using backtracking search with:
 *
 * - Candidate pre-generation
 * - Prefix-sum anchor lookup
 * - MRV (Minimum Remaining Values) heuristic
 * - Forward checking
 *
 * The solver searches for a set of non-overlapping rectangles
 * that exactly cover the board while satisfying all anchor clues.
 *
 * @param width Board width in cells.
 * @param height Board height in cells.
 * @param infos Puzzle clues.
 *
 * @returns Complete rectangle solution.
 *
 * @throws Error if:
 * - puzzle input is invalid
 * - a clue has no valid rectangle candidates
 * - no solution exists
 */
export function solveShikaku(
  width: number,
  height: number,
  infos: RectInfo[],
): Rect[] {
  validateInputs(width, height, infos);

  const boardSize = width * height;

  // occupied cells
  const used = new Uint8Array(boardSize);

  // anchor lookup grid
  const anchorGrid = new Uint8Array(boardSize);

  for (const info of infos) {
    anchorGrid[info.anchor.y * width + info.anchor.x] = 1;
  }

  // prefix sum for anchor counting
  const anchorPS = buildPrefixSum(width, height, anchorGrid);

  const Rects = infos.map((info) => RectsFor(width, height, info, anchorPS));

  for (let i = 0; i < Rects.length; i++) {
    if (Rects[i].length === 0) {
      throw new Error(`unsatisfiable region: ${infos[i].id}`);
    }
  }

  const assigned = new Uint8Array(infos.length);

  const solution: Rect[] = new Array(infos.length);

  function search(depth: number): boolean {
    if (depth === infos.length) {
      return true;
    }

    // Dynamic MRV
    let bestRegion = -1;
    let bestCount = Number.MAX_SAFE_INTEGER;
    let bestList: Rect[] = [];

    for (let r = 0; r < infos.length; r++) {
      if (assigned[r]) continue;

      const valid: Rect[] = [];

      for (const c of Rects[r]) {
        if (!rectOverlaps(c, used, width)) {
          valid.push(c);
        }
      }

      if (valid.length === 0) {
        return false;
      }

      if (valid.length < bestCount) {
        bestCount = valid.length;
        bestRegion = r;
        bestList = valid;

        if (bestCount === 1) break;
      }
    }

    assigned[bestRegion] = 1;

    for (const choice of bestList) {
      fillRect(choice, used, width, 1);

      solution[bestRegion] = choice;

      if (forwardCheck(Rects, assigned, used, width)) {
        if (search(depth + 1)) {
          return true;
        }
      }

      fillRect(choice, used, width, 0);
    }

    assigned[bestRegion] = 0;

    return false;
  }

  if (!search(0)) {
    throw new Error("no solution");
  }

  return solution;
}

/**
 * Validates puzzle dimensions and clue data before solving.
 *
 * Checks:
 * - board dimensions
 * - duplicate ids
 * - duplicate anchors
 * - area consistency
 * - anchor bounds
 *
 * @throws Error when puzzle data is malformed.
 */
function validateInputs(
  width: number,
  height: number,
  infos: RectInfo[],
): void {
  if (!Number.isInteger(width) || width <= 0) {
    throw new Error("invalid width");
  }

  if (!Number.isInteger(height) || height <= 0) {
    throw new Error("invalid height");
  }

  if (infos.length === 0) {
    throw new Error("empty puzzle");
  }

  const boardArea = width * height;

  let totalArea = 0;

  const labels = new Set<string>();
  const anchors = new Set<string>();

  for (const info of infos) {
    if (!info.id) {
      throw new Error("missing label");
    }

    if (labels.has(info.id)) {
      throw new Error(`duplicate label: ${info.id}`);
    }

    labels.add(info.id);

    if (!Number.isInteger(info.area) || info.area <= 0) {
      throw new Error(`invalid area: ${info.id}`);
    }

    totalArea += info.area;

    if (info.area > boardArea) {
      throw new Error(`area too large: ${info.id}`);
    }

    const { x, y } = info.anchor;

    if (
      !Number.isInteger(x) ||
      !Number.isInteger(y) ||
      x < 0 ||
      y < 0 ||
      x >= width ||
      y >= height
    ) {
      throw new Error(`anchor out of bounds: ${info.id}`);
    }

    const k = `${x},${y}`;

    if (anchors.has(k)) {
      throw new Error(`duplicate anchor: ${k}`);
    }

    anchors.add(k);
  }

  if (totalArea !== boardArea) {
    throw new Error(`area mismatch: ${totalArea}/${boardArea}`);
  }
}

/**
 * Generates all valid rectangle candidates for a clue.
 *
 * A candidate rectangle:
 * - Has the required area.
 * - Contains the clue anchor.
 * - Contains no other anchors.
 *
 * These candidates form the search space used by
 * the backtracking solver.
 */
function RectsFor(
  width: number,
  height: number,
  info: RectInfo,
  anchorPS: Int32Array,
): Rect[] {
  const out: Rect[] = [];

  const target = info.area;

  for (let rw = 1; rw * rw <= target; rw++) {
    if (target % rw !== 0) continue;

    const rh = target / rw;

    addFactor(width, height, info, anchorPS, rw, rh, out);

    if (rw !== rh) {
      addFactor(width, height, info, anchorPS, rh, rw, out);
    }
  }

  return out;
}

/**
 * Generates candidate rectangles for a specific
 * width/height factor pair.
 *
 * Every generated rectangle:
 * - Covers the clue anchor.
 * - Contains exactly one anchor.
 */
function addFactor(
  width: number,
  height: number,
  info: RectInfo,
  anchorPS: Int32Array,
  rw: number,
  rh: number,
  out: Rect[],
) {
  if (rw > width || rh > height) {
    return;
  }

  const ax = info.anchor.x;
  const ay = info.anchor.y;

  const startX = Math.max(0, ax - rw + 1);
  const endX = Math.min(ax, width - rw);

  const startY = Math.max(0, ay - rh + 1);
  const endY = Math.min(ay, height - rh);

  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      if (countAnchors(anchorPS, width, x, y, rw, rh) !== 1) {
        continue;
      }

      out.push({
        id: info.id,
        x,
        y,
        w: rw,
        h: rh,
      });
    }
  }
}

/**
 * Builds a summed-area table (prefix sum grid)
 * for constant-time anchor counting.
 *
 * Query complexity:
 * - Build: O(width × height)
 * - Rectangle count query: O(1)
 */
function buildPrefixSum(
  width: number,
  height: number,
  grid: Uint8Array,
): Int32Array {
  const ps = new Int32Array((width + 1) * (height + 1));

  for (let y = 1; y <= height; y++) {
    let row = 0;

    for (let x = 1; x <= width; x++) {
      row += grid[(y - 1) * width + (x - 1)];

      ps[y * (width + 1) + x] = ps[(y - 1) * (width + 1) + x] + row;
    }
  }

  return ps;
}

/**
 * Counts anchors inside a rectangle using the
 * precomputed prefix-sum table.
 *
 * Complexity: O(1)
 */
function countAnchors(
  ps: Int32Array,
  width: number,
  x: number,
  y: number,
  w: number,
  h: number,
): number {
  const stride = width + 1;

  const x2 = x + w;
  const y2 = y + h;

  return (
    ps[y2 * stride + x2] -
    ps[y * stride + x2] -
    ps[y2 * stride + x] +
    ps[y * stride + x]
  );
}

/**
 * Checks whether a candidate rectangle overlaps
 * any already assigned cells.
 *
 * @returns true if overlap exists.
 */
function rectOverlaps(rect: Rect, used: Uint8Array, width: number): boolean {
  const x2 = rect.x + rect.w;
  const y2 = rect.y + rect.h;

  for (let y = rect.y; y < y2; y++) {
    let idx = y * width + rect.x;

    for (let x = rect.x; x < x2; x++) {
      if (used[idx++]) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Marks or clears cells occupied by a rectangle.
 *
 * Used during backtracking assignment and rollback.
 */
function fillRect(
  rect: Rect,
  used: Uint8Array,
  width: number,
  value: 0 | 1,
): void {
  const x2 = rect.x + rect.w;
  const y2 = rect.y + rect.h;

  for (let y = rect.y; y < y2; y++) {
    let idx = y * width + rect.x;

    for (let x = rect.x; x < x2; x++) {
      used[idx++] = value;
    }
  }
}

/**
 * Performs forward checking after assigning a region.
 *
 * Ensures every unassigned clue still has at least one
 * non-overlapping candidate remaining.
 *
 * This significantly reduces the search tree by
 * pruning impossible branches early.
 */
function forwardCheck(
  Rects: Rect[][],
  assigned: Uint8Array,
  used: Uint8Array,
  width: number,
): boolean {
  for (let r = 0; r < Rects.length; r++) {
    if (assigned[r]) continue;

    let possible = false;

    for (const c of Rects[r]) {
      if (!rectOverlaps(c, used, width)) {
        possible = true;
        break;
      }
    }

    if (!possible) {
      return false;
    }
  }

  return true;
}
