/**
 * Shikaku-specific types
 */

export type Cell = {
  x: number;
  y: number;
};

export type RectBase = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Rect = RectBase & {
  id: string;
};

export type userRect = Rect & {
  validAnchor?: boolean;
};

export type RectInfo = {
  id: string;
  area: number;
  anchor: Cell;
};

export type DragState = {
  s: Cell;
  c: Cell;
};
