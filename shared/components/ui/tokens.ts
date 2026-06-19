import { lerp } from "@/shared/algorithms";
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

export const getInterpolatedHexColor = (
  pct: number,
  startHex: string,
  endHex: string,
) => {
  const c1 = hexToRgb(startHex);
  const c2 = hexToRgb(endHex);

  const r = Math.round(lerp(c1.r, c2.r, pct));
  const g = Math.round(lerp(c1.g, c2.g, pct));
  const b = Math.round(lerp(c1.b, c2.b, pct));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

const getHslLuminance = (h: number, s: number, l: number) => {
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
};

const convertHslToHex = (h: number, s: number, l: number): string => {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

/**
 * Mengonversi hex color string (seperti "#FF5733" atau "#F53") ke objek RGB.
 */
const hexToRgb = (hex: string) => {
  // Menghapus tanda '#' jika ada
  hex = hex.replace(/^#/, "");

  // Mengubah hex 3-digit (misal: "F00") menjadi 6-digit ("FF0000")
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }

  const bigint = parseInt(hex, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
};

/** Palette used for colouring game regions / pieces */
export const colorId = (id: string | number) => {
  if (id === -1 || id === "-1") {
    return {
      bg: "0 0% 0% / 0", // 0% opacity ensures transparency
      text: "0 0% 0% / 0",
      hex: "#000",
    };
  }

  const i = getHashFromString(id);
  const hue = (i * 137.508) % 360;
  const saturation = [65, 75, 85][Math.floor(i / 360) % 3];
  const lightness = [50, 60, 70][Math.floor(i / 120) % 3];
  // Berubah setiap 3 indeks (Sangat pekat -> Sedang -> Agak pudar)
  // const saturation = [85, 70, 95][i % 3];

  // Berubah setiap 2 indeks (Kontras Gelap -> Terang -> Gelap -> Terang)
  // Ini sangat krusial agar indeks yang berurutan punya kontras visual yang tajam
  // const lightness = [45, 65][i % 2];
  const luminance = getHslLuminance(hue, saturation, lightness);
  return {
    bg: `${hue} ${saturation}% ${lightness}%`,
    text: luminance > 0.179 ? "0 0% 0%" : "0 0% 100%",
    hex: convertHslToHex(hue, saturation, lightness),
  };
};

/**
 * Deterministic hash of a string or number, used to derive a stable
 * color index from a rectangle's id.
 */
function getHashFromString(id: string | number): number {
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
