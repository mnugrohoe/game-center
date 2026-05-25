"use client";

import { useState, useCallback, useMemo } from "react";

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

import { CardUI as Card, SetCardUI } from "./SetCard";
import SymbolRenderer from "./shape";
import { FaMinus, FaShuffle } from "react-icons/fa6";
import { shuffle } from "@/shared/algorithms";

export default function SetGenerator() {
  const [selectedTier, setSelectedTier] = useState<number>(0);

  const [board, setBoard] = useState<SetCard[] | null>(null);

  const [foundSets, setFoundSets] = useState<[SetCard, SetCard, SetCard][]>([]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [score, setScore] = useState(0);

  const [won, setWon] = useState(false);

  const [generating, setGenerating] = useState(false);

  const [hintIds, setHintIds] = useState<Set<string>>(new Set());

  const [allSets, setAllSets] = useState<[SetCard, SetCard, SetCard][]>([]);

  function normalizeSet(set: [SetCard, SetCard, SetCard]) {
    return set
      .map((c) => c.id)
      .sort()
      .join("-");
  }

  const remainingSets = useMemo(() => {
    const foundKeys = new Set(foundSets.map(normalizeSet));

    const map = new Map<string, [SetCard, SetCard, SetCard]>();

    for (const set of allSets) {
      const key = normalizeSet(set);

      if (!foundKeys.has(key)) {
        map.set(key, set);
      }
    }

    return [...map.values()];
  }, [allSets, foundSets]);

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

        setHintIds(new Set());

        setAllSets(result.sets);
      } catch {
        //
      }

      setGenerating(false);
    }, 50);
  }, [selectedTier]);

  function revealHint() {
    if (!remainingSets.length) return;

    setHintIds((prev) => {
      const nextIndex = prev.size;
      const nextHint = remainingSets[0]?.[nextIndex]?.id;

      if (!nextHint) return prev;

      return new Set([...prev, nextHint]);
    });
  }

  function clearSolvedHints(updatedFoundSets: [SetCard, SetCard, SetCard][]) {
    const foundKeys = new Set(updatedFoundSets.map(normalizeSet));

    const remainingHintCards = [...hintIds].filter((id) => {
      return allSets.some((set) => {
        const key = normalizeSet(set);

        if (foundKeys.has(key)) {
          return false;
        }

        return set.some((c) => c.id === id);
      });
    });

    setHintIds(new Set(remainingHintCards));
  }

  function toggleCard(id: string) {
    if (won) return;

    const next = new Set(selectedIds);

    if (next.has(id)) {
      next.delete(id);
    } else if (next.size < 3) {
      next.add(id);
    }

    setSelectedIds(next);

    if (next.size !== 3 || !board) {
      return;
    }

    const trio = board.filter((c) => next.has(c.id)) as [
      SetCard,
      SetCard,
      SetCard,
    ];

    const valid = findAllSets(trio).length > 0;

    if (!valid) {
      setTimeout(() => {
        setSelectedIds(new Set());
      }, 400);

      return;
    }

    const key = normalizeSet(trio);

    const alreadyFound = foundSets.some((s) => normalizeSet(s) === key);

    if (alreadyFound) {
      setTimeout(() => {
        setSelectedIds(new Set());
      }, 150);

      return;
    }

    const updated = [...foundSets, trio];

    setFoundSets(updated);

    setScore(updated.length);

    setSelectedIds(new Set());

    clearSolvedHints(updated);

    setHintIds(new Set());

    if (updated.length >= allSets.length) {
      setWon(true);

      setHintIds(new Set());
    }
  }

  const shuffleBoard = () => {
    setBoard((prev) => (prev ? shuffle([...prev]) : prev));
    setSelectedIds(new Set());
    setHintIds(new Set());
  };
  const tier = SET_DIFF_TIERS[selectedTier];

  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4 gap-6 bg-bg">
      <GameTitle title="◈ SET GENERATOR">
        GENERATE A BOARD · FIND ALL SETS
      </GameTitle>

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

          <span>{tier.targetSets} sets min</span>

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

      {board && (
        <div className="w-full max-w-xl flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="divider-label">
              FOUND SETS ({foundSets.length}/{allSets.length})
            </div>

            <div className="flex gap-2 items-center justify-center flex-wrap">
              {foundSets.map((set, i) => (
                <SetCardUI
                  key={i}
                  className="panel border-ok-rim bg-ok-bg"
                  card={set}
                />
              ))}

              {Array.from({
                length: allSets.length - foundSets.length,
              }).map((_, i) => (
                <div
                  key={i}
                  className="flex gap-1 items-center py-2 px-3 w-22 h-22"
                >
                  <FaMinus className="w-2 h-2" />
                  <FaMinus className="w-2 h-2" />
                  <FaMinus className="w-2 h-2" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            <StatusChip variant="gold">
              {score} / {allSets.length} sets found
            </StatusChip>

            <StatusChip variant={selectedIds.size === 3 ? "err" : "ghost"}>
              {selectedIds.size}/3 selected
            </StatusChip>

            <StatusChip variant="ghost">{tier.name}</StatusChip>

            {hintIds.size > 0 && (
              <StatusChip variant="gold">
                {hintIds.size} hint{hintIds.size > 1 ? "s" : ""}
              </StatusChip>
            )}
          </div>

          {won && (
            <WinBanner
              detail={`Found all ${allSets.length} sets! Score: ${score}`}
            />
          )}

          <div
            className="grid gap-2 justify-center"
            style={{
              gridTemplateColumns: `repeat(${tier.boardCols}, auto)`,
            }}
          >
            {board.map((card) => {
              const isHighlighted = hintIds.has(card.id);

              return (
                <Card
                  key={card.id}
                  card={card}
                  selected={selectedIds.has(card.id)}
                  highlighted={isHighlighted}
                  onClick={() => toggleCard(card.id)}
                  size="md"
                />
              );
            })}
          </div>

          <div className="flex gap-2 flex-wrap justify-center">
            <ControlButton
              onClick={() => setSelectedIds(new Set())}
              disabled={selectedIds.size === 0}
            >
              Clear
            </ControlButton>

            <ControlButton
              onClick={revealHint}
              disabled={remainingSets.length === 0}
            >
              + Hint
            </ControlButton>

            <ControlButton onClick={() => setHintIds(new Set())}>
              Clear Hints
            </ControlButton>

            <ControlButton
              onClick={() => shuffleBoard()}
              className="flex gap-1 items-center"
            >
              <FaShuffle /> Shuffle
            </ControlButton>

            <ControlButton onClick={generate}>↺ New Board</ControlButton>
          </div>
        </div>
      )}

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
