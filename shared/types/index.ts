/**
 * shared/types/index.ts
 *
 * Every type that crosses module boundaries lives here.
 * Games import FROM here — never the other way around.
 */

// ── Grid primitives ──────────────────────────────────────────────────────────

/** A 2-D integer grid. Negative values = unassigned. */
export type Grid2D = number[][];

/** [row, col] coordinate pair. */
export type Coord = [number, number];

export const CARDINAL_DIRS: Coord[] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];
export const ALL_DIRS: Coord[] = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

// ── RNG / algorithms ─────────────────────────────────────────────────────────

/** Seeded PRNG that returns [0, 1). */
export type RngFn = () => number;

export interface BacktrackResult<T> {
  found: boolean;
  solution: T | null;
  statesExplored: number;
}

// ── Difficulty system ─────────────────────────────────────────────────────────

/**
 * One named difficulty tier. Lives in shared so both Kings and Mambo
 * can satisfy the same contract without redefining it.
 * Game-specific fields (minGrid, maxGrid, etc.) go in the game's own tier type
 * by extending this.
 */
export interface DiffTier {
  name: string;
  icon: string;
  diffScore: number;
  color: ColorType; /* accent hex, e.g. "#4a9e6a"      */
  dim: ColorType; /* dimmed border, e.g. "#2a5e3a"    */
  bright: ColorType; /* bright text, e.g. "#7ed4a0"      */
}

// ── UI / layout ───────────────────────────────────────────────────────────────

export interface TabItem {
  id: string;
  label: string;
  icon: string;
}

/** The three fixed tabs every game page uses. */
export type GameTabId = "game" | "solver" | "generator";

// Hex format: #RRGGBB atau #RGB
type HexColor = `#${string}`;

// RGB format: rgb(0,0,0)
type RGBColor = `rgb(${number},${number},${number})`;

// RGBA format: rgba(0,0,0,0.5)
type RGBAColor = `rgba(${number},${number},${number},${number})`;

// HSL format: hsl(0,0%,0%)
type HSLColor = `hsl(${number},${number}%,${number}%)`;

// HSLA format: hsla(0,0%,0%,0.5)
type HSLAColor = `hsla(${number},${number}%,${number}%,${number})`;

export type ColorType = HexColor | RGBColor | RGBAColor | HSLColor | HSLAColor;

export type ClassNameType = React.HTMLAttributes<HTMLDivElement>["className"];
export type StyleType = React.HTMLAttributes<HTMLDivElement>["style"];

export type GeneratorMode = "Difficulty" | "Level" | "Customs";
export type ToolSelectionMode = "Generator" | "Solver";
