import { clamp, lerp, mkRng } from "@/shared/algorithms";
import type { RectBase, RectInfo } from "./types";
import { pickAnchor } from "./utils";
import { shikakuParamsGenerator, type ShikakuParams } from "./difficulty";
import { createPuzzleGenerator } from "@/shared/utils/generator";

// ─── Public & Internal Types ──────────────────────────────────────────────────

export interface GeneratorOptions {
  minArea?: number;
  compactness?: number;
  sizeVariance?: number;
  anchorAmbiguity?: number;
}

export interface ShikakuPuzzle {
  width: number;
  height: number;
  rectCount: number;
  params: ShikakuParams;
  infos: RectInfo[];
}

// Menggunakan flat object / primitive structure untuk hemat memori
interface ValidSplit {
  index: number;
  horizontal: boolean;
  minCut: number;
  maxCut: number;
  weight: number;
  isStrict: boolean; // Flag untuk single-pass filtering
}

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

// ─── Core Optimized Generator ─────────────────────────────────────────────────

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
    throw new Error("Inputs must be integers");
  }
  if (width <= 0 || height <= 0 || n <= 0)
    throw new Error("Invalid dimensions");
  if (width * height < n * minArea)
    throw new Error("Impossible board configuration");

  // INTERPOLASI ASPECT RATIO:
  // Jika compactness = 1, kita kunci strict max aspect di angka yang aman (misal 2.2)
  // sesuai ekspektasi test agar tidak menghasilkan rectangle yang terlalu pipih.
  const strictMaxAspect = lerp(999, 2.2, compactness);
  const bias = lerp(1.0, 2.5, sizeVariance);

  const rects: RectBase[] = new Array(n);
  rects[0] = { x: 0, y: 0, w: width, h: height };
  let rectsLength = 1;

  const candidatesBuffer: ValidSplit[] = [];

  while (rectsLength < n) {
    candidatesBuffer.length = 0;
    let hasStrictCandidate = false;

    for (let i = 0; i < rectsLength; i++) {
      const rect = rects[i];
      const weight = Math.pow(rect.w * rect.h, bias);

      for (let isH = 0; isH <= 1; isH++) {
        const horizontal = isH === 1;
        const length = horizontal ? rect.h : rect.w;
        const other = horizontal ? rect.w : rect.h;

        const minCut = Math.ceil(minArea / other);
        const maxCut = length - minCut;

        if (minCut > maxCut) continue;

        const smallW = horizontal ? rect.w : minCut;
        const smallH = horizontal ? minCut : rect.h;
        const largeW = horizontal ? rect.w : maxCut;
        const largeH = horizontal ? maxCut : rect.h;

        // Memakai Math.max langsung (pengganti inline function yang error)
        const ratioSmall = smallW >= smallH ? smallW / smallH : smallH / smallW;
        const ratioLarge = largeW >= largeH ? largeW / largeH : largeH / largeW;

        const isStrict =
          ratioSmall <= strictMaxAspect && ratioLarge <= strictMaxAspect;

        if (isStrict) hasStrictCandidate = true;

        candidatesBuffer.push({
          index: i,
          horizontal,
          minCut,
          maxCut,
          weight,
          isStrict,
        });
      }
    }

    if (candidatesBuffer.length === 0) {
      throw new Error(`Generator stuck at ${rectsLength}/${n} rectangles.`);
    }

    let totalWeight = 0;
    for (let i = 0; i < candidatesBuffer.length; i++) {
      const c = candidatesBuffer[i];
      // Jika kompak (compactness tinggi), prioritaskan kandidat yang strict agar ratio terjaga
      if (hasStrictCandidate && !c.isStrict) continue;
      totalWeight += c.weight;
    }

    let target = rng() * totalWeight;
    let selectedCandidate: ValidSplit | null = null;

    for (let i = 0; i < candidatesBuffer.length; i++) {
      const c = candidatesBuffer[i];
      if (hasStrictCandidate && !c.isStrict) continue;
      target -= c.weight;
      if (target <= 0) {
        selectedCandidate = c;
        break;
      }
    }

    if (!selectedCandidate) {
      selectedCandidate = candidatesBuffer[candidatesBuffer.length - 1];
    }

    const parentRect = rects[selectedCandidate.index];
    const cut = biasedCut(
      rng,
      selectedCandidate.minCut,
      selectedCandidate.maxCut,
      compactness,
    );

    let childA: RectBase;
    let childB: RectBase;

    if (selectedCandidate.horizontal) {
      childA = { x: parentRect.x, y: parentRect.y, w: parentRect.w, h: cut };
      childB = {
        x: parentRect.x,
        y: parentRect.y + cut,
        w: parentRect.w,
        h: parentRect.h - cut,
      };
    } else {
      childA = { x: parentRect.x, y: parentRect.y, w: cut, h: parentRect.h };
      childB = {
        x: parentRect.x + cut,
        y: parentRect.y,
        w: parentRect.w - cut,
        h: parentRect.h,
      };
    }

    rects[selectedCandidate.index] = childA;
    rects[rectsLength] = childB;
    rectsLength++;
  }

  return rects;
}

// ─── Puzzle Generator (Playable Clues) ─────────────────────────────────────────

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

  // Menggunakan map standar namun dengan indeks yang aman
  const infos: RectInfo[] = rects.map((rect, index) => ({
    id: String(index),
    area: rect.w * rect.h,
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

export const shikakuGenerator = createPuzzleGenerator(
  generateShikaku,
  shikakuParamsGenerator,
);
