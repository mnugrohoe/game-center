import type { DiffTier } from "@/shared/types";
import { lerp, clamp } from "@/shared/algorithms/difficulty";
import { mkRng } from "@/shared/algorithms";
import { createParamsProvider } from "@/shared/utils/generator";

export interface ArukoneDiffTier extends DiffTier {
  minSize: number;
  maxSize: number;

  minWalls: number;
  maxWalls: number;
}

export interface ArukoneParams {
  rows: number;
  cols: number;

  /**
   * Total numbered clues.
   * Includes clue #1 and clue #N.
   */
  clueCount: number;

  /**
   * Number of walls selected from
   * non-solution edges.
   */
  wallCount: number;

  /**
   * Strategy used when distributing
   * clues along the Hamiltonian path.
   */
  clueDistribution: "uniform" | "balanced" | "random";

  timer?: number;

  hintPenalty: number;

  tier: ArukoneDiffTier;
  seed: number;
}

export const ARUKONE_TIERS: ArukoneDiffTier[] = [
  {
    name: "Beginner",
    icon: "⬡",
    diffScore: 1,
    minSize: 4,
    maxSize: 5,
    minWalls: 0,
    maxWalls: 2,

    color: "#4FC3F7",
    dim: "#29B6F6",
    bright: "#B3E5FC",
  },

  {
    name: "Easy",
    icon: "⬢",
    diffScore: 2,
    minSize: 5,
    maxSize: 6,
    minWalls: 1,
    maxWalls: 4,

    color: "#66BB6A",
    dim: "#4CAF50",
    bright: "#C8E6C9",
  },

  {
    name: "Skilled",
    icon: "⧇",
    diffScore: 3,
    minSize: 6,
    maxSize: 7,
    minWalls: 3,
    maxWalls: 8,

    color: "#26C6DA",
    dim: "#00BCD4",
    bright: "#B2EBF2",
  },

  {
    name: "Advanced",
    icon: "⧈",
    diffScore: 4,
    minSize: 7,
    maxSize: 8,
    minWalls: 6,
    maxWalls: 12,

    color: "#D4E157",
    dim: "#C0CA33",
    bright: "#F0F4C3",
  },

  {
    name: "Expert",
    icon: "⛶",
    diffScore: 5,
    minSize: 8,
    maxSize: 9,
    minWalls: 10,
    maxWalls: 18,

    color: "#FFCA28",
    dim: "#FFB300",
    bright: "#FFECB3",
  },

  {
    name: "Master",
    icon: "⁕",
    diffScore: 6,
    minSize: 9,
    maxSize: 10,
    minWalls: 15,
    maxWalls: 24,

    color: "#BA68C8",
    dim: "#AB47BC",
    bright: "#E1BEE7",
  },

  {
    name: "Grandmaster",
    icon: "❖",
    diffScore: 7,
    minSize: 10,
    maxSize: 11,
    minWalls: 20,
    maxWalls: 30,

    color: "#FF8A65",
    dim: "#FF7043",
    bright: "#FFCCBC",
  },

  {
    name: "Legend",
    icon: "✦",
    diffScore: 8,
    minSize: 11,
    maxSize: 12,
    minWalls: 25,
    maxWalls: 40,

    color: "#EF5350",
    dim: "#E53935",
    bright: "#FFCDD2",
  },

  {
    name: "Nightmare",
    icon: "☠",
    diffScore: 9,
    minSize: 12,
    maxSize: 14,
    minWalls: 30,
    maxWalls: 60,

    color: "#EC407A",
    dim: "#D81B60",
    bright: "#F8BBD0",
  },
];

export function generateArukoneParams(
  diffScore: number,
  seed: number,
): ArukoneParams {
  const rng = mkRng(seed);
  const MIN_CLUE_RATIO = 0.22;
  const MAX_CLUE_RATIO = 0.3;
  const idx = clamp(Math.round(diffScore) - 1, 0, ARUKONE_TIERS.length - 1);

  const tier = ARUKONE_TIERS[idx];

  const rows =
    tier.minSize + Math.floor(rng() * (tier.maxSize - tier.minSize + 1));

  const cols =
    tier.minSize + Math.floor(rng() * (tier.maxSize - tier.minSize + 1));

  const area = rows * cols;

  const progress = idx / (ARUKONE_TIERS.length - 1);

  // ─────────────────────────────────────
  // Clues
  // ─────────────────────────────────────

  const clueRatio = MIN_CLUE_RATIO + rng() * (MAX_CLUE_RATIO - MIN_CLUE_RATIO);

  const clueCount = clamp(
    Math.round(area * clueRatio),
    2,
    Math.max(2, area - 1),
  );

  // ─────────────────────────────────────
  // Walls
  // ─────────────────────────────────────

  const maxPossibleEdges = rows * (cols - 1) + cols * (rows - 1);

  const wallCount = clamp(
    tier.minWalls + Math.floor(rng() * (tier.maxWalls - tier.minWalls + 1)),
    0,
    Math.floor(maxPossibleEdges * 0.35),
  );

  // ─────────────────────────────────────
  // Distribution
  // ─────────────────────────────────────

  const clueDistribution: "uniform" | "balanced" | "random" =
    progress < 0.3 ? "uniform" : progress < 0.7 ? "balanced" : "random";

  // ─────────────────────────────────────
  // Optional timer
  // ─────────────────────────────────────

  let timer: number | undefined;

  if (idx >= 4) {
    timer = Math.round(lerp(300, 90, (idx - 4) / (ARUKONE_TIERS.length - 5)));
  }

  const hintPenalty = Math.round(lerp(5, 50, progress));

  return {
    rows,
    cols,

    clueCount,
    wallCount,

    clueDistribution,

    timer,
    hintPenalty,

    tier,
    seed,
  };
}

export const arukoneParamsGenerator = createParamsProvider(
  ARUKONE_TIERS,
  generateArukoneParams,
);
