import { ShikakuPuzzle } from "./generator";
import type { Rect, userRect } from "./types";

/**
 * Determines whether the player's solution completely covers
 * the board and satisfies all anchor constraints.
 *
 * Conditions:
 * - Rectangle count matches puzzle clues.
 * - Every rectangle contains exactly one valid anchor.
 * - Total covered area equals board area.
 */
export function checkShikakuComplete(
  rects: userRect[],
  puzzle: ShikakuPuzzle,
): boolean {
  return (
    rects.length === puzzle.infos.length &&
    rects.every((rect) => rect.validAnchor) &&
    rects.reduce((sum, rect) => sum + rect.w * rect.h, 0) ===
      puzzle.width * puzzle.height
  );
}

export function checkShikakuAnchor(rect: Rect, puzzle: ShikakuPuzzle): boolean {
  const x2 = rect.x + rect.w;
  const y2 = rect.y + rect.h;

  const anchors = puzzle.infos.filter(
    ({ anchor }) =>
      anchor.x >= rect.x &&
      anchor.x < x2 &&
      anchor.y >= rect.y &&
      anchor.y < y2,
  );

  return anchors.length === 1 && rect.w * rect.h === anchors[0].area;
}
