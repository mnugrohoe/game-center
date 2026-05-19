/**
 * @module formatting
 * Generic display formatting utilities — game-agnostic.
 *
 * Usage:
 *   import { formatTime, formatScore, formatLargeNumber } from "@/shared/algorithms/formatting";
 */

/**
 * Formats elapsed seconds as M:SS.
 * @example formatTime(90) → "1:30"
 */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Formats elapsed seconds as HH:MM:SS (for long sessions).
 * @example formatTimeLong(3661) → "1:01:01"
 */
export function formatTimeLong(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Formats a floating-point difficulty score for display.
 * @example formatScore(7.38) → "7.4"
 */
export function formatScore(score: number, decimals = 1): string {
  return score.toFixed(decimals);
}

/**
 * Formats large numbers with compact suffixes.
 * @example formatLargeNumber(12500) → "12.5K"
 */
export function formatLargeNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/**
 * Formats a 0–1 ratio as a percentage string.
 * @example formatPercent(0.756) → "75.6%"
 */
export function formatPercent(ratio: number, decimals = 1): string {
  return `${(ratio * 100).toFixed(decimals)}%`;
}
