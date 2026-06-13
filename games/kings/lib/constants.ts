/**
 * games/kings/lib/constants.ts
 *
 * Visual color arrays for the Kings board.
 * Defined ONCE. Not duplicated in core/const.ts (delete that file).
 */

import { Coord } from "@/shared/types";
import {
  BlankCanvasState,
  EmptyCellState,
  KingCellState,
  LockCellState,
  MarkerCellState,
} from "../types";

export const MARKER_KINGS = "♛" as const;
export const MARKER_DOTS = "·" as const;
export const MARKER_X = "x" as const;

export const BLANK_CANVAS_STATE: BlankCanvasState = -1;
export const EMPTY_CELL_STATE: EmptyCellState = 0;
export const MARKER_CELL_STATE: MarkerCellState = 1;
export const LOCK_CELL_STATE: LockCellState = 2;
export const KING_CELL_STATE: KingCellState = 3;

export const DIRS: readonly Coord[] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
] as const;
