"use client";
/**
 * shared/components/ui/WinBanner.tsx
 *
 * Celebratory banner shown when a puzzle is solved.
 * Accepts optional sub-text (time, size, score).
 */
import { ReactNode } from "react";

interface WinBannerProps {
  /** Sub-text line — e.g. "Solved in 1:32 · 7×7 · Knight" */
  detail?: ReactNode;
  /** Extra action buttons (Next, Menu, etc.) */
  actions?: ReactNode;
}

export function WinBanner({ detail, actions }: WinBannerProps) {
  return (
    <div className="text-center px-5 py-3 rounded-xs border border-gold-500 bg-gold-700 animate-[gc-fadein_0.3s_ease]">
      <p className="font-display text-sm text-gold-100 tracking-widest">
        ⚜ PUZZLE CONQUERED ⚜
      </p>
      {detail && (
        <p className="font-mono text-[0.72rem] text-gold-400 mt-1">
          {detail}
        </p>
      )}
      {actions && (
        <div className="flex items-center justify-center gap-2 mt-3">
          {actions}
        </div>
      )}
    </div>
  );
}
