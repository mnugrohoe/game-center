/**
 * shared/theme/tokens.ts
 *
 * JS mirror of the CSS custom properties in globals.css.
 * Use these when you need dynamic inline styles.
 * For static Tailwind classes, prefer the CSS variables directly.
 *
 * @example
 *   import { tokens } from "@/shared/theme/tokens";
 *   <div style={{ background: tokens.bg.surface }}>
 */

export const tokens = {
  bg: {
    base:     "#09080d",
    surface:  "#110f18",
    elevated: "#1a1726",
    overlay:  "rgba(0,0,0,0.55)",
  },

  gold: {
    bright: "#e8c96a",
    mid:    "#c9a84c",
    dim:    "rgba(201,168,76,0.35)",
    faint:  "rgba(201,168,76,0.08)",
    border: "rgba(201,168,76,0.18)",
  },

  text: {
    primary:   "#e8dcc8",
    secondary: "#a08860",
    muted:     "#5a4820",
    ghost:     "rgba(212,196,154,0.3)",
  },

  status: {
    ok:      "#7ed4a0",
    okBg:    "rgba(70,180,100,0.08)",
    okDim:   "rgba(70,180,100,0.4)",
    err:     "#ee8888",
    errBg:   "rgba(200,70,70,0.08)",
    errDim:  "rgba(200,70,70,0.4)",
    info:    "#8ab4ee",
    infoBg:  "rgba(80,80,200,0.12)",
  },

  font: {
    display: "'Cinzel Decorative', serif",
    ui:      "'Cinzel', serif",
    mono:    "'Space Mono', monospace",
  },

  radius: {
    sm:   "2px",
    md:   "6px",
    lg:   "12px",
    pill: "999px",
  },
} as const;

/** Per-game accent palettes */
export const gameThemes = {
  kings: {
    accent:    "#c9a84c",
    accentBg:  "rgba(201,168,76,0.09)",
    accentDim: "rgba(201,168,76,0.25)",
    className: "game-kings",
  },
  mambo: {
    accent:    "#a78bfa",
    accentBg:  "rgba(167,139,250,0.09)",
    accentDim: "rgba(167,139,250,0.25)",
    className: "game-mambo",
  },
} as const;

export type GameThemeKey = keyof typeof gameThemes;
