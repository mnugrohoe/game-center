"use client";
/**
 * shared/components/ui/StatusChip.tsx
 *
 * Small badge used everywhere: king count, conflict state, timer, metrics.
 * Pass variant="gold" | "ok" | "err" | "ghost".
 */
import { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

type Variant = "gold" | "ok" | "err" | "ghost";

interface StatusChipProps {
  children:  ReactNode;
  variant?:  Variant;
  title?:    string;
  className?: string;
}

const variantClass: Record<Variant, string> = {
  gold:  "chip chip-gold",
  ok:    "chip chip-ok",
  err:   "chip chip-err",
  ghost: "chip chip-ghost",
};

export function StatusChip({
  children,
  variant = "ghost",
  title,
  className,
}: StatusChipProps) {
  return (
    <span
      className={cn(variantClass[variant], className)}
      title={title}
    >
      {children}
    </span>
  );
}
