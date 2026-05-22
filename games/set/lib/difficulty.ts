// difficulty.ts

import { Difficulty } from "./types";

export const SET_DIFF_TIERS: Difficulty[] = [
  {
    /*
    ───────────────────────────────────────
    EASY
    - isolated sets
    - low overlap
    - almost no traps
    ───────────────────────────────────────
    */

    name: "Easy",
    symbol: "◈",

    boardCols: 4,
    boardRows: 3,

    /**
     * Exact target set count
     */
    targetSets: 3,

    /**
     * Shared-card density
     *
     * 0 = isolated sets
     * 1 = mild overlap
     * 2+ = dense overlap graph
     */
    overlapFactor: 0.3,

    /**
     * Allow accidental extra sets
     */
    maxExtraSets: 1,

    /**
     * Fake almost-sets
     */
    nearMissTarget: 1,

    /**
     * Visual chaos
     */
    entropy: 0.2,

    /**
     * How confusing board feels
     */
    visualNoise: 0.2,

    timer: undefined,
    hintPenalty: 0,
  },

  {
    /*
    ───────────────────────────────────────
    NORMAL
    - some overlap
    - some fake sets
    ───────────────────────────────────────
    */

    name: "Normal",
    symbol: "◆",

    boardCols: 5,
    boardRows: 3,

    targetSets: 4,

    overlapFactor: 1.0,

    maxExtraSets: 2,

    nearMissTarget: 4,

    entropy: 0.45,

    visualNoise: 0.5,

    timer: undefined,
    hintPenalty: 5,
  },

  {
    /*
    ───────────────────────────────────────
    HARD
    - dense overlap
    - branching sets
    - deceptive visuals
    ───────────────────────────────────────
    */

    name: "Hard",
    symbol: "⬢",

    boardCols: 4,
    boardRows: 4,

    targetSets: 5,

    overlapFactor: 1.8,

    maxExtraSets: 2,

    nearMissTarget: 7,

    entropy: 0.7,

    visualNoise: 0.75,

    timer: undefined,
    hintPenalty: 10,
  },

  {
    /*
    ───────────────────────────────────────
    EXPERT
    - high overlap graph
    - many near misses
    - hidden solutions
    ───────────────────────────────────────
    */

    name: "Expert",
    symbol: "✦",

    boardCols: 5,
    boardRows: 4,

    targetSets: 6,

    overlapFactor: 2.6,

    maxExtraSets: 3,

    nearMissTarget: 12,

    entropy: 0.9,

    visualNoise: 0.9,

    timer: 120,
    hintPenalty: 15,
  },

  {
    /*
    ───────────────────────────────────────
    MASTER
    - extreme overlap
    - many hidden chains
    - visually exhausting
    ───────────────────────────────────────
    */

    name: "Master",
    symbol: "✶",

    boardCols: 6,
    boardRows: 4,

    targetSets: 7,

    overlapFactor: 3.5,

    maxExtraSets: 4,

    nearMissTarget: 18,

    entropy: 1.0,

    visualNoise: 1.0,

    timer: 90,
    hintPenalty: 25,
  },
];
