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

function hslToLuminance(h: number, s: number, l: number) {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0,
    g = 0,
    b = 0;

  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  r += m;
  g += m;
  b += m;

  const linear = (v: number) =>
    v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);

  const R = linear(r);
  const G = linear(g);
  const B = linear(b);

  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/** Palette used for colouring game regions / pieces */
export const colorId = (id: string | number) => {
  if (id === -1 || id === "-1") {
    return {
      bg: "0 0% 0% / 0", // 0% opacity ensures transparency
      text: "0 0% 0% / 0",
    };
  }

  const i = hashString(id);
  const hue = (i * 137.508) % 360;
  const saturation = [65, 75, 85][Math.floor(i / 360) % 3];
  const lightness = [50, 60, 70][Math.floor(i / 120) % 3];
  // Berubah setiap 3 indeks (Sangat pekat -> Sedang -> Agak pudar)
  // const saturation = [85, 70, 95][i % 3];

  // Berubah setiap 2 indeks (Kontras Gelap -> Terang -> Gelap -> Terang)
  // Ini sangat krusial agar indeks yang berurutan punya kontras visual yang tajam
  // const lightness = [45, 65][i % 2];
  const luminance = hslToLuminance(hue, saturation, lightness);
  return {
    bg: `${hue} ${saturation}% ${lightness}%`,
    text: luminance > 0.179 ? "0 0% 0%" : "0 0% 100%",
  };
};

/**
 * Deterministic hash of a string or number, used to derive a stable
 * color index from a rectangle's id.
 */
function hashString(id: string | number): number {
  if (typeof id === "number") return id;
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Format milliseconds as M:SS.mmm */
export function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}
