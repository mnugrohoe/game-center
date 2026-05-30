/**
 * Shikaku utility functions
 */

import type { Cell, Rect, RectInfo } from "./types";

export const LABELS =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz@#$%&*+=";

/**
 * Calculate area of a rectangle
 */
export function area(r: Rect | { w: number; h: number }): number {
  return r.w * r.h;
}

/**
 * Check if rectangle has valid dimensions and area
 */
export function isValidRect(
  r: Rect | { w: number; h: number },
  minArea: number,
): boolean {
  return r.w > 0 && r.h > 0 && area(r) >= minArea;
}

/**
 * Generate label for rectangle at index
 */
export function getLabel(i: number): string {
  return LABELS[i] ?? `R${i}`;
}

/**
 * Pick anchor based on ambiguity difficulty.
 *
 * ambiguity:
 * 0.0 = center-biased (easy)
 * 1.0 = edge/corner-biased (hard)
 */
export function pickAnchor(
  rng: () => number,
  r: Rect | { x: number; y: number; w: number; h: number },
  ambiguity = 0.5,
): Cell {
  // ───────────────────────────────────────────────────────────────────────────
  // Easy:
  // prefer center-ish anchors
  // ───────────────────────────────────────────────────────────────────────────

  if (ambiguity <= 0.33) {
    const minX = Math.floor(r.w * 0.25);
    const maxX = Math.max(minX + 1, Math.ceil(r.w * 0.75));

    const minY = Math.floor(r.h * 0.25);
    const maxY = Math.max(minY + 1, Math.ceil(r.h * 0.75));

    return {
      x: r.x + minX + ((rng() * (maxX - minX)) | 0),

      y: r.y + minY + ((rng() * (maxY - minY)) | 0),
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Medium:
  // fully random
  // ───────────────────────────────────────────────────────────────────────────

  if (ambiguity <= 0.66) {
    return {
      x: r.x + ((rng() * r.w) | 0),
      y: r.y + ((rng() * r.h) | 0),
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Hard:
  // prefer edges/corners
  // ───────────────────────────────────────────────────────────────────────────

  const edge = (rng() * 4) | 0;

  switch (edge) {
    // top edge
    case 0:
      return {
        x: r.x + ((rng() * r.w) | 0),
        y: r.y,
      };

    // bottom edge
    case 1:
      return {
        x: r.x + ((rng() * r.w) | 0),
        y: r.y + r.h - 1,
      };

    // left edge
    case 2:
      return {
        x: r.x,
        y: r.y + ((rng() * r.h) | 0),
      };

    // right edge
    default:
      return {
        x: r.x + r.w - 1,
        y: r.y + ((rng() * r.h) | 0),
      };
  }
}

/**
 * Calculate grid key from coordinates
 */
export function gridKey(x: number, y: number, width: number): number {
  return y * width + x;
}

/**
 * Check if rectangle cells overlap with used cells
 */
export function overlaps(cells: Uint16Array, used: Uint8Array): boolean {
  for (let i = 0; i < cells.length; i++) {
    if (used[cells[i]]) return true;
  }
  return false;
}

/**
 * Mark rectangle cells as used or unused
 */
export function paintCells(
  cells: Uint16Array,
  used: Uint8Array,
  value: 0 | 1,
): void {
  for (let i = 0; i < cells.length; i++) {
    used[cells[i]] = value;
  }
}
