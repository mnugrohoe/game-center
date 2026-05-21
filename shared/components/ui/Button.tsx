"use client";
/**
 * shared/components/ui/Button.tsx
 *
 * Three button variants consumed by every game.
 * All classes come from the Tailwind aliases in globals.css —
 * zero hardcoded hex in here.
 */

import { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

type BaseProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

/** Secondary game actions — Undo, Reset, Clear marks … */
export function ControlButton({ children, className, ...props }: BaseProps) {
  return (
    <button className={cn("btn-control", className)} {...props}>
      {children}
    </button>
  );
}

/** Primary CTA — Generate, Solve, Play … */
export function ActionButton({ children, className, ...props }: BaseProps) {
  return (
    <button className={cn("btn-action", className)} {...props}>
      {children}
    </button>
  );
}

/** Text-level action — Back, Menu, Peek … */
export function GhostButton({ children, className, ...props }: BaseProps) {
  return (
    <button className={cn("btn-ghost", className)} {...props}>
      {children}
    </button>
  );
}

/** Inline spinner — drop inside ActionButton while async */
export function LoadingSpinner({ size = 16 }: { size?: number }) {
  return (
    <span
      className="rounded-full border-2 border-gold-600 border-t-gold-200 inline-block shrink-0"
      style={{ width: size, height: size, animation: "spin 0.7s linear infinite" }}
    />
  );
}
