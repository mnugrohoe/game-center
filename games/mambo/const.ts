// ─── Named difficulty tiers ───────────────────────────────────────────────────
// Same 9-level curve, but named for flavor
export const DIFFICULTIES = [
  {
    id: 0,
    name: "Dusk",
    sub: "4×4 · intro",
    gridSize: 4,
    initRatio: 0.56,
    constraintRatio: 0.18,
  },
  {
    id: 1,
    name: "Ember",
    sub: "4×4 · warm up",
    gridSize: 4,
    initRatio: 0.44,
    constraintRatio: 0.15,
  },
  {
    id: 2,
    name: "Fog",
    sub: "6×6 · mild",
    gridSize: 6,
    initRatio: 0.48,
    constraintRatio: 0.17,
  },
  {
    id: 3,
    name: "Tide",
    sub: "6×6 · steady",
    gridSize: 6,
    initRatio: 0.38,
    constraintRatio: 0.15,
  },
  {
    id: 4,
    name: "Storm",
    sub: "6×6 · tricky",
    gridSize: 6,
    initRatio: 0.27,
    constraintRatio: 0.13,
  },
  {
    id: 5,
    name: "Abyss",
    sub: "8×8 · hard",
    gridSize: 8,
    initRatio: 0.37,
    constraintRatio: 0.15,
  },
  {
    id: 6,
    name: "Void",
    sub: "8×8 · brutal",
    gridSize: 8,
    initRatio: 0.26,
    constraintRatio: 0.12,
  },
  {
    id: 7,
    name: "Eclipse",
    sub: "8×8 · extreme",
    gridSize: 8,
    initRatio: 0.19,
    constraintRatio: 0.1,
  },
  {
    id: 8,
    name: "Zenith",
    sub: "10×10 · master",
    gridSize: 10,
    initRatio: 0.19,
    constraintRatio: 0.09,
  },
];

// Accent color per tier (low → high)
export const TIER_COLORS = [
  "#7dd3fc", // Dusk   – sky blue
  "#86efac", // Ember  – mint
  "#fde68a", // Fog    – pale yellow
  "#fbbf24", // Tide   – amber
  "#fb923c", // Storm  – orange
  "#f87171", // Abyss  – red
  "#e879f9", // Void   – fuchsia
  "#a78bfa", // Eclipse– violet
  "#fff", // Zenith – white
];
