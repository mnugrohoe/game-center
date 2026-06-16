"use client";

import { FaQuestion, FaX } from "react-icons/fa6";
import type { CardType } from "../lib/types";
import SymbolRenderer from "./Shape";
import { cn } from "@/shared/utils/cn";
import { T } from "@/shared/components/ui/tokens";

// =============================================================================
// INTERFACES & HELPERS
// =============================================================================

interface SetCardProps {
  card: CardType;
  selected?: boolean;
  highlighted?: boolean;
  onClick?: (card: CardType) => void;
  onRemove?: (card: CardType) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

interface SetTripletCardsProps {
  cards?: CardType[];
  className?: string;
  size?: "sm" | "md" | "lg";
  highlighted?: boolean;
}

/**
 * Menyortir susunan kartu berdasarkan hierarki atribut untuk konsistensi visual
 */
const sortSetCards = (set: CardType[]) =>
  [...set].sort(
    (a, b) =>
      a.count - b.count ||
      a.color.localeCompare(b.color, "en-US", { sensitivity: "base" }) ||
      a.texture.localeCompare(b.texture, "en-US", { sensitivity: "base" }) ||
      a.symbol.localeCompare(b.symbol, "en-US", { sensitivity: "base" }),
  );

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Komponen Utama: Menampilkan satu kartu permainan SET utuh
 */
export function SetCard({
  card,
  selected,
  highlighted,
  onClick,
  onRemove,
  size = "md",
  className,
}: SetCardProps) {
  const dimensions = {
    sm: { card: "w-24 h-16", symbol: "h-7", pad: "p-1.5" },
    md: { card: "w-32 h-20", symbol: "h-8", pad: "p-2.5" },
    lg: { card: "w-36 h-24", symbol: "h-9", pad: "p-3" },
  }[size];

  return (
    <div
      onClick={onClick ? () => onClick(card) : undefined}
      className={cn(
        "relative rounded-xs border flex justify-center items-center select-none group",
        "transition-all duration-150 cursor-pointer",
        dimensions.card,
        dimensions.pad,
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
            onRemove(card);
          }}
          className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 hover:opacity-100 w-4 h-4 flex items-center justify-center rounded-xs bg-err-bg border border-err-rim text-err font-mono text-[0.5rem] leading-none transition-all cursor-pointer z-10"
        >
          <FaX />
        </button>
      )}
      <SymbolRenderer
        symbol={card.symbol}
        color={card.color}
        texture={card.texture}
        count={card.count}
        className={cn("w-full", dimensions.symbol)}
      />
    </div>
  );
}
export function SetTripletCards({
  cards,
  className,
  highlighted = false,
  size = "md",
}: SetTripletCardsProps) {
  const dimensions = {
    sm: { card: "w-20 h-28 min-w-20 min-h-28", pad: "p-1.5", baseSize: 4 },
    md: { card: "w-24 h-32 min-w-24 min-h-32", pad: "p-2.5", baseSize: 5 },
    lg: { card: "w-28 h-36 min-w-28 min-h-36", pad: "p-3", baseSize: 6 },
  }[size];

  return (
    <div
      className={cn(
        "flex flex-col justify-between items-stretch border border-gold-600 bg-surface",
        dimensions.card,
        dimensions.pad,
        highlighted && "border-pink-700 bg-zinc-800",
        className,
      )}
      style={{
        color: T.text3,
      }}
    >
      {cards && cards.length > 0 ? (
        sortSetCards(cards).map((c) => (
          <div
            key={c.id}
            className="flex-1 w-full flex justify-center items-center min-h-0 overflow-hidden"
          >
            <SymbolRenderer
              symbol={c.symbol}
              color={c.color}
              texture={c.texture}
              count={c.count}
              size={dimensions.baseSize * 3.75}
            />
          </div>
        ))
      ) : (
        <div className="flex flex-1 items-center justify-center text-muted/40">
          <FaQuestion size={dimensions.baseSize * 12} />
        </div>
      )}
    </div>
  );
}
