/**
 * games/kings/lib/constants.ts
 *
 * Visual color arrays for the Kings board.
 * Defined ONCE. Not duplicated in core/const.ts (delete that file).
 */

/** Dark background fills for 12 board regions (cycled). */
export const REG_FILL = [
  "#162016","#161626","#261616","#262016",
  "#162022","#221a10","#1e1426","#141a22",
  "#22141a","#142018","#221414","#181c1c",
] as const;

/** Semi-transparent borders for board regions. */
export const REG_BORDER_COLOR = [
  "rgba(74,158,106,0.5)","rgba(74,122,190,0.5)","rgba(190,74,74,0.5)","rgba(190,160,74,0.5)",
  "rgba(74,160,170,0.5)","rgba(170,140,74,0.5)","rgba(130,74,170,0.5)","rgba(74,110,160,0.5)",
  "rgba(160,74,110,0.5)","rgba(74,160,120,0.5)","rgba(160,100,74,0.5)","rgba(100,110,110,0.5)",
] as const;

/** Darker fills for the solver canvas regions. */
export const REGION_FILL_SOLVER = [
  "#1e2a1e","#1e1e2a","#2a1e1e","#2a241a",
  "#1a2426","#26201a","#22192a","#191f26",
  "#26191e","#1a261e","#261a1a","#1f2020",
] as const;

/** Border colors for the solver canvas regions. */
export const REGION_BORDER_SOLVER = [
  "#4a8f4a","#4a4a8f","#8f4a4a","#8f7a2a",
  "#2a6f7a","#7a5a2a","#5f3a7a","#2a4f6f",
  "#6f2a4a","#2a6f4a","#6f3a2a","#3a4a4a",
] as const;
