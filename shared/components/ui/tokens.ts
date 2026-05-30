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
  font: "'JetBrains Mono','Fira Code','Consolas',monospace",
};

/** Palette used for colouring game regions / pieces */
export const PALETTE = [
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#ec4899",
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#d946ef",
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#0ea5e9",
  "#c084fc",
  "#22d3ee",
  "#4ade80",
  "#fb923c",
  "#34d399",
  "#60a5fa",
  "#a3e635",
];

/** Labelset for indexing game pieces */
export const LABEL_CHARS =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz@#$%&*+=";

/** Map a label character → palette colour */
export function labelColor(label: string) {
  const i = LABEL_CHARS.indexOf(label);
  return PALETTE[(i < 0 ? label.charCodeAt(0) : i) % PALETTE.length];
}

/** Format milliseconds as M:SS */
export function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}
