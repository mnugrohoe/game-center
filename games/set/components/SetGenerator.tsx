// games/set/components/SetGenerator.tsx

"use client";

import { useState, useCallback } from "react";

import {
  GameTitle,
  StatusChip,
  ControlButton,
  ActionButton,
  WinBanner,
} from "@/shared/components";

import { SET_DIFF_TIERS } from "../lib/difficulty";
import { generateByTier } from "../lib/generator";
import { findAllSets } from "../lib/solver";

import type { SetCard } from "../lib/types";

import { SetCard as SetCardUI } from "./SetCard";

export default function SetGenerator() {
  const [selectedTier, setSelectedTier] = useState<number>(0);
  const [board, setBoard] = useState<SetCard[] | null>(null);
  const [foundSets, setFoundSets] = useState<[SetCard, SetCard, SetCard][]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  const [won, setWon] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [solveRevealed, setSolveRevealed] = useState(false);
  const [allSets, setAllSets] = useState<[SetCard, SetCard, SetCard][]>([]);

  /*
  ───────────────────────────────────────
  HELPERS
  ───────────────────────────────────────
  */

  function normalizeSet(set: [SetCard, SetCard, SetCard]) {
    return set
      .map((c) => c.id)
      .sort()
      .join("-");
  }

  /*
  ───────────────────────────────────────
  GENERATE
  ───────────────────────────────────────
  */

  const generate = useCallback(() => {
    setGenerating(true);

    setTimeout(() => {
      try {
        const result = generateByTier(selectedTier, Date.now());
        setBoard(result.cards);
        setFoundSets([]);
        setSelectedIds(new Set());
        setScore(0);
        setWon(false);
        setSolveRevealed(false);
        setAllSets(result.sets);
      } catch {
        // retry silently
      }

      setGenerating(false);
    }, 50);
  }, [selectedTier]);

  /*
  ───────────────────────────────────────
  CARD SELECT
  ───────────────────────────────────────
  */

  function toggleCard(id: string) {
    if (won || solveRevealed) return;

    const next = new Set(selectedIds);

    /**
     * Toggle
     */
    if (next.has(id)) {
      next.delete(id);
    } else if (next.size < 3) {
      next.add(id);
    }

    setSelectedIds(next);

    /**
     * Need exactly 3 cards
     */
    if (next.size !== 3 || !board) {
      return;
    }

    const trio = board.filter((c) => next.has(c.id)) as [
      SetCard,
      SetCard,
      SetCard,
    ];

    const valid = findAllSets(trio).length > 0;

    /**
     * Invalid set
     */
    if (!valid) {
      setTimeout(() => {
        setSelectedIds(new Set());
      }, 400);

      return;
    }

    /**
     * Prevent duplicate scoring
     */
    const key = normalizeSet(trio);

    const alreadyFound = foundSets.some((s) => normalizeSet(s) === key);

    if (alreadyFound) {
      setTimeout(() => {
        setSelectedIds(new Set());
      }, 150);

      return;
    }

    /**
     * Add found set
     */
    const updated = [...foundSets, trio];

    setFoundSets(updated);

    setScore(updated.length);

    setSelectedIds(new Set());

    /**
     * Win condition
     */
    if (updated.length >= allSets.length) {
      setWon(true);
    }
  }

  const tier = SET_DIFF_TIERS[selectedTier];

  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4 gap-6 bg-bg">
      <GameTitle title="◈ SET GENERATOR">
        GENERATE A BOARD · FIND ALL SETS
      </GameTitle>

      {/* ───────────────────────────── */}
      {/* Difficulty */}
      {/* ───────────────────────────── */}

      <div className="w-full max-w-xl panel flex flex-col gap-4">
        <div className="divider-label">DIFFICULTY</div>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {SET_DIFF_TIERS.map((t, i) => (
            <button
              key={i}
              onClick={() => setSelectedTier(i)}
              className={[
                "flex flex-col items-start px-3 py-2 rounded-xs border cursor-pointer transition-all duration-150",
                "bg-surface hover:bg-raised hover:-translate-y-px text-left",
              ].join(" ")}
              style={{
                borderColor:
                  selectedTier === i ? "#c9a84c" : "var(--color-gold-600)",

                boxShadow:
                  selectedTier === i
                    ? "0 0 0 1px rgba(201,168,76,0.3)"
                    : "none",
              }}
            >
              <span className="font-ui text-[0.78rem] font-semibold text-gold-200 tracking-wide leading-tight">
                {t.symbol}
              </span>

              <span className="font-ui text-[0.65rem] text-gold-300 leading-tight mt-0.5">
                {t.name}
              </span>

              <span className="font-mono text-[0.55rem] text-muted mt-1">
                {t.boardCols}×{t.boardRows}
              </span>
            </button>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap text-[0.65rem] font-mono text-muted">
          <span>{tier.boardCols * tier.boardRows} cards</span>

          <span>·</span>

          <span>{tier.ensureSets} sets min</span>

          {tier.timer && (
            <>
              <span>·</span>

              <span>{tier.timer}s timer</span>
            </>
          )}
        </div>

        <ActionButton
          onClick={generate}
          disabled={generating}
          className="w-full"
        >
          {generating ? "Generating…" : "Generate Board"}
        </ActionButton>
      </div>

      {/* ───────────────────────────── */}
      {/* BOARD */}
      {/* ───────────────────────────── */}

      {board && (
        <div className="w-full max-w-xl flex flex-col gap-4">
          {/* Status */}

          <div className="flex flex-wrap gap-2 justify-center">
            <StatusChip variant="gold">
              {score} / {allSets.length} sets found
            </StatusChip>

            <StatusChip variant={selectedIds.size === 3 ? "err" : "ghost"}>
              {selectedIds.size}/3 selected
            </StatusChip>

            <StatusChip variant="ghost">{tier.name}</StatusChip>
          </div>

          {/* Win */}

          {won && (
            <WinBanner
              detail={`Found all ${allSets.length} sets! Score: ${score}`}
            />
          )}

          {/* Grid */}

          <div
            className="grid gap-2 justify-center"
            style={{
              gridTemplateColumns: `repeat(${tier.boardCols}, auto)`,
            }}
          >
            {board.map((card) => {
              const isHighlighted =
                solveRevealed &&
                allSets.some((s) => s.some((c) => c.id === card.id));

              const isPartOfFoundSet = foundSets.some((s) =>
                s.some((c) => c.id === card.id),
              );

              return (
                <SetCardUI
                  key={card.id}
                  card={card}
                  selected={selectedIds.has(card.id)}
                  highlighted={isHighlighted}
                  onClick={() => toggleCard(card.id)}
                  size="md"
                  className={isPartOfFoundSet ? "ring-1 ring-ok/40" : ""}
                />
              );
            })}
          </div>

          {/* Controls */}

          <div className="flex gap-2 flex-wrap justify-center">
            <ControlButton
              onClick={() => setSelectedIds(new Set())}
              disabled={selectedIds.size === 0}
            >
              Clear
            </ControlButton>

            <ControlButton onClick={() => setSolveRevealed((v) => !v)}>
              {solveRevealed ? "Hide Hints" : "Hint"}
            </ControlButton>

            <ControlButton onClick={generate}>↺ New Board</ControlButton>
          </div>

          {/* Found sets */}

          {foundSets.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="divider-label">
                FOUND SETS ({foundSets.length}/{allSets.length})
              </div>

              {foundSets.map((set, i) => (
                <div
                  key={i}
                  className="flex gap-2 items-center panel py-2 px-3 border-ok-rim bg-ok-bg"
                >
                  <span className="font-ui text-[0.6rem] text-ok w-4">✓</span>

                  {set.map((card) => (
                    <SetCardUI key={card.id} card={card} size="sm" />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}

      {!board && (
        <div className="flex flex-col items-center gap-3 py-8 opacity-40">
          <div className="font-display text-4xl">◈</div>

          <p className="font-mono text-[0.72rem] text-muted">
            Generate a board to start playing
          </p>
        </div>
      )}
    </div>
  );
}
