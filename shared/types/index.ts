/**
 * shared/types/index.ts
 *
 * Every type that crosses module boundaries lives here.
 * Games import FROM here — never the other way around.
 * * @module SharedTypes
 */

// ── 1. GRID PRIMITIVES ───────────────────────────────────────────────────────

/** * A 2-D integer grid. Negative values usually denote unassigned cells.
 */
export type Grid2D = number[][];

/** * A matrix coordinate pair representing `[row, col]`.
 */
export type Coord = [number, number];

/**
 * 4-Way directional offsets (Up, Down, Left, Right).
 */
export const CARDINAL_DIRS: Coord[] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

/**
 * 8-Way directional offsets including diagonals.
 */
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

// ── 2. ALGORITHMS & RNG ──────────────────────────────────────────────────────

/** * Seeded PRNG function that returns a pseudo-random number in the range `[0, 1)`.
 */
export type RngFn = () => number;

/**
 * Structured output wrapper for backtracking algorithm operations.
 * @template T The shape of the expected solution payload.
 */
export interface BacktrackResult<T> {
  /** Indicates whether a valid terminal state configuration was discovered. */
  found: boolean;
  /** The final solved matrix structural data, or null if execution failed. */
  solution: T | null;
  /** Total evaluation cycles consumed during processing. */
  statesExplored: number;
}

// ── 3. CSS & COLOR SYSTEMS ────────────────────────────────────────────────────

/** Hexadecimal layout formatting: `#RRGGBB` or `#RGB`. */
type HexColor = `#${string}`;

/** Standard RGB format: `rgb(0, 0, 0)` (allows optional white spaces). */
type RGBColor = `rgb(${number},${string}${number},${string}${number})`;

/** Standard RGBA format: `rgba(0, 0, 0, 0.5)` (allows optional white spaces). */
type RGBAColor =
  `rgba(${number},${string}${number},${string}${number},${string}${number})`;

/** Standard HSL layout: `hsl(0, 0%, 0%)`. */
type HSLColor =
  | `hsl(${number},${string}${number}%,${string}${number}%)`
  | `hsl(${number} ${string}${number}% ${string}${number}%)`;

/** Standard HSLA layout: `hsla(0, 0%, 0%, 0.5)`. */
type HSLAColor =
  `hsla(${number},${string}${number}%,${string}${number}%,${string}${number})`;

/** * Union of supported CSS valid color structure formats.
 */
export type ColorType = HexColor | RGBColor | RGBAColor | HSLColor | HSLAColor;

// ── 4. DIFFICULTY HIERARCHIES ────────────────────────────────────────────────

/**
 * Core interface definition for a named difficulty profile tier.
 * Shared globally across modules to ensure cross-app UI consistency.
 * Can be extended on a per-game framework basis to inject explicit system boundaries.
 */
export interface DiffTier {
  /** Display label shown in selection elements. */
  name: string;
  /** Visual graphical reference lookup key identifier string. */
  icon: string;
  /** Core computational weight indicator used for procedural ranking. */
  diffScore: number;
  /** Primary action interface target accent color hex string (e.g., `"#4a9e6a"`). */
  color: ColorType;
  /** Subdued or muted border/inactive container state styling hex string (e.g., `"#2a5e3a"`). */
  dim: ColorType;
  /** High-contrast structural element highlighting hex string (e.g., `"#7ed4a0"`). */
  bright: ColorType;
}

// ── 5. REACT & UI ARCHITECTURE ───────────────────────────────────────────────

/**
 * Standard utility mapping metadata payload schema layout for interface tab item arrays.
 */
export interface TabItem {
  id: string;
  label: string;
  icon: string;
}

/** The three structural tabs explicitly mounted inside every game workspace layout wrapper view. */
export type GameTabId = "game" | "solver" | "generator";

/** Explicit UI selection filter target options for procedural layout generation processes. */
export type GeneratorMode = "Difficulty" | "Level" | "Customs";

/** Active workspace execution control focus configuration identifiers. */
export type ToolSelectionMode = "Generator" | "Solver";

// ── 6. COMPONENT PROP INHERITANCE ────────────────────────────────────────────

/** Inherited standard CSS styling string class reference attributes assigned directly to standard structural `<div>` boundaries. */
export type ClassNameType = React.HTMLAttributes<HTMLDivElement>["className"];

/** Explicit structural HTML element React CSS inline style properties payload wrapper object types. */
export type StyleType = React.HTMLAttributes<HTMLDivElement>["style"];

/** Extends the native HTML button attributes specification for generic standard component composition. */
export type ButtonType = React.ButtonHTMLAttributes<HTMLButtonElement>;

/** * Extends the native HTML div attributes specification for generic structural layout composition.
 */
export type DivType = React.HTMLAttributes<HTMLDivElement>;

/** * Extends the native HTML input attributes specification for generic structural layout composition.
 */
export type InputType = React.HTMLAttributes<HTMLInputElement>;

/**
 * Standardized generic encapsulation mapping model wrapper targeting unified mutual React `useState` prop hook pipelines.
 * @template T The underlying element data structure tracking mutation events.
 */
export type StateProp<T> = {
  value: T;
  setValue: React.Dispatch<React.SetStateAction<T>>;
};
