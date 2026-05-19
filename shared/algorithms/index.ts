/**
 * @module shared/algorithms
 *
 * Game-agnostic algorithm library. Import from here or from individual modules.
 *
 * @example
 *   import { mkRng, shuffle } from "@/shared/algorithms";
 *   import { bfs, getRegionBorders } from "@/shared/algorithms";
 *   import { waveDifficulty, lerp } from "@/shared/algorithms";
 */

export * from "./rng";
export * from "./backtracking";
export * from "./grid";
export * from "./difficulty";
export * from "./formatting";
