// games/set/components/SetSolver.tsx
"use client";

import { useMemo, useState } from "react";
import { GameTitle } from "@/shared/components";
import { StatusChip } from "@/shared/components";
import SymbolRenderer from "./shape";
import { COLORS, SYMBOLS, TEXTURES } from "../lib/constants";
import { SetCard, SetColor, SetSymbol, SetTexture } from "../lib/types";
import { findAllSets } from "../lib/solver";
import { CardUI as SetCardUI } from "./SetCard";

const COUNTS = [1, 2, 3] as const;

export default function SetSolver() {
  const [cards, setCards] = useState<SetCard[]>([]);
  const [symbol, setSymbol] = useState<SetSymbol>("diamond");
  const [color, setColor] = useState<SetColor>("red");
  const [texture, setTexture] = useState<SetTexture>("solid");
  const [count, setCount] = useState<1 | 2 | 3>(1);
  const [highlightedSet, setHighlightedSet] = useState<number | null>(null);

  function addCard() {
    setCards((prev) => [
      ...prev,
      { id: crypto.randomUUID(), symbol, color, texture, count },
    ]);
  }

  function removeCard(id: string) {
    setCards((prev) => prev.filter((c) => c.id !== id));
    setHighlightedSet(null);
  }

  const sets = useMemo(() => findAllSets(cards), [cards]);

  const highlightedCardIds = useMemo(() => {
    if (highlightedSet === null) return new Set<string>();
    return new Set(sets[highlightedSet]?.map((c) => c.id) ?? []);
  }, [highlightedSet, sets]);

  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4 gap-6 bg-bg">
      <GameTitle title="◈ SET SOLVER">
        FIND ALL VALID SETS IN YOUR HAND
      </GameTitle>

      {/* ── Card Builder ── */}
      <div className="w-full max-w-xl panel flex flex-col gap-5">
        <div className="divider-label">BUILD A CARD</div>

        <div className="grid grid-cols-2 gap-5">
          {/* Shape */}
          <div className="flex flex-col gap-2">
            <span className="panel-label">SHAPE</span>
            <div className="flex gap-2">
              {SYMBOLS.map((s) => (
                <SymbolSelectButton
                  key={s}
                  onClick={() => setSymbol(s)}
                  isActive={symbol === s}
                  symbol={s}
                  color={color}
                  texture={texture}
                />
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="flex flex-col gap-2">
            <span className="panel-label">COLOR</span>
            <div className="flex gap-2 items-center">
              {COLORS.map((c) => (
                <SymbolSelectButton
                  key={c}
                  onClick={() => setColor(c)}
                  isActive={color === c}
                  symbol={symbol}
                  color={c}
                  texture={texture}
                />
              ))}
            </div>
          </div>

          {/* Texture */}
          <div className="flex flex-col gap-2">
            <span className="panel-label">TEXTURE</span>
            <div className="flex gap-1.5 flex-wrap">
              {TEXTURES.map((t) => (
                <div
                  key={t}
                  className="flex flex-col gap-1 items-center justify-center"
                >
                  <SymbolSelectButton
                    onClick={() => setTexture(t)}
                    isActive={texture === t}
                    symbol={symbol}
                    color={color}
                    texture={t}
                  />
                  <div className="panel-label">{t}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Count */}
          <div className="flex flex-col gap-2">
            <span className="panel-label">COUNT</span>
            <div className="flex gap-2">
              {COUNTS.map((n) => (
                <SymbolSelectButton
                  key={n}
                  onClick={() => setCount(n)}
                  isActive={count === n}
                  symbol={symbol}
                  color={color}
                  texture={texture}
                  count={n}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Preview + Add */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1">
            <span className="panel-label">PREVIEW</span>
            <SetCardUI
              card={{ id: "preview", symbol, color, texture, count }}
              size="md"
              className="pointer-events-none"
            />
          </div>
          <div className="flex-1 flex flex-col gap-2 justify-end pb-0.5">
            <button onClick={addCard} className="btn-action w-full">
              + Add Card
            </button>
            {cards.length > 0 && (
              <button
                onClick={() => {
                  setCards([]);
                  setHighlightedSet(null);
                }}
                className="btn-ghost w-full text-[0.65rem]"
              >
                Clear All ({cards.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Hand ── */}
      {cards.length > 0 && (
        <div className="w-full max-w-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="panel-label">YOUR HAND</span>
            <div className="flex gap-2">
              <StatusChip variant="gold">{cards.length} cards</StatusChip>
              <StatusChip variant={sets.length > 0 ? "ok" : "ghost"}>
                {sets.length} set{sets.length !== 1 ? "s" : ""}
              </StatusChip>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {cards.map((card) => (
              <div key={card.id} className="group relative">
                <SetCardUI
                  card={card}
                  highlighted={highlightedCardIds.has(card.id)}
                  size="md"
                  onRemove={() => removeCard(card.id)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Results ── */}
      {cards.length > 0 && (
        <div className="w-full max-w-xl">
          <div className="divider-label mb-4">
            {sets.length === 0
              ? "NO SETS FOUND"
              : `${sets.length} SET${sets.length > 1 ? "S" : ""} FOUND`}
          </div>

          {sets.length === 0 && cards.length >= 3 && (
            <p className="font-mono text-[0.72rem] text-muted text-center py-4">
              No valid sets in this hand. Add more cards.
            </p>
          )}

          <div className="flex flex-col gap-3">
            {sets.map((set, idx) => (
              <button
                key={idx}
                onClick={() =>
                  setHighlightedSet(highlightedSet === idx ? null : idx)
                }
                className={[
                  "w-full text-left rounded-xs border p-3 flex items-center gap-3 cursor-pointer transition-all duration-150",
                  highlightedSet === idx
                    ? "border-gold-500 bg-gold-700"
                    : "border-gold-600 bg-surface hover:border-gold-500 hover:bg-raised",
                ].join(" ")}
              >
                <span className="font-ui text-[0.62rem] text-muted w-5 shrink-0">
                  #{idx + 1}
                </span>
                <div className="flex gap-2 flex-wrap">
                  {set.map((card) => (
                    <SetCardUI key={card.id} card={card} size="sm" />
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {cards.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-8 opacity-40">
          <div className="font-display text-4xl">◈</div>
          <p className="font-mono text-[0.72rem] text-muted">
            Add cards to find valid sets
          </p>
        </div>
      )}
    </div>
  );
}

interface SymbolSelectButtonProps {
  symbol: SetSymbol;
  texture: SetTexture;
  color: SetColor;
  count?: 1 | 2 | 3;
  onClick: () => void;
  isActive?: boolean;
}

const sizeMap = {
  1: "w-11 h-11",
  2: "w-20 h-11",
  3: "w-28 h-11",
} as const;

const SymbolSelectButton = ({
  symbol,
  texture,
  color,
  count = 1,
  onClick,
  isActive = false,
}: SymbolSelectButtonProps) => (
  <button
    onClick={onClick}
    className={[
      sizeMap[count],
      "rounded-xs border flex items-center justify-center cursor-pointer transition-all duration-150",
      isActive
        ? "border-gold-200 bg-gold-700"
        : "border-gold-600 bg-surface hover:border-gold-500",
    ].join(" ")}
  >
    <div
      className={[
        "flex items-center justify-center gap-1",
        count > 1 ? "flex-row" : "",
      ].join(" ")}
    >
      <SymbolRenderer
        symbol={symbol}
        color={color}
        texture={texture}
        count={count}
        className="w-6 h-6"
      />
    </div>
  </button>
);
