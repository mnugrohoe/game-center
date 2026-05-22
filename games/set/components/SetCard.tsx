// games/set/components/SetCard.tsx
"use client";

import { SetCard as SetCardType } from "../lib/types";
import SymbolRenderer from "./shape";
import { cn } from "@/shared/utils/cn";

interface SetCardProps {
  card: SetCardType;
  selected?: boolean;
  highlighted?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function SetCard({
  card,
  selected,
  highlighted,
  onClick,
  onRemove,
  size = "md",
  className,
}: SetCardProps) {
  const dims = {
    sm: { card: "w-24 h-16", symbol: "h-7", pad: "p-1.5" },
    md: { card: "w-32 h-20", symbol: "h-8", pad: "p-2.5" },
    lg: { card: "w-36 h-24", symbol: "h-9", pad: "p-3" },
  }[size];

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative rounded-xs border flex  justify-center items-center select-none",
        "transition-all duration-150",
        dims.card,
        dims.pad,
        selected
          ? "border-gold-200 bg-gold-700 shadow-[0_0_0_1px_rgba(201,168,76,0.4)]"
          : highlighted
            ? "border-ok-rim bg-ok-bg"
            : "border-gold-600 bg-surface hover:border-gold-500 hover:bg-raised hover:-translate-y-px",
        className,
      )}
    >
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 hover:opacity-100 w-4 h-4 flex items-center justify-center rounded-xs bg-err-bg border border-err-rim text-err font-mono text-[0.5rem] leading-none transition-all cursor-pointer"
        >
          ✕
        </button>
      )}
      <SymbolRenderer
        symbol={card.symbol}
        color={card.color}
        texture={card.texture}
        count={card.count}
        className={cn("w-full", dims.symbol)}
      />
    </div>
  );
}
