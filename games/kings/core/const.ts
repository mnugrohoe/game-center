import { StatusType, StatusConfig, Tier } from "./types";

export const LEVEL_THRESHOLDS: number[] = [0, 10, 30, 70, 150, 300];

export const EXAMPLE_GRID: number[][] = [
  [0, 0, 0, 1, 1, 1, 1],
  [0, 0, 2, 2, 1, 1, 1],
  [0, 2, 2, 3, 3, 1, 4],
  [5, 2, 3, 3, 4, 4, 4],
  [5, 5, 3, 6, 4, 4, 4],
  [5, 5, 6, 6, 6, 4, 4],
  [5, 5, 6, 6, 6, 6, 6],
];

export const STATUS_STYLE: Record<StatusType, StatusConfig> = {
  edit: {
    bg: "rgba(212,152,15,0.08)",
    border: "rgba(212,152,15,0.3)",
    color: "#c8a840",
  },
  ok: {
    bg: "rgba(40,120,60,0.15)",
    border: "rgba(40,180,80,0.4)",
    color: "#6fcf97",
  },
  err: {
    bg: "rgba(180,50,50,0.15)",
    border: "rgba(220,80,80,0.4)",
    color: "#e07070",
  },
  solve: {
    bg: "rgba(80,80,200,0.15)",
    border: "rgba(120,120,255,0.4)",
    color: "#9090ff",
  },
};

// ─── Colors ──────────────────────────────────────────────────────────────────

export const REG_FILL = [
  "#162016",
  "#161626",
  "#261616",
  "#262016",
  "#162022",
  "#221a10",
  "#1e1426",
  "#141a22",
  "#22141a",
  "#142018",
  "#221414",
  "#181c1c",
];

export const REG_BORDER_COLOR = [
  "rgba(74,158,106,0.5)",
  "rgba(74,122,190,0.5)",
  "rgba(190,74,74,0.5)",
  "rgba(190,160,74,0.5)",
  "rgba(74,160,170,0.5)",
  "rgba(170,140,74,0.5)",
  "rgba(130,74,170,0.5)",
  "rgba(74,110,160,0.5)",
  "rgba(160,74,110,0.5)",
  "rgba(74,160,120,0.5)",
  "rgba(160,100,74,0.5)",
  "rgba(100,110,110,0.5)",
];

export const REGION_FILL_SOLVER = [
  "#1e2a1e",
  "#1e1e2a",
  "#2a1e1e",
  "#2a241a",
  "#1a2426",
  "#26201a",
  "#22192a",
  "#191f26",
  "#26191e",
  "#1a261e",
  "#261a1a",
  "#1f2020",
];

export const REGION_BORDER_SOLVER = [
  "#4a8f4a",
  "#4a4a8f",
  "#8f4a4a",
  "#8f7a2a",
  "#2a6f7a",
  "#7a5a2a",
  "#5f3a7a",
  "#2a4f6f",
  "#6f2a4a",
  "#2a6f4a",
  "#6f3a2a",
  "#3a4a4a",
];

// ─── Difficulty Tiers ─────────────────────────────────────────────────────────

export const DIFF_TIERS: Tier[] = [
  {
    name: "Initiate",
    icon: "✦",
    diffScore: 1,
    minGrid: 4,
    maxGrid: 5,
    color: "#4a9e6a",
    dim: "#2a5e3a",
    bright: "#7ed4a0",
  },
  {
    name: "Squire",
    icon: "⚔",
    diffScore: 2,
    minGrid: 5,
    maxGrid: 6,
    color: "#5a9e7a",
    dim: "#3a6e4a",
    bright: "#8adaaa",
  },
  {
    name: "Knight",
    icon: "🛡",
    diffScore: 3,
    minGrid: 6,
    maxGrid: 7,
    color: "#4a7abe",
    dim: "#2a4a7e",
    bright: "#8ab4ee",
  },
  {
    name: "Baron",
    icon: "⚜",
    diffScore: 4,
    minGrid: 7,
    maxGrid: 8,
    color: "#7a9a2a",
    dim: "#4a6a10",
    bright: "#b4d45a",
  },
  {
    name: "Lord",
    icon: "👑",
    diffScore: 5,
    minGrid: 7,
    maxGrid: 9,
    color: "#a07a2a",
    dim: "#6a4a10",
    bright: "#d4aa5a",
  },
  {
    name: "King",
    icon: "♚",
    diffScore: 6,
    minGrid: 8,
    maxGrid: 10,
    color: "#9e4a9e",
    dim: "#5e2a6e",
    bright: "#cc80cc",
  },
  {
    name: "Warlord",
    icon: "⚡",
    diffScore: 7,
    minGrid: 9,
    maxGrid: 11,
    color: "#be4a4a",
    dim: "#7e1a1a",
    bright: "#ee8888",
  },
  {
    name: "Champion",
    icon: "🔱",
    diffScore: 8,
    minGrid: 10,
    maxGrid: 12,
    color: "#cc6622",
    dim: "#8a3008",
    bright: "#ff9966",
  },
  {
    name: "Demon",
    icon: "☠",
    diffScore: 9,
    minGrid: 11,
    maxGrid: 13,
    color: "#cc2222",
    dim: "#8a0808",
    bright: "#ff6666",
  },
];
