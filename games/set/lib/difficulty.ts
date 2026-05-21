// difficulty.ts

import { Difficulty } from "./types";

export const SET_DIFF_TIERS: Difficulty[] = [
  {
    name: "Easy",
    symbol: "◈",

    boardCols: 4,
    boardRows: 3,

    ensureSets: 3,

    allowNearMiss: false,
  },

  {
    name: "Normal",
    symbol: "◆",

    boardCols: 5,
    boardRows: 3,

    ensureSets: 3,

    allowNearMiss: true,
  },

  {
    name: "Hard",
    symbol: "⬢",

    boardCols: 4,
    boardRows: 4,

    ensureSets: 4,

    allowNearMiss: true,
  },

  {
    name: "Expert",
    symbol: "✦",

    boardCols: 5,
    boardRows: 4,

    ensureSets: 4,

    allowNearMiss: true,
  },

  {
    name: "Master",
    symbol: "✶",

    boardCols: 7,
    boardRows: 3,

    ensureSets: 5,

    allowNearMiss: true,

    timer: 90,
    hintPenalty: 20,
  },
];
