import type { Rect, RectInfo } from "./types";

// ─── Public Functions ─────────────────────────────────────────────────────────

/**
 * Solves a Shikaku puzzle using an optimized backtracking algorithm with
 * Forward Checking, Minimum Remaining Values (MRV) heuristic, and smart candidate pre-sorting.
 *
 * @param width - The width of the board in cells.
 * @param height - The height of the board in cells.
 * @param infos - An array of region definitions containing area clues and anchor points.
 * @returns An array of {@link Rect} objects representing the final solution layout.
 */
export function solveShikaku(
  width: number,
  height: number,
  infos: RectInfo[],
): Rect[] {
  validateInputs(width, height, infos);

  const boardSize = width * height;
  const n = infos.length;

  /** * A flat 1D grid representing anchor locations.
   * A value of 1 indicates the cell contains an anchor point.
   */
  const anchorGrid = new Uint8Array(boardSize);
  for (const info of infos) {
    anchorGrid[info.anchor.y * width + info.anchor.x] = 1;
  }

  /** 2D Prefix-Sum table computed from the anchor grid for O(1) density evaluation. */
  const anchorPS = buildPrefixSum(width, height, anchorGrid);

  /** * A two-dimensional array holding all potential geometric {@link Rect} candidates
   * grouped by their region index `r`.
   */
  const allCandidates: Rect[][] = infos.map((info) =>
    rectsFor(width, height, info, anchorPS),
  );

  for (let r = 0; r < n; r++) {
    if (allCandidates[r].length === 0) {
      throw new Error(`unsatisfiable region: ${infos[r].id}`);
    }

    /** * Pre-sort candidates: Tighter placements (e.g., pressed against board edges
     * or corners) are prioritized to induce earlier conflicts and prune the search tree.
     */
    allCandidates[r].sort(
      (a, b) =>
        candidateTightness(a, width, height) -
        candidateTightness(b, width, height),
    );
  }

  /**
   * Static look-up index mapping each cell ID to an array of tuple pairs `[regionIdx, candidateIdx]`.
   * Identifies exactly which candidate rectangles overlap this specific cell coordinate.
   * Built once before the search phase and remains immutable throughout backtracking.
   */
  const cellToCandidates: Array<Array<[number, number]>> = Array.from(
    { length: boardSize },
    () => [],
  );

  for (let r = 0; r < n; r++) {
    for (let ci = 0; ci < allCandidates[r].length; ci++) {
      const rect = allCandidates[r][ci];
      const x2 = rect.x + rect.w;
      const y2 = rect.y + rect.h;
      for (let y = rect.y; y < y2; y++) {
        for (let x = rect.x; x < x2; x++) {
          cellToCandidates[y * width + x].push([r, ci]);
        }
      }
    }
  }

  /**
   * Reference tracker matrix. `candBlocked[r][ci]` stores the number of currently placed
   * rectangles overlapping candidate `ci` of region `r`.
   * A candidate is available if and only if its block count is exactly 0.
   */
  const candBlocked: Int32Array[] = allCandidates.map(
    (c) => new Int32Array(c.length),
  );

  /** Fast lookup tracking the total number of still-available candidates for region `r`. */
  const validCount = new Int32Array(allCandidates.map((c) => c.length));

  /** State array indicating whether a cell is occupied (`1`) or vacant (`0`). */
  const used = new Uint8Array(boardSize);

  /** State array indicating whether a region `r` has been assigned a rectangle solution. */
  const assigned = new Uint8Array(n);

  /** Temporary array storing the current path solution. */
  const solution: Rect[] = new Array(n);

  /**
   * Commits a rectangle candidate to the board state and incrementally marks
   * overlapping candidates in other regions as blocked.
   *
   * @param rect - The candidate rectangle to place.
   * @param regionIdx - The index of the region owning the candidate.
   */
  function place(rect: Rect, regionIdx: number): void {
    const x2 = rect.x + rect.w;
    const y2 = rect.y + rect.h;
    for (let y = rect.y; y < y2; y++) {
      for (let x = rect.x; x < x2; x++) {
        const cell = y * width + x;
        used[cell] = 1;
        for (const [r, ci] of cellToCandidates[cell]) {
          if (r === regionIdx) continue;
          if (candBlocked[r][ci] === 0) validCount[r]--;
          candBlocked[r][ci]++;
        }
      }
    }
  }

  /**
   * Removes a rectangle candidate from the board state during backtracking and
   * decrements block references, restoring candidates that are no longer obstructed.
   *
   * @param rect - The candidate rectangle to retract.
   * @param regionIdx - The index of the region owning the candidate.
   */
  function remove(rect: Rect, regionIdx: number): void {
    const x2 = rect.x + rect.w;
    const y2 = rect.y + rect.h;
    for (let y = rect.y; y < y2; y++) {
      for (let x = rect.x; x < x2; x++) {
        const cell = y * width + x;
        used[cell] = 0;
        for (const [r, ci] of cellToCandidates[cell]) {
          if (r === regionIdx) continue;
          candBlocked[r][ci]--;
          if (candBlocked[r][ci] === 0) validCount[r]++;
        }
      }
    }
  }

  /**
   * Recursive backtracking search loop utilizing the Minimum Remaining Values (MRV) heuristic.
   *
   * @param depth - The current layer depth of the search tree (number of placed regions).
   * @returns `true` if a configuration solves the board layout completely, otherwise `false`.
   */
  function search(depth: number): boolean {
    if (depth === n) return true;

    let bestRegion = -1;
    let bestCount = Number.MAX_SAFE_INTEGER;

    // MRV Selection Strategy: Pick unassigned region with fewest valid candidates.
    // Forward Checking comes free: validCount[r] === 0 flags an immediate dead end.
    for (let r = 0; r < n; r++) {
      if (assigned[r]) continue;
      if (validCount[r] === 0) return false;
      if (validCount[r] < bestCount) {
        bestCount = validCount[r];
        bestRegion = r;
        if (bestCount === 1) break;
      }
    }

    assigned[bestRegion] = 1;
    const candidates = allCandidates[bestRegion];
    const blocked = candBlocked[bestRegion];

    for (let ci = 0; ci < candidates.length; ci++) {
      if (blocked[ci] > 0) continue;

      const choice = candidates[ci];
      place(choice, bestRegion);
      solution[bestRegion] = choice;

      if (search(depth + 1)) return true;

      remove(choice, bestRegion);
    }

    assigned[bestRegion] = 0;
    return false;
  }

  if (!search(0)) {
    throw new Error("no solution");
  }

  return solution;
}

// ─── Internal Helper Functions ───────────────────────────────────────────────

/**
 * Calculates the positional tightness score of a candidate rectangle against board edges.
 * Corner rectangles yield `0`, while centered rectangles yield higher cumulative values.
 * * @internal
 */
function candidateTightness(rect: Rect, width: number, height: number): number {
  const mx = Math.min(rect.x, width - (rect.x + rect.w));
  const my = Math.min(rect.y, height - (rect.y + rect.h));
  return mx + my;
}

/**
 * Finds all geometrically valid rectangles matching a region's target area that encompass
 * its designated anchor point without capturing alternative anchors.
 * * @internal
 */
function rectsFor(
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
    if (rw !== rh) addFactor(width, height, info, anchorPS, rh, rw, out);
  }

  return out;
}

/**
 * Validates and slides a specific bounding matrix configuration across possible sub-coordinates
 * to collect safe layout allocations.
 * * @internal
 */
function addFactor(
  width: number,
  height: number,
  info: RectInfo,
  anchorPS: Int32Array,
  rw: number,
  rh: number,
  out: Rect[],
): void {
  if (rw > width || rh > height) return;

  const ax = info.anchor.x;
  const ay = info.anchor.y;

  const startX = Math.max(0, ax - rw + 1);
  const endX = Math.min(ax, width - rw);
  const startY = Math.max(0, ay - rh + 1);
  const endY = Math.min(ay, height - rh);

  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      if (countAnchors(anchorPS, width, x, y, rw, rh) !== 1) continue;
      out.push({ id: info.id, x, y, w: rw, h: rh });
    }
  }
}

/**
 * Generates a 2D Summed-Area Table (Prefix-Sum) structure for rapid area query lookups.
 * * @internal
 * @returns An `Int32Array` representing the prefix sum coordinates.
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
 * Uses the Summed-Area Table to compute the count of anchor points within a rectangular region boundary in O(1) time.
 * * @internal
 * @returns The total number of anchors caught inside the query rectangle bounds.
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
 * Comprehensive assertion layer verifying consistency, dimensions, overlapping properties,
 * label naming integrity, and capacity bounds of inputs.
 * * @throws {@link Error} If bounds, identifiers, or area limits are violated.
 * @internal
 */
function validateInputs(
  width: number,
  height: number,
  infos: RectInfo[],
): void {
  if (!Number.isInteger(width) || width <= 0) throw new Error("invalid width");
  if (!Number.isInteger(height) || height <= 0)
    throw new Error("invalid height");
  if (infos.length === 0) throw new Error("empty puzzle");

  const boardArea = width * height;
  let totalArea = 0;
  const labels = new Set<RectInfo["id"]>();
  const anchors = new Set<string>();

  for (const info of infos) {
    if (!info.id) throw new Error("missing label");
    if (labels.has(info.id)) throw new Error(`duplicate label: ${info.id}`);
    labels.add(info.id);

    if (!Number.isInteger(info.area) || info.area <= 0)
      throw new Error(`invalid area: ${info.id}`);
    totalArea += info.area;
    if (info.area > boardArea) throw new Error(`area too large: ${info.id}`);

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
    if (anchors.has(k)) throw new Error(`duplicate anchor: ${k}`);
    anchors.add(k);
  }

  if (totalArea !== boardArea)
    throw new Error(`area mismatch: ${totalArea}/${boardArea}`);
}
