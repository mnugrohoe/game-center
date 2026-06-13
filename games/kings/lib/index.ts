/**
 * games/kings/lib/index.ts
 *
 * Barrel for all Kings algorithm modules.
 * Game components import from here — not from individual lib files.
 *
 * @example
 *   import { DIFF_TIERS, solveKings, measureRegions, formatTime } from "@/games/kings/lib";
 */
export * from "./constants";
export * from "./difficulty";
export * from "./generator";
export * from "./metrics";
export * from "./solver";
export * from "./validation";

// Convenience re-exports of shared utils most used by Kings
export { formatTime, formatScore } from "@/shared/algorithms/formatting";
export { getRegionBorders } from "@/shared/algorithms/grid";
export { mkRng, seedFromLevel, seedFromDiff } from "@/shared/algorithms/rng";
