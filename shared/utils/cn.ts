/**
 * shared/utils/cn.ts
 * Tiny className merger — no extra dependency needed.
 * Filters falsy values and joins with space.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
