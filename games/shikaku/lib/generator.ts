import {
  clamp,
  lerp,
  mkRng,
  seedFromDiff,
  seedFromLevel,
} from "@/shared/algorithms";
import type { RectBase, RectInfo } from "./types";
import { area, pickAnchor } from "./utils";
import {
  SHIKAKU_TIERS,
  getShikakuParamsByLevel,
  getShikakuParamsByTierIdx,
  type ShikakuParams,
} from "./difficulty";

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

  /**
   * Whether rectangle aspect ratio should be constrained.
   *
   * When enabled, the generator rejects very skinny rectangles
   * during the initial generation phase.
   *
   * @default true
   */
  aspectRatioMode?: boolean;
}

export interface ShikakuPuzzle {
  /** Board width in cells. */
  width: number;

  /** Board height in cells. */
  height: number;

  /** Number of rectangles in the solution. */
  rectCount: number;

  /** current params that using */
  params: ShikakuParams;

  /** Area clues and anchor positions shown to the player. */
  infos: RectInfo[];
}

/**
 * Generates a complete Shikaku solution board consisting of
 * exactly `n` non-overlapping rectangles.
 *
 * Generation strategy:
 * 1. Start with a single rectangle covering the entire board.
 * 2. Repeatedly split rectangles until the target count is reached.
 * 3. First prefer visually balanced rectangles.
 * 4. Relax aspect-ratio constraints if generation gets stuck.
 *
 * @param width Board width.
 * @param height Board height.
 * @param n Desired rectangle count.
 * @param rng Deterministic random number generator.
 * @param options Generation tuning parameters.
 *
 * @throws Error if:
 * - dimensions are invalid
 * - puzzle is mathematically impossible
 * - generation cannot reach the target rectangle count
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
  const anchorAmbiguity = options.anchorAmbiguity ?? 0.5;

  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    !Number.isInteger(n)
  ) {
    throw new Error("width, height, n must be integers");
  }

  if (width <= 0 || height <= 0 || n <= 0) {
    throw new Error("invalid board size");
  }

  if (width * height < n * minArea) {
    throw new Error("impossible board");
  }

  const MAX_ITER = n * 300;

  const passOptionsStrict: Required<GeneratorOptions> = {
    minArea,
    compactness,
    sizeVariance,
    anchorAmbiguity,
    aspectRatioMode: true,
  };

  const passOptionsLoose: Required<GeneratorOptions> = {
    minArea,
    compactness,
    sizeVariance,
    anchorAmbiguity,
    aspectRatioMode: false,
  };

  const rects: RectBase[] = [{ x: 0, y: 0, w: width, h: height }];

  // Phase 1: try to satisfy aspect ratio.
  for (let guard = 0; guard < MAX_ITER && rects.length < n; guard++) {
    const index = pickRectIndex(rng, rects, sizeVariance);
    const split = splitRect(rng, rects[index], passOptionsStrict);

    if (!split) continue;

    rects[index] = split[0];
    rects.push(split[1]);
  }

  // Phase 2: keep the current board and finish without aspect ratio constraint.
  for (let guard = 0; guard < MAX_ITER && rects.length < n; guard++) {
    const index = pickRectIndex(rng, rects, sizeVariance);
    const split = splitRect(rng, rects[index], passOptionsLoose);

    if (!split) continue;

    rects[index] = split[0];
    rects.push(split[1]);
  }

  if (rects.length !== n) {
    throw new Error("generator stuck");
  }

  return rects;
}

/**
 * Generates a playable Shikaku puzzle.
 *
 * Converts generated solution rectangles into player-facing
 * clues consisting of:
 * - rectangle area
 * - anchor position
 *
 * The actual rectangle boundaries are intentionally hidden.
 */
export function generateShikaku(
  params: ShikakuParams,
  seed: number,
): ShikakuPuzzle {
  const rng = mkRng(seed || Date.now());
  const rects = generateShikakuBoard(
    params.width,
    params.height,
    params.rectCount,
    rng,
    {
      minArea: params.minArea,
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

// Generator .........................

/**
 * Generates a deterministic puzzle for a specific level.
 *
 * The same level always produces the same puzzle.
 */
export const generateShikakuByLevel = (level: number, seed?: number) => {
  const levelSeed = seed ?? seedFromLevel(level);
  const params = getShikakuParamsByLevel(level, levelSeed);
  return generateShikaku(params, levelSeed);
};

/**
 * Generates a puzzle from a difficulty tier.
 *
 * A time-based seed is used, so puzzles vary between sessions
 * even when the same tier is selected.
 *
 * @throws Error if the tier index does not exist.
 */
export const generateShikakuByTierIdx = (tierIdx: number, seed?: number) => {
  if (tierIdx >= SHIKAKU_TIERS.length) {
    throw new Error("Tier not found");
  }
  const tierSeed = seed ?? seedFromDiff(tierIdx, Date.now());
  const params = getShikakuParamsByTierIdx(tierIdx, tierSeed);
  return generateShikaku(params, tierSeed);
};

// ============ HELPER =============================================== //

/**
 * Returns the aspect ratio of a rectangle.
 *
 * The ratio is always >= 1.
 *
 * Examples:
 * - 4x2 => 2
 * - 2x4 => 2
 * - 3x3 => 1
 */
function aspectRatio(rect: RectBase): number {
  const w = rect.w;
  const h = rect.h;
  return w > h ? w / h : h / w;
}

/**
 * Calculates the valid cut range that keeps both resulting
 * rectangles above the minimum area constraint.
 *
 * @returns
 * A tuple containing [minCut, maxCut], or null if no valid split exists.
 */
function getValidCutRange(
  length: number,
  otherSide: number,
  minArea: number,
): [number, number] | null {
  const minCut = Math.ceil(minArea / otherSide);
  const maxCut = length - minCut;
  return minCut <= maxCut ? [minCut, maxCut] : null;
}

/**
 * Picks a split position inside a valid range.
 *
 * Higher compactness values bias cuts toward the center,
 * producing more square-like rectangles.
 */
function biasedCutInRange(
  rng: () => number,
  min: number,
  max: number,
  compactness: number,
): number {
  if (min >= max) return min;

  const span = max - min;
  const center = (min + max) * 0.5;
  const spread = lerp(span * 0.15, span * 0.95, 1 - compactness);

  return clamp(Math.round(center + (rng() - 0.5) * spread), min, max);
}

/**
 * Selects a rectangle to split.
 *
 * Larger rectangles receive higher probability as
 * `sizeVariance` increases.
 *
 * @returns Index of the chosen rectangle.
 */
function pickRectIndex(
  rng: () => number,
  rects: RectBase[],
  sizeVariance: number,
): number {
  const bias = lerp(1.0, 2.5, sizeVariance);

  // One pass for total + cached weights; avoids calling Math.pow twice per rect.
  const weights = new Float64Array(rects.length);
  let total = 0;

  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    const weight = Math.pow(r.w * r.h, bias);
    weights[i] = weight;
    total += weight;
  }

  let target = rng() * total;

  for (let i = 0; i < weights.length; i++) {
    target -= weights[i];
    if (target <= 0) return i;
  }

  return weights.length - 1;
}

/**
 * Attempts to split a rectangle into two valid rectangles.
 *
 * Constraints:
 * - Both children must satisfy minArea.
 * - Aspect ratio limits may be enforced.
 *
 * Multiple attempts are performed using different
 * orientations and cut positions.
 *
 * @returns
 * Two child rectangles or null if no valid split is found.
 */
function splitRect(
  rng: () => number,
  rect: RectBase,
  options: Required<GeneratorOptions>,
): [RectBase, RectBase] | null {
  const { minArea, compactness, aspectRatioMode } = options;

  const verticalFirst = rng() < 0.5;
  const maxAspect = aspectRatioMode ? lerp(999, 2.2, compactness) : Infinity;

  for (let attempt = 0; attempt < 10; attempt++) {
    const vertical =
      rect.w <= 1
        ? false
        : rect.h <= 1
          ? true
          : attempt === 0
            ? verticalFirst
            : rng() < 0.5;

    const length = vertical ? rect.w : rect.h;
    const otherSide = vertical ? rect.h : rect.w;
    const range = getValidCutRange(length, otherSide, minArea);

    if (!range) continue;

    const [minCut, maxCut] = range;
    const cut = biasedCutInRange(rng, minCut, maxCut, compactness);

    const a = vertical
      ? { x: rect.x, y: rect.y, w: cut, h: rect.h }
      : { x: rect.x, y: rect.y, w: rect.w, h: cut };

    const b = vertical
      ? { x: rect.x + cut, y: rect.y, w: rect.w - cut, h: rect.h }
      : { x: rect.x, y: rect.y + cut, w: rect.w, h: rect.h - cut };

    if (
      aspectRatioMode &&
      (aspectRatio(a) > maxAspect || aspectRatio(b) > maxAspect)
    ) {
      continue;
    }

    return [a, b];
  }

  return null;
}
