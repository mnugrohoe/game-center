"use client";
/**
 * shared/components/ui/DifficultyBadge.tsx
 *
 * Generic tier badge — works with any DiffTier array.
 * Kings passes its DIFF_TIERS; Mambo passes its own.
 * The tier object carries its own colors — no hardcoding here.
 */
import { DiffTier } from "@/shared/types";
import { cn } from "@/shared/utils/cn";

interface DifficultyBadgeProps {
  tier: DiffTier;
  active?: boolean;
  className?: string;
}

export function DifficultyBadge({
  tier,
  active = true,
  className,
}: DifficultyBadgeProps) {
  return (
    <div
      className={cn("chip font-ui text-[0.62rem] py-1.5 px-3.5", className)}
      style={{
        border: `1px solid ${active ? tier.dim : "var(--color-gold-600)"}`,
        color: active ? tier.bright : "var(--color-text-muted)",
        background: active ? `${tier.color}18` : "transparent",
      }}
    >
      {tier.icon} {tier.name.toUpperCase()}
    </div>
  );
}
