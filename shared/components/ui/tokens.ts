import { ColorType } from "@/shared/types";
interface TType {
  bg: ColorType;
  bg2: ColorType;
  bg3: ColorType;
  bg4: ColorType;
  border: ColorType;
  border2: ColorType;
  text: ColorType;
  text2: ColorType;
  text3: ColorType;
  accent: ColorType;
  accent2: ColorType;
  green: ColorType;
  red: ColorType;
  amber: ColorType;
  cyan: ColorType;
  radius: number;
  radius2: number;
  font: string;
}

/**
 * shared/ui/tokens.js
 *
 * Single source of truth for all design tokens.
 * Import this in every component — never hardcode colours or spacing.
 */
export const T: TType = {
  // ── Surfaces ──────────────────────────────────────────────────────────────
  bg: "#0d0d14",
  bg2: "#13131f",
  bg3: "#1a1a2e",
  bg4: "#1f1f35",

  // ── Borders ───────────────────────────────────────────────────────────────
  border: "rgba(255,255,255,0.09)",
  border2: "rgba(255,255,255,0.16)",

  // ── Text ──────────────────────────────────────────────────────────────────
  text: "#e8e8f0",
  text2: "#9090b0",
  text3: "#505070",

  // ── Accent ────────────────────────────────────────────────────────────────
  accent: "#6c63ff",
  accent2: "#9d97ff",

  // ── Semantic ──────────────────────────────────────────────────────────────
  green: "#22c55e",
  red: "#ef4444",
  amber: "#f59e0b",
  cyan: "#06b6d4",

  // ── Shape ─────────────────────────────────────────────────────────────────
  radius: 8,
  radius2: 12,

  // ── Typography ────────────────────────────────────────────────────────────
  font: "var(--font-jetbrains-mono), var(--font-geist-mono), monospace",
};

/** Palette used for colouring game regions / pieces */
export const colorFromIndex = (i: number) => {
  const hue = (i * 137.508) % 360;
  const saturation = [65, 75, 85][Math.floor(i / 360) % 3];
  const lightness = [50, 60, 70][Math.floor(i / 120) % 3];

  return {
    bg: `${hue} ${saturation}% ${lightness}%`,
    text: lightness - saturation * 0.15 > 55 ? "0 0% 0%" : "0 0% 100%",
  };
};

/** Format milliseconds as M:SS */
export function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}
