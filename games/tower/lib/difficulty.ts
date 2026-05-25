// difficulty.ts

export interface TowerDiffTier {
  name: string;
  icon: string;

  /**
   * Total slot count
   * Example:
   * size = 5 -> [1,2,3,1,2]
   */
  size: number;

  /**
   * How many unique colors can appear.
   * Max = 5
   */
  uniqueColors: number;

  /**
   * Maximum SAME color count allowed.
   *
   * Example:
   * maxSameColor = 2
   * means:
   * [1,1] allowed
   * [1,1,1] forbidden
   */
  maxSameColor: number;

  /**
   * Additional shuffle randomness.
   * Higher = more chaotic distribution.
   */
  variance: number;

  diffScore: number;

  color: string;
  dim: string;
  bright: string;
}

export const TOWER_DIFF_TIERS: TowerDiffTier[] = [
  {
    name: "Pebble Tower",
    icon: "🪨",

    size: 3,
    uniqueColors: 3,
    maxSameColor: 1,
    variance: 1,

    diffScore: 1,

    color: "#5c8d89",
    dim: "#34524f",
    bright: "#8fd6cf",
  },

  {
    name: "Wood Tower",
    icon: "🪵",

    size: 3,
    uniqueColors: 3,
    maxSameColor: 2,
    variance: 2,

    diffScore: 2,

    color: "#8d6e63",
    dim: "#5d4037",
    bright: "#bcaaa4",
  },

  {
    name: "Stone Tower",
    icon: "🧱",

    size: 3,
    uniqueColors: 4,
    maxSameColor: 2,
    variance: 3,

    diffScore: 3,

    color: "#607d8b",
    dim: "#37474f",
    bright: "#90a4ae",
  },

  {
    name: "Iron Tower",
    icon: "⚙",

    size: 4,
    uniqueColors: 4,
    maxSameColor: 3,
    variance: 4,

    diffScore: 4,

    color: "#78909c",
    dim: "#455a64",
    bright: "#b0bec5",
  },

  {
    name: "Crystal Tower",
    icon: "💎",

    size: 4,
    uniqueColors: 5,
    maxSameColor: 3,
    variance: 5,

    diffScore: 5,

    color: "#7e57c2",
    dim: "#4527a0",
    bright: "#b39ddb",
  },

  {
    name: "Arcane Tower",
    icon: "🔮",

    size: 4,
    uniqueColors: 5,
    maxSameColor: 4,
    variance: 6,

    diffScore: 6,

    color: "#ab47bc",
    dim: "#6a1b9a",
    bright: "#ce93d8",
  },

  {
    name: "Void Tower",
    icon: "🌑",

    size: 5,
    uniqueColors: 5,
    maxSameColor: 5,
    variance: 7,

    diffScore: 7,

    color: "#5c6bc0",
    dim: "#283593",
    bright: "#9fa8da",
  },

  {
    name: "Inferno Tower",
    icon: "🔥",

    size: 5,
    uniqueColors: 5,
    maxSameColor: 999,
    variance: 8,

    diffScore: 8,

    color: "#e64a19",
    dim: "#bf360c",
    bright: "#ffab91",
  },

  {
    name: "Titan Tower",
    icon: "👑",

    size: 5,
    uniqueColors: 5,
    maxSameColor: 999,
    variance: 9,

    diffScore: 9,

    color: "#c62828",
    dim: "#7f0000",
    bright: "#ef9a9a",
  },
] as const;

/**
 * High-contrast tower color palette.
 *
 * Notes:
 * - Optimized for visual separation.
 * - Avoids overly similar neighboring hues.
 * - Keeps saturation/value high for readability.
 * - Limited to 10 colors for cleaner difficulty scaling.
 */
export const COLOR_POOL: string[] = [
  "#ff3b30", // vivid red
  "#ff9500", // orange
  "#ffcc00", // yellow
  "#34c759", // green
  "#00c7be", // teal
  "#007aff", // blue
  "#5856d6", // indigo
  "#af52de", // purple
  "#ff2d55", // pink
  "#8e8e93", // gray
] as const;
