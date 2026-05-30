import {
  clamp,
  lerp,
  mkRng,
  seedFromDiff,
  seedFromLevel,
} from "@/shared/algorithms";
import type { RectInfo } from "./types";
import { area, getLabel, pickAnchor } from "./utils";
import {
  SHIKAKU_TIERS,
  getShikakuParamsByLevel,
  getShikakuParamsByTierIdx,
  type PuzzleParams,
} from "./difficulty";

type RectBase = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export interface GeneratorOptions {
  minArea?: number;

  /**
   * 1.0 = square-ish rectangles
   * 0.0 = long skinny rectangles
   */
  compactness?: number;

  /**
   * 0.0 = equal sizes
   * 1.0 = wildly uneven sizes
   */
  sizeVariance?: number;

  /**
   * 0.0 = informative anchors
   * 1.0 = misleading anchors
   */
  anchorAmbiguity?: number;

  /**
   * true  = reject skinny rectangles
   * false = only enforce minArea
   */
  aspectRatioMode?: boolean;
}

export interface ShikakuPuzzle {
  width: number;
  height: number;
  rectCount: number;
  infos: RectInfo[];
}

function aspectRatio(rect: RectBase): number {
  const w = rect.w;
  const h = rect.h;
  return w > h ? w / h : h / w;
}

function getValidCutRange(
  length: number,
  otherSide: number,
  minArea: number,
): [number, number] | null {
  const minCut = Math.ceil(minArea / otherSide);
  const maxCut = length - minCut;
  return minCut <= maxCut ? [minCut, maxCut] : null;
}

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

export function generateShikaku(
  params: PuzzleParams,
  rng: () => number,
): ShikakuPuzzle {
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

  const infos = rects.map((rect, index) => ({
    label: getLabel(index),
    area: area(rect),
    anchor: pickAnchor(rng, rect, params.anchorAmbiguity),
  }));

  return {
    width: params.width,
    height: params.height,
    rectCount: rects.length,
    infos,
  };
}

export const generateShikakuByLevel = (level: number) => {
  const seed = seedFromLevel(level);
  const rng = mkRng(seed);
  const params = getShikakuParamsByLevel(level, rng);
  return generateShikaku(params, rng);
};

export const generateShikakuByTierIdx = (tierIdx: number) => {
  if (tierIdx >= SHIKAKU_TIERS.length) {
    throw new Error("Tier not found");
  }

  const seed = seedFromDiff(tierIdx, Date.now());
  const rng = mkRng(seed);
  const params = getShikakuParamsByTierIdx(tierIdx, rng);
  return generateShikaku(params, rng);
};
