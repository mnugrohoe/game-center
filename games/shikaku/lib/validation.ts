import type { Rect, RectInfo } from "./types";

/**
 * Validate solved board against puzzle infos
 *
 * Rules:
 * - every rect label must exist in infos
 * - rect area must match info.area
 * - rect must contain its anchor
 * - rectangles must not overlap
 * - rectangles must fully cover board
 */
export function validateBoard(
  width: number,
  height: number,
  rects: Rect[],
  infos: RectInfo[],
): boolean {
  const boardArea = width * height;

  // exact count
  if (rects.length !== infos.length) {
    return false;
  }

  const infoMap = new Map<string, RectInfo>();

  for (const info of infos) {
    // duplicate labels invalid
    if (infoMap.has(info.label)) {
      return false;
    }

    infoMap.set(info.label, info);
  }

  const used = new Uint8Array(boardArea);

  let covered = 0;

  for (const rect of rects) {
    const info = infoMap.get(rect.label);

    // unknown label
    if (!info) {
      return false;
    }

    // invalid dimensions
    if (rect.w <= 0 || rect.h <= 0) {
      return false;
    }

    // out of bounds
    if (
      rect.x < 0 ||
      rect.y < 0 ||
      rect.x + rect.w > width ||
      rect.y + rect.h > height
    ) {
      return false;
    }

    // area mismatch
    const rectArea = rect.w * rect.h;

    if (rectArea !== info.area) {
      return false;
    }

    // anchor containment
    const ax = info.anchor.x;
    const ay = info.anchor.y;

    if (
      ax < rect.x ||
      ax >= rect.x + rect.w ||
      ay < rect.y ||
      ay >= rect.y + rect.h
    ) {
      return false;
    }

    // overlap detection
    for (let y = rect.y; y < rect.y + rect.h; y++) {
      for (let x = rect.x; x < rect.x + rect.w; x++) {
        const k = y * width + x;

        if (used[k]) {
          return false;
        }

        used[k] = 1;
        covered++;
      }
    }
  }

  // must fully cover board
  return covered === boardArea;
}
