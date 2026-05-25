/**
 * Shikaku-specific types
 */

export type Cell = {
  x: number;
  y: number;
};

export type Rect = {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type RectInfo = {
  label: string;
  area: number;
  anchor: Cell;
};
