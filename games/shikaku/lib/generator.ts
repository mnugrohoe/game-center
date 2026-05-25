import { mkRng } from "@/shared/algorithms";

import type { RectInfo } from "./types";

import { area, isValidRect, getLabel, pickAnchor } from "./utils";

import type { PuzzleParams } from "./difficulty";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

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
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function aspectRatio(rect: RectBase): number {
  return Math.max(rect.w / rect.h, rect.h / rect.w);
}

/**
 * Compactness-aware split position.
 *
 * High compactness:
 * - balanced cuts
 * - square-ish regions
 *
 * Low compactness:
 * - chaotic cuts
 * - long skinny regions
 */
function biasedCut(
  rng: () => number,
  size: number,
  compactness: number,
): number {
  if (size <= 3) {
    return 1;
  }

  const center = size / 2;

  const spread = lerp(size * 0.15, size * 0.95, 1 - compactness);

  const cut = Math.round(center + (rng() - 0.5) * spread);

  return clamp(cut, 1, size - 1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Rectangle Selection
// ─────────────────────────────────────────────────────────────────────────────

function pickRectIndex(
  rng: () => number,
  rects: RectBase[],
  sizeVariance: number,
): number {
  const bias = lerp(1.0, 2.5, sizeVariance);

  let total = 0;

  for (const r of rects) {
    total += Math.pow(area(r), bias);
  }

  let target = rng() * total;

  for (let i = 0; i < rects.length; i++) {
    target -= Math.pow(area(rects[i]), bias);

    if (target <= 0) {
      return i;
    }
  }

  return rects.length - 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// Split Rectangle
// ─────────────────────────────────────────────────────────────────────────────

function splitRect(
  rng: () => number,
  rect: RectBase,
  options: Required<GeneratorOptions>,
): [RectBase, RectBase] | null {
  const { minArea, compactness } = options;

  const verticalFirst = rng() < 0.5;

  const maxAspect = lerp(999, 2.2, compactness);

  for (let attempt = 0; attempt < 10; attempt++) {
    const vertical =
      rect.w <= 1
        ? false
        : rect.h <= 1
          ? true
          : attempt === 0
            ? verticalFirst
            : rng() < 0.5;

    // ── Vertical Split ─────────────────────────────────────────────────────

    if (vertical) {
      if (rect.w <= 1) {
        continue;
      }

      const cut = biasedCut(rng, rect.w, compactness);

      const a: RectBase = {
        x: rect.x,
        y: rect.y,
        w: cut,
        h: rect.h,
      };

      const b: RectBase = {
        x: rect.x + cut,
        y: rect.y,
        w: rect.w - cut,
        h: rect.h,
      };

      if (!isValidRect(a, minArea) || !isValidRect(b, minArea)) {
        continue;
      }

      // reject ugly skinny regions
      if (aspectRatio(a) > maxAspect || aspectRatio(b) > maxAspect) {
        continue;
      }

      return [a, b];
    }

    // ── Horizontal Split ───────────────────────────────────────────────────

    if (rect.h <= 1) {
      continue;
    }

    const cut = biasedCut(rng, rect.h, compactness);

    const a: RectBase = {
      x: rect.x,
      y: rect.y,
      w: rect.w,
      h: cut,
    };

    const b: RectBase = {
      x: rect.x,
      y: rect.y + cut,
      w: rect.w,
      h: rect.h - cut,
    };

    if (!isValidRect(a, minArea) || !isValidRect(b, minArea)) {
      continue;
    }

    if (aspectRatio(a) > maxAspect || aspectRatio(b) > maxAspect) {
      continue;
    }

    return [a, b];
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Board Generator
// ─────────────────────────────────────────────────────────────────────────────

export function generateBoard(
  width: number,
  height: number,
  n: number,
  seed: number,
  options: GeneratorOptions = {},
): RectBase[] {
  const finalOptions: Required<GeneratorOptions> = {
    minArea: options.minArea ?? 2,

    compactness: options.compactness ?? 0.5,

    sizeVariance: options.sizeVariance ?? 0.5,

    anchorAmbiguity: options.anchorAmbiguity ?? 0.5,
  };

  const { minArea } = finalOptions;

  // ── Validation ───────────────────────────────────────────────────────────

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

  const rng = mkRng(seed);

  const rects: RectBase[] = [
    {
      x: 0,
      y: 0,
      w: width,
      h: height,
    },
  ];

  let guard = 0;

  const MAX_ITER = n * 300;

  while (rects.length < n) {
    guard++;

    if (guard > MAX_ITER) {
      throw new Error("generator stuck");
    }

    const index = pickRectIndex(rng, rects, finalOptions.sizeVariance);

    const target = rects[index];

    const split = splitRect(rng, target, finalOptions);

    if (!split) {
      continue;
    }

    rects.splice(index, 1, split[0], split[1]);
  }

  return rects;
}

// ─────────────────────────────────────────────────────────────────────────────
// Puzzle Generator
// ─────────────────────────────────────────────────────────────────────────────

export function generate(params: PuzzleParams, seed: number): RectInfo[] {
  const rects = generateBoard(
    params.width,
    params.height,
    params.rectCount,
    seed,
    {
      minArea: params.minArea,

      compactness: params.compactness,

      sizeVariance: params.sizeVariance,

      anchorAmbiguity: params.anchorAmbiguity,
    },
  );

  const rng = mkRng(seed ^ 0x9e3779b9);

  return rects.map((rect, index) => ({
    label: getLabel(index),

    area: area(rect),

    anchor: pickAnchor(rng, rect, params.anchorAmbiguity),
  }));
}
