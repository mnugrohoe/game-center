import { clamp, lerp, mkRng, seedFromDiff } from "@/shared/algorithms";
import type { RectBase, RectInfo } from "./types";
import { area, pickAnchor } from "./utils";
import {
  SHIKAKU_TIERS,
  getShikakuParamsByLevel,
  getShikakuParamsByTierIdx,
  type ShikakuParams,
} from "./difficulty";

// ─── Public types ──────────────────────────────────────────────────────────────

export interface GeneratorOptions {
  /**
   * Minimum area allowed for every generated rectangle.
   * Must be >= 2 for a valid Shikaku puzzle.
   *
   * @default 2
   */
  minArea?: number;

  /**
   * Controls how square the generated rectangles are.
   *
   * - 1.0 → prefers square-like rectangles
   * - 0.0 → allows long skinny rectangles
   *
   * @default 0.5
   */
  compactness?: number;

  /**
   * Controls rectangle size distribution.
   *
   * - 0.0 → rectangles tend to be similar in size
   * - 1.0 → large variation between rectangle sizes
   *
   * @default 0.5
   */
  sizeVariance?: number;

  /**
   * Controls anchor placement ambiguity.
   *
   * - 0.0 → anchors provide strong clues
   * - 1.0 → anchors are more misleading
   *
   * @default 0.5
   */
  anchorAmbiguity?: number;
}

export interface ShikakuPuzzle {
  /** Board width in cells. */
  width: number;

  /** Board height in cells. */
  height: number;

  /** Number of rectangles in the solution. */
  rectCount: number;

  /** Parameters used to generate this puzzle. */
  params: ShikakuParams;

  /** Area clues and anchor positions shown to the player. */
  infos: RectInfo[];
}

// ─── Internal types ────────────────────────────────────────────────────────────

/** A candidate rect together with the valid cut range pre-computed for it. */
interface SplitCandidate {
  /** Index into the rects array. */
  index: number;
  /** Whether to cut horizontally (true) or vertically (false). */
  horizontal: boolean;
  /** Lowest valid cut position (inclusive). */
  minCut: number;
  /** Highest valid cut position (inclusive). */
  maxCut: number;
  /** Sampling weight (area raised to the sizeVariance bias). */
  weight: number;
}

// ─── Core generator ────────────────────────────────────────────────────────────

/**
 * Computes the aspect ratio of a rectangle, always >= 1.
 *
 * Examples: 4×2 → 2, 2×4 → 2, 3×3 → 1.
 */
function aspectRatio(rect: RectBase): number {
  return rect.w >= rect.h ? rect.w / rect.h : rect.h / rect.w;
}

/**
 * Picks a cut position within [min, max] biased toward the centre.
 *
 * Higher `compactness` tightens the distribution around centre,
 * producing more square-like children. Lower values spread the cut.
 */
function biasedCut(
  rng: () => number,
  min: number,
  max: number,
  compactness: number,
): number {
  if (min === max) return min;
  const center = (min + max) * 0.5;
  const span = max - min;
  const spread = lerp(span * 0.95, span * 0.15, compactness);
  return clamp(Math.round(center + (rng() - 0.5) * spread), min, max);
}

/**
 * Attempts to build a `SplitCandidate` for the given rectangle.
 *
 * Both orientations are tried so the caller can enforce an aspect-ratio
 * limit by simply not including candidates that violate it.
 *
 * Returns `null` when no valid cut exists (rect is too small).
 *
 * @param enforceAspect  When true, candidate is rejected if either child
 *                       would exceed `maxAspect` for the preferred orientation.
 *                       The opposite orientation is tried as a fallback.
 */
function buildCandidate(
  index: number,
  rect: RectBase,
  minArea: number,
  compactness: number,
  sizeVariance: number,
  maxAspect: number,
  enforceAspect: boolean,
): SplitCandidate | null {
  const bias = lerp(1.0, 2.5, sizeVariance);
  const weight = Math.pow(rect.w * rect.h, bias);

  for (let pass = 0; pass < 2; pass++) {
    // Pass 0: cut along the longest axis (prefer square children).
    // Pass 1: cut along the other axis as a fallback.
    const longAxis = rect.w >= rect.h ? "vertical" : "horizontal";
    const horizontal =
      pass === 0 ? longAxis === "horizontal" : longAxis === "vertical";

    const length = horizontal ? rect.h : rect.w;
    const other = horizontal ? rect.w : rect.h;

    const minCut = Math.ceil(minArea / other);
    const maxCut = length - minCut;

    if (minCut > maxCut) continue;

    if (enforceAspect) {
      // Check worst-case aspect ratio for the smallest possible child.
      // The cut that minimises child size is minCut; the other child has
      // (length - minCut) rows/cols, which is the largest possible.
      const smallChild: Pick<RectBase, "w" | "h"> = horizontal
        ? { w: rect.w, h: minCut }
        : { w: minCut, h: rect.h };
      const largeChild: Pick<RectBase, "w" | "h"> = horizontal
        ? { w: rect.w, h: maxCut }
        : { w: maxCut, h: rect.h };

      if (
        aspectRatio(smallChild as RectBase) > maxAspect ||
        aspectRatio(largeChild as RectBase) > maxAspect
      ) {
        continue;
      }
    }

    return { index, horizontal, minCut, maxCut, weight };
  }

  return null;
}

/**
 * Selects a candidate using weighted random sampling.
 *
 * Because the candidate list is pre-validated, every draw is guaranteed
 * to produce a splittable rectangle — no rejection sampling needed.
 */
function weightedPickCandidate(
  rng: () => number,
  candidates: SplitCandidate[],
): SplitCandidate {
  let total = 0;
  for (const c of candidates) total += c.weight;

  let target = rng() * total;
  for (const c of candidates) {
    target -= c.weight;
    if (target <= 0) return c;
  }
  return candidates[candidates.length - 1];
}

/**
 * Splits a rectangle according to a pre-validated candidate descriptor.
 *
 * The cut is biased toward the centre by `compactness`.
 * Both children are guaranteed to meet the minimum-area constraint
 * (validated when the candidate was built).
 */
function applySplit(
  rng: () => number,
  rect: RectBase,
  candidate: SplitCandidate,
  compactness: number,
): [RectBase, RectBase] {
  const cut = biasedCut(rng, candidate.minCut, candidate.maxCut, compactness);

  if (candidate.horizontal) {
    return [
      { x: rect.x, y: rect.y, w: rect.w, h: cut },
      { x: rect.x, y: rect.y + cut, w: rect.w, h: rect.h - cut },
    ];
  }

  return [
    { x: rect.x, y: rect.y, w: cut, h: rect.h },
    { x: rect.x + cut, y: rect.y, w: rect.w - cut, h: rect.h },
  ];
}

// ─── Board generator ───────────────────────────────────────────────────────────

/**
 * Generates a complete Shikaku solution board consisting of exactly `n`
 * non-overlapping rectangles that together tile the board perfectly.
 *
 * ### Termination guarantee
 *
 * Unlike guard-loop approaches, this function never samples a rectangle
 * blindly and then discards it.  Each iteration:
 *
 * 1. Builds the candidate list — only rects with a valid cut range.
 * 2. Samples one candidate via weighted draw.
 * 3. Applies the split — which always succeeds for a valid candidate.
 *
 * If the candidate list is empty, the board is provably stuck and an
 * error is thrown immediately rather than spinning until a guard expires.
 *
 * ### Two-phase aspect-ratio strategy (from v2)
 *
 * - **Phase 1** enforces a compactness-derived aspect-ratio ceiling.
 *   This produces visually balanced puzzles.
 * - **Phase 2** relaxes the ceiling to infinity.
 *   Only reached if Phase 1 exhausted all valid compact candidates.
 *
 * The transition is seamless — board state is preserved across phases.
 *
 * @throws Error if dimensions or target are invalid.
 * @throws Error if the board is mathematically impossible.
 * @throws Error if the board gets irreversibly stuck (should be unreachable
 *         for a valid puzzle; indicates a bug in the caller's parameters).
 */
export function generateShikakuBoard(
  width: number,
  height: number,
  n: number,
  rng: () => number,
  options: GeneratorOptions = {},
): RectBase[] {
  const minArea = options.minArea ?? 2;
  const compactness = options.compactness ?? 0.5;
  const sizeVariance = options.sizeVariance ?? 0.5;

  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    !Number.isInteger(n)
  ) {
    throw new Error("width, height, and n must be integers");
  }
  if (width <= 0 || height <= 0 || n <= 0) {
    throw new Error("invalid board dimensions");
  }
  if (width * height < n * minArea) {
    throw new Error("impossible board: not enough area for n rectangles");
  }

  // Aspect-ratio ceiling: tighter compactness → lower ceiling.
  // Phase 2 sets it to Infinity (no constraint).
  const strictMaxAspect = lerp(999, 2.2, compactness);

  const rects: RectBase[] = [{ x: 0, y: 0, w: width, h: height }];

  while (rects.length < n) {
    // Build the candidate list for the current phase.
    // Phase 1 (strict) first; fall back to Phase 2 (loose) if empty.
    let candidates = buildCandidateList(
      rects,
      minArea,
      compactness,
      sizeVariance,
      strictMaxAspect,
      true,
    );

    if (candidates.length === 0) {
      candidates = buildCandidateList(
        rects,
        minArea,
        compactness,
        sizeVariance,
        Infinity,
        false,
      );
    }

    if (candidates.length === 0) {
      // Provably stuck: no rect on the board can be split at all.
      throw new Error(
        `generator stuck at ${rects.length}/${n} rectangles — ` +
          "all remaining rects are at minimum area",
      );
    }

    // Every pick is valid; every split is guaranteed to succeed.
    const candidate = weightedPickCandidate(rng, candidates);
    const [a, b] = applySplit(
      rng,
      rects[candidate.index],
      candidate,
      compactness,
    );

    rects[candidate.index] = a;
    rects.push(b);
  }

  return rects;
}

/**
 * Builds the list of splittable candidates from the current board.
 *
 * Pre-validating here means `weightedPickCandidate` + `applySplit` never
 * need to retry or discard a draw — every candidate in the list is ready
 * to split on the next call.
 */
function buildCandidateList(
  rects: RectBase[],
  minArea: number,
  compactness: number,
  sizeVariance: number,
  maxAspect: number,
  enforceAspect: boolean,
): SplitCandidate[] {
  const candidates: SplitCandidate[] = [];

  for (let i = 0; i < rects.length; i++) {
    const candidate = buildCandidate(
      i,
      rects[i],
      minArea,
      compactness,
      sizeVariance,
      maxAspect,
      enforceAspect,
    );
    if (candidate !== null) {
      candidates.push(candidate);
    }
  }

  return candidates;
}

// ─── Puzzle generator ──────────────────────────────────────────────────────────

/**
 * Generates a playable Shikaku puzzle from a parameter set.
 *
 * Converts the internal solution rectangles into player-facing clues:
 * - rectangle area (visible)
 * - anchor cell (visible)
 *
 * The actual rectangle boundaries are intentionally hidden from the player.
 */
export function generateShikaku(params: ShikakuParams): ShikakuPuzzle {
  const rng = mkRng(params.seed);

  const rects = generateShikakuBoard(
    params.width,
    params.height,
    params.rectCount,
    rng,
    {
      minArea: 2,
      compactness: params.compactness,
      sizeVariance: params.sizeVariance,
      anchorAmbiguity: params.anchorAmbiguity,
    },
  );

  const infos: RectInfo[] = rects.map((rect, index) => ({
    id: `${index}`,
    area: area(rect),
    anchor: pickAnchor(rng, rect, params.anchorAmbiguity),
  }));

  return {
    width: params.width,
    height: params.height,
    rectCount: rects.length,
    params,
    infos,
  };
}

// ─── Convenience constructors ──────────────────────────────────────────────────

/**
 * Generates a deterministic puzzle for a specific level.
 *
 * The same level number always produces the same puzzle.
 */
export const generateShikakuByLevel = (level: number): ShikakuPuzzle =>
  generateShikaku(getShikakuParamsByLevel(level));

/**
 * Generates a puzzle from a difficulty tier.
 *
 * A random seed is used when none is provided, so puzzles vary between
 * sessions even when the same tier is selected.
 *
 * @throws Error if the tier index does not exist.
 */
export const generateShikakuByTierIdx = (
  tierIdx: number,
  seed?: number,
): ShikakuPuzzle => {
  if (tierIdx >= SHIKAKU_TIERS.length) {
    throw new Error(`Tier index ${tierIdx} out of range`);
  }

  const resolvedSeed =
    seed ??
    seedFromDiff(tierIdx, crypto.getRandomValues(new Uint32Array(1))[0]);

  return generateShikaku(getShikakuParamsByTierIdx(tierIdx, resolvedSeed));
};
