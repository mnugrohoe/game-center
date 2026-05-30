"use client";
/**
 * shared/components/ui/DifficultyBadge.tsx
 *
 * Generic tier badge — works with any DiffTier array.
 * Kings passes its DIFF_TIERS; Mambo passes its own.
 * The tier object carries its own colors — no hardcoding here.
 */
import { ClassNameType, DiffTier } from "@/shared/types";
import { cn } from "@/shared/utils/cn";

interface DifficultyBadgeProps {
  tier: DiffTier;
  active?: boolean;
  className?: ClassNameType;
}

export function DifficultyBadge({
  tier,
  active = true,
  className,
}: DifficultyBadgeProps) {
  return (
    <div
      className={cn("py-1.5 px-3.5 font-bold rounded", className)}
      style={{
        border: `1px solid ${active ? tier.bright : "var(--color-gold-600)"}`,
        color: active ? tier.color : "var(--color-text-muted)",
        backgroundColor: active ? `${tier.dim}70` : "transparent",
      }}
    >
      {tier.icon} {tier.name.toUpperCase()}
    </div>
  );
}
