/**
 * Kings algorithm barrel.
 * Re-exports all Kings-specific lib modules.
 *
 * Also re-exports the shared algorithms used most often in Kings,
 * so existing code importing from "@/games/kings/lib/index" can
 * migrate incrementally to the specific modules.
 */

export * from "./constants";
export * from "./difficulty";
export * from "./generator";
export * from "./metrics";
export * from "./solver";

// Convenience re-exports from shared (most commonly used in Kings)
export { formatTime, formatScore } from "@/shared/algorithms/formatting";
export { getRegionBorders } from "@/shared/algorithms/grid";
export { mkRng, shuffle, seedFromLevel, seedFromDiff } from "@/shared/algorithms/rng";
