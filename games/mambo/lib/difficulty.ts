/**
 * Mambo difficulty system.
 *
 * Mirrors Kings' approach:
 *   - Named tiers with colors (9 tiers, 0-based index)
 *   - Wave difficulty curve: log base + 3 sine waves + deterministic noise
 *   - Same level → same tier, always
 *   - Non-monotonic: level 6 can be easier than level 5 (wave dip)
 */

// ─── RNG (Mulberry32 — same as Kings) ────────────────────────────────────────
export function mkRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Tier definition ──────────────────────────────────────────────────────────
export interface DiffTier {
  name: string;
  /** Short description shown on the card. */
  sub: string;
  /** Even grid size. */
  gridSize: number;
  /** Fraction of cells pre-filled (higher = easier). */
  initRatio: number;
  /** Fraction of edges that get a constraint (hard-capped at 20%). */
  constraintRatio: number;
  /** Accent hex color. */
  color: string;
}

export const DIFF_TIERS: DiffTier[] = [
  { name: "Dusk",        sub: "4×4 · intro",    gridSize: 4,  initRatio: 0.56, constraintRatio: 0.18, color: "#7dd3fc" },
  { name: "Ember",       sub: "4×4 · warm up",  gridSize: 4,  initRatio: 0.44, constraintRatio: 0.15, color: "#86efac" },
  { name: "Fog",         sub: "6×6 · mild",     gridSize: 6,  initRatio: 0.48, constraintRatio: 0.17, color: "#fde68a" },
  { name: "Tide",        sub: "6×6 · steady",   gridSize: 6,  initRatio: 0.38, constraintRatio: 0.15, color: "#fbbf24" },
  { name: "Storm",       sub: "6×6 · tricky",   gridSize: 6,  initRatio: 0.27, constraintRatio: 0.13, color: "#fb923c" },
  { name: "Abyss",       sub: "8×8 · hard",     gridSize: 8,  initRatio: 0.37, constraintRatio: 0.15, color: "#f87171" },
  { name: "Void",        sub: "8×8 · brutal",   gridSize: 8,  initRatio: 0.26, constraintRatio: 0.12, color: "#e879f9" },
  { name: "Eclipse",     sub: "8×8 · extreme",  gridSize: 8,  initRatio: 0.19, constraintRatio: 0.10, color: "#a78bfa" },
  { name: "Zenith",      sub: "10×10 · master", gridSize: 10, initRatio: 0.19, constraintRatio: 0.09, color: "#ffffff" },
];

// ─── Wave difficulty (ported from Kings shared/algorithms/difficulty.ts) ─────
/**
 * Maps a level (1-based, infinite) to a difficulty score 1–9.
 *
 *   base  = log curve  → overall upward trend
 *   wave  = 3 sines    → non-monotonic oscillation (level 6 can be easier than 5)
 *   noise = seeded RNG → same level always same score
 */
export function levelToDiffScore(level: number): number {
  const base = 1 + (6.5 * Math.log(Math.max(1, level))) / Math.log(1000);
  const wave =
    0.9 * Math.sin(level * 0.31 + 1.1) +
    0.5 * Math.sin(level * 0.07 + 2.3) +
    0.3 * Math.sin(level * 0.013 + 0.7);
  const rng   = mkRng((level * 2654435761) ^ 0xc0ffee);
  const noise = (rng() - 0.5) * 1.2;
  return Math.max(1, Math.min(9, base + wave + noise));
}

/** Converts a raw score (1–9) to a 0-based tier index (0–8). */
export function diffScoreToTierIdx(score: number): number {
  return Math.max(0, Math.min(8, Math.round(score) - 1));
}

/** Direct level → tier index. */
export function levelToTierIdx(level: number): number {
  return diffScoreToTierIdx(levelToDiffScore(level));
}

/** Samples the wave over a window — for rendering the WavePreview chart. */
export function sampleWave(
  centerLevel: number,
  halfWindow = 20,
): { level: number; score: number }[] {
  const result: { level: number; score: number }[] = [];
  for (let i = -halfWindow; i <= halfWindow; i++) {
    const level = Math.max(1, centerLevel + i);
    result.push({ level, score: levelToDiffScore(level) });
  }
  return result;
}
