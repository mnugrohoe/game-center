/**
 * games/mambo/lib/difficulty.ts
 *
 * Mambo difficulty config — uses the shared wave system.
 * DIFF_TIERS defined ONCE here (not duplicated in mambo/const.ts — delete that file).
 */
import type { DiffTier } from "@/shared/types";
import {
  levelToDiffScore as sharedLevelToDiffScore,
  diffScoreToTierIdx,
  levelToTierIdx as sharedLevelToTierIdx,
} from "@/shared/algorithms/difficulty";

// Re-export so Mambo code imports from one place
export { diffScoreToTierIdx };

// ── Mambo tier definition ─────────────────────────────────────────────────────

export interface MamboDiffTier extends DiffTier {
  sub: string; /* short card subtitle             */
  gridSize: number; /* even number                     */
  initRatio: number; /* fraction of cells pre-filled    */
  constraintRatio: number; /* fraction of edges with constraints */
}

export const DIFF_TIERS: MamboDiffTier[] = [
  {
    name: "Dusk",
    icon: "🌅",
    diffScore: 1,
    sub: "4×4 · intro",
    gridSize: 4,
    initRatio: 0.56,
    constraintRatio: 0.18,
    color: "#7dd3fc",
    dim: "#3a7899",
    bright: "#baeaff",
  },
  {
    name: "Ember",
    icon: "🔥",
    diffScore: 2,
    sub: "4×4 · warm up",
    gridSize: 4,
    initRatio: 0.44,
    constraintRatio: 0.15,
    color: "#86efac",
    dim: "#3a7a52",
    bright: "#bbffd4",
  },
  {
    name: "Fog",
    icon: "🌫",
    diffScore: 3,
    sub: "6×6 · mild",
    gridSize: 6,
    initRatio: 0.48,
    constraintRatio: 0.17,
    color: "#fde68a",
    dim: "#8a7030",
    bright: "#fff4cc",
  },
  {
    name: "Tide",
    icon: "🌊",
    diffScore: 4,
    sub: "6×6 · steady",
    gridSize: 6,
    initRatio: 0.38,
    constraintRatio: 0.15,
    color: "#fbbf24",
    dim: "#8a6010",
    bright: "#ffe08a",
  },
  {
    name: "Storm",
    icon: "⛈",
    diffScore: 5,
    sub: "6×6 · tricky",
    gridSize: 6,
    initRatio: 0.27,
    constraintRatio: 0.13,
    color: "#fb923c",
    dim: "#8a4010",
    bright: "#ffc89a",
  },
  {
    name: "Abyss",
    icon: "🕳",
    diffScore: 6,
    sub: "8×8 · hard",
    gridSize: 8,
    initRatio: 0.37,
    constraintRatio: 0.15,
    color: "#f87171",
    dim: "#8a2020",
    bright: "#ffbbbb",
  },
  {
    name: "Void",
    icon: "🌑",
    diffScore: 7,
    sub: "8×8 · brutal",
    gridSize: 8,
    initRatio: 0.26,
    constraintRatio: 0.12,
    color: "#e879f9",
    dim: "#8a20a0",
    bright: "#f8bbff",
  },
  {
    name: "Eclipse",
    icon: "🌒",
    diffScore: 8,
    sub: "8×8 · extreme",
    gridSize: 8,
    initRatio: 0.19,
    constraintRatio: 0.1,
    color: "#a78bfa",
    dim: "#5030a0",
    bright: "#d4bbff",
  },
  {
    name: "Zenith",
    icon: "⭐",
    diffScore: 9,
    sub: "10×10 · master",
    gridSize: 10,
    initRatio: 0.19,
    constraintRatio: 0.09,
    color: "#ffffff",
    dim: "#888888",
    bright: "#ffffff",
  },
];

// ── Level helpers ─────────────────────────────────────────────────────────────

export function levelToDiffScore(level: number): number {
  return Math.round(sharedLevelToDiffScore(level));
}

export function levelToTierIdx(level: number): number {
  return sharedLevelToTierIdx(level, DIFF_TIERS.length);
}
