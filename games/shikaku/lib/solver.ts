/**
 * Shikaku solver — optimized
 *
 * Key improvements over naive backtracking:
 *
 * 1. Incremental candidate filtering
 *    A `cellToCandidates` index maps every board cell to the list of
 *    (region, candidateIndex) pairs whose rectangle covers that cell.
 *    When a rect is placed, every affected candidate in other regions
 *    is reference-counted as "blocked". When a rect is removed during
 *    backtracking, those counts are decremented and candidates are
 *    restored. This eliminates the O(candidates × rect_area) scan that
 *    the naive solver repeats at every search node.
 *
 * 2. Merged MRV + forward checking
 *    Because `validCount[r]` is maintained incrementally, both the
 *    minimum-remaining-values heuristic and the forward-check are free
 *    O(n_regions) scans of that array — no per-candidate overlap test
 *    is needed during search.
 *
 * 3. Candidate pre-sorting by board tightness
 *    Candidates whose rectangles are pressed against board edges or
 *    corners have fewer alternative placements. Trying them first
 *    produces earlier conflicts and prunes the tree more aggressively.
 */

import type { Rect, RectInfo } from "./types";

export function solveShikaku(
  width: number,
  height: number,
  infos: RectInfo[],
): Rect[] {
  validateInputs(width, height, infos);

  const boardSize = width * height;
  const n = infos.length;

  // ── Anchor prefix-sum ──────────────────────────────────────────────
  const anchorGrid = new Uint8Array(boardSize);
  for (const info of infos) {
    anchorGrid[info.anchor.y * width + info.anchor.x] = 1;
  }
  const anchorPS = buildPrefixSum(width, height, anchorGrid);

  // ── Generate + pre-sort candidates ────────────────────────────────
  const allCandidates: Rect[][] = infos.map((info) =>
    rectsFor(width, height, info, anchorPS),
  );

  for (let r = 0; r < n; r++) {
    if (allCandidates[r].length === 0) {
      throw new Error(`unsatisfiable region: ${infos[r].id}`);
    }
    // Tighter placements (near board edges) tried first.
    allCandidates[r].sort(
      (a, b) =>
        candidateTightness(a, width, height) -
        candidateTightness(b, width, height),
    );
  }

  // ── Incremental state ──────────────────────────────────────────────
  //
  // cellToCandidates[cell] = list of [regionIdx, candidateIdx] whose
  // rectangle covers `cell`. Built once; never mutated during search.
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

  // candBlocked[r][ci] — number of placed rects that overlap candidate ci
  // of region r.  Candidate is available iff candBlocked[r][ci] === 0.
  const candBlocked: Int32Array[] = allCandidates.map(
    (c) => new Int32Array(c.length),
  );

  // validCount[r] — number of still-available candidates for region r.
  const validCount = new Int32Array(allCandidates.map((c) => c.length));

  const used = new Uint8Array(boardSize);
  const assigned = new Uint8Array(n);
  const solution: Rect[] = new Array(n);

  // ── Incremental place / remove ────────────────────────────────────

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

  // ── Search ────────────────────────────────────────────────────────

  function search(depth: number): boolean {
    if (depth === n) return true;

    // MRV — pick unassigned region with fewest valid candidates.
    // Forward check is free: validCount[r] === 0 means dead end.
    let bestRegion = -1;
    let bestCount = Number.MAX_SAFE_INTEGER;

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

// ── Candidate generation ───────────────────────────────────────────

/**
 * Score: smaller = tighter against board boundary = tried first.
 * Corner rects score 0; central rects score highest.
 */
function candidateTightness(rect: Rect, width: number, height: number): number {
  const mx = Math.min(rect.x, width - (rect.x + rect.w));
  const my = Math.min(rect.y, height - (rect.y + rect.h));
  return mx + my;
}

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

// ── Prefix-sum helpers ─────────────────────────────────────────────

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

// ── Validation ─────────────────────────────────────────────────────

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
