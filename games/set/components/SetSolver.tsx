"use client";

import { useMemo, useState } from "react";

import GameTitle from "@/shared/component/GameTitle";

import SymbolRenderer from "./shape";

import { COLOR_MAP, COLORS, SYMBOLS, TEXTURES } from "../lib/constants";

import { SetCard, SetColor, SetSymbol, SetTexture } from "../lib/types";

import { findAllSets } from "../lib/solver";

const COUNTS = [1, 2, 3] as const;

export default function SetSolver() {
  const [cards, setCards] = useState<SetCard[]>([]);

  const [symbol, setSymbol] = useState<SetSymbol>("diamond");

  const [color, setColor] = useState<SetColor>("red");

  const [texture, setTexture] = useState<SetTexture>("solid");

  const [count, setCount] = useState<1 | 2 | 3>(1);

  /*
  ───────────────────────────────────────
  ADD
  ───────────────────────────────────────
  */

  function addCard() {
    const card: SetCard = {
      id: crypto.randomUUID(),

      symbol,
      color,
      texture,
      count,
    };

    setCards((prev) => [...prev, card]);
  }

  /*
  ───────────────────────────────────────
  REMOVE
  ───────────────────────────────────────
  */

  function removeCard(id: string) {
    setCards((prev) => prev.filter((c) => c.id !== id));
  }

  /*
  ───────────────────────────────────────
  SOLVE
  ───────────────────────────────────────
  */

  const sets = useMemo(() => {
    return findAllSets(cards);
  }, [cards]);

  return (
    <div className="flex flex-col gap-6">
      <GameTitle title="Sets" />

      {/* Generator */}
      <div
        className="
          rounded-2xl
          border border-white/10
          bg-white/3
          backdrop-blur-sm
          p-4
          flex flex-col
          gap-5
        "
      >
        <div className="grid grid-cols-2 gap-5">
          {/* Shape */}
          <div className="flex flex-col gap-2">
            <div
              className="
                text-[10px]
                uppercase
                tracking-[0.22em]
                text-white/40
              "
            >
              Shape
            </div>

            <div className="flex gap-2">
              {SYMBOLS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSymbol(s)}
                  className={`
                    w-12 h-12
                    rounded-xl
                    border
                    transition-all
                    duration-150
                    flex items-center justify-center

                    ${
                      symbol === s
                        ? `
                          border-white/30
                          bg-white/10
                          shadow-[0_0_14px_rgba(255,255,255,0.06)]
                        `
                        : `
                          border-white/10
                          bg-white/2
                          hover:border-white/20
                          hover:bg-white/4
                        `
                    }
                  `}
                >
                  <div className="w-7 h-7">
                    <SymbolRenderer
                      symbol={s}
                      color={color}
                      texture={texture}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="flex flex-col gap-2">
            <div
              className="
                text-[10px]
                uppercase
                tracking-[0.22em]
                text-white/40
              "
            >
              Color
            </div>

            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`
                    w-8 h-8
                    rounded-full
                    border
                    transition-all
                    duration-150
                    bg-[${COLOR_MAP[c]}]
                    ${
                      color === c
                        ? `
                          scale-110
                          border-white/40
                        `
                        : `
                          border-transparent
                          opacity-70
                          hover:opacity-100
                        `
                    }
                  `}
                />
              ))}
            </div>
          </div>

          {/* Texture */}
          <div className="flex flex-col gap-2">
            <div
              className="
                text-[10px]
                uppercase
                tracking-[0.22em]
                text-white/40
              "
            >
              Texture
            </div>

            <div className="flex gap-2 flex-wrap">
              {TEXTURES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTexture(t)}
                  className={`
                    px-3 py-1.5
                    rounded-lg
                    border
                    text-[10px]
                    uppercase
                    tracking-[0.18em]
                    transition-all

                    ${
                      texture === t
                        ? `
                          border-white/25
                          bg-white/10
                          text-white
                        `
                        : `
                          border-white/10
                          text-white/45
                          hover:border-white/20
                          hover:text-white/70
                        `
                    }
                  `}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Count */}
          <div className="flex flex-col gap-2">
            <div
              className="
                text-[10px]
                uppercase
                tracking-[0.22em]
                text-white/40
              "
            >
              Count
            </div>

            <div className="flex gap-2">
              {COUNTS.map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={`
                    w-8 h-8
                    rounded-lg
                    border
                    text-xs
                    transition-all

                    ${
                      count === n
                        ? `
                          border-white/25
                          bg-white/10
                          text-white
                        `
                        : `
                          border-white/10
                          text-white/45
                          hover:border-white/20
                        `
                    }
                  `}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="flex flex-col gap-2">
          <div
            className="
              text-[10px]
              uppercase
              tracking-[0.22em]
              text-white/40
            "
          >
            Preview
          </div>

          <div
            className="
              w-24 h-36
              rounded-2xl
              border border-white/10
              bg-white/3
              p-3
              flex flex-col
              justify-center
              gap-2
            "
          >
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="h-7">
                <SymbolRenderer
                  symbol={symbol}
                  color={color}
                  texture={texture}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Add */}
        <button
          onClick={addCard}
          className="
            h-11
            rounded-xl
            border border-white/10
            bg-white/5
            text-sm
            tracking-[0.18em]
            uppercase
            text-white/80
            transition-all

            hover:bg-white/8
            hover:border-white/20
          "
        >
          Add Card
        </button>
      </div>

      {/* Cards */}
      <div className="flex flex-wrap gap-3">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => removeCard(card.id)}
            className="
              w-24 h-36
              rounded-2xl
              border border-white/10
              bg-white/3
              p-3
              flex flex-col
              justify-center
              gap-2
              transition-all
              duration-150

              hover:-translate-y-0.5
              hover:border-red-400/40
              hover:bg-red-400/3
            "
          >
            {Array.from({
              length: card.count,
            }).map((_, i) => (
              <div key={i} className="h-7">
                <SymbolRenderer
                  symbol={card.symbol}
                  color={card.color}
                  texture={card.texture}
                />
              </div>
            ))}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="flex flex-col gap-4">
        <div
          className="
            text-xs
            uppercase
            tracking-[0.22em]
            text-white/50
          "
        >
          Found Sets: {sets.length}
        </div>

        <div className="flex flex-col gap-3">
          {sets.map((set, idx) => (
            <div
              key={idx}
              className="
                flex flex-wrap
                gap-3
                rounded-2xl
                border border-white/10
                bg-white/2
                p-3
              "
            >
              {set.map((card) => (
                <div
                  key={card.id}
                  className="
                    w-20 h-32
                    rounded-xl
                    border border-white/10
                    bg-white/3
                    p-2
                    flex flex-col
                    justify-center
                    gap-2
                  "
                >
                  {Array.from({
                    length: card.count,
                  }).map((_, i) => (
                    <div key={i} className="h-6">
                      <SymbolRenderer
                        symbol={card.symbol}
                        color={card.color}
                        texture={card.texture}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
