"use client";
/**
 * games/kings/components/KingsGame.tsx
 * Uses shared: PageLayout (via parent), WinBanner, ControlButton.
 * Uses local: KingsBoard, BoardStatusBar, BoardControls, HowToPlay.
 */
import { useState, useEffect } from "react";
import {
  KingsBoardProvider,
  useKingsBoardCtx,
} from "../context/KingsBoardContext";
import { WinBanner } from "@/shared/components";
import { KingsBoard } from "./shared/KingsBoard";
import { BoardStatusBar } from "./shared/BoardStatusBar";
import { BoardControls } from "./shared/BoardControls";
import { KingsTitle } from "./shared/KingsTitle";
import { HowToPlay } from "./HowToPlay";
import { formatTime } from "@/games/kings/lib";

// ── Static built-in puzzles ───────────────────────────────────────────────────

const PUZZLES = {
  easy: {
    label: "EASY · 5×5",
    size: 5,
    regions: [
      [0, 0, 1, 1, 1],
      [0, 0, 1, 2, 2],
      [0, 3, 3, 2, 2],
      [4, 3, 3, 3, 2],
      [4, 4, 4, 3, 2],
    ],
  },
  medium: {
    label: "MEDIUM · 7×7",
    size: 7,
    regions: [
      [0, 0, 0, 1, 1, 1, 1],
      [0, 0, 2, 2, 1, 1, 1],
      [0, 2, 2, 3, 3, 1, 4],
      [5, 2, 3, 3, 4, 4, 4],
      [5, 5, 3, 6, 4, 4, 4],
      [5, 5, 6, 6, 6, 4, 4],
      [5, 5, 6, 6, 6, 6, 6],
    ],
  },
  hard: {
    label: "HARD · 9×9",
    size: 9,
    regions: [
      [0, 0, 0, 1, 1, 1, 2, 2, 2],
      [0, 0, 3, 3, 1, 2, 2, 2, 2],
      [0, 3, 3, 3, 4, 4, 2, 5, 2],
      [6, 3, 3, 4, 4, 5, 5, 5, 5],
      [6, 6, 3, 4, 4, 5, 5, 7, 5],
      [6, 6, 8, 8, 4, 5, 7, 7, 7],
      [6, 8, 8, 8, 8, 7, 7, 7, 7],
      [6, 8, 8, 8, 8, 7, 7, 7, 7],
      [6, 6, 8, 8, 8, 7, 7, 7, 7],
    ],
  },
} as const;

type Diff = keyof typeof PUZZLES;

// ── Inner component (needs context) ──────────────────────────────────────────

function KingsGameInner() {
  const { loadPuzzle, won, elapsed, N } = useKingsBoardCtx();
  const [diff, setDiff] = useState<Diff>("easy");

  function load(d: Diff) {
    setDiff(d);
    loadPuzzle(PUZZLES[d].regions as number[][], PUZZLES[d].size);
  }

  useEffect(() => {
    load("easy");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cellPx = N <= 5 ? 58 : N <= 7 ? 50 : 44;

  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4 gap-5 bg-raised">
      <KingsTitle>PLACE ONE KING PER REGION · ROW · COLUMN</KingsTitle>

      {/* Difficulty tabs */}
      <div className="flex gap-2">
        {(Object.keys(PUZZLES) as Diff[]).map((key) => (
          <button
            key={key}
            onClick={() => load(key)}
            className={[
              "font-ui text-[0.65rem] tracking-[0.1em] px-4 py-1.5 rounded-full",
              "border cursor-pointer transition-all duration-200",
              diff === key
                ? "border-gold-200 bg-gold-700 text-gold-200"
                : "border-gold-600 bg-transparent text-muted hover:border-gold-500 hover:text-secondary",
            ].join(" ")}
          >
            {PUZZLES[key].label}
          </button>
        ))}
      </div>

      <BoardStatusBar />

      {/* Board */}
      <div className="p-1.5 rounded-xs border border-gold-600 bg-black/35">
        <KingsBoard cellPx={cellPx} />
      </div>

      {/* Win banner */}
      {won && (
        <WinBanner
          detail={`Solved in ${formatTime(elapsed)} · ${PUZZLES[diff].label}`}
        />
      )}

      <BoardControls onReset={() => load(diff)} />

      <HowToPlay />
    </div>
  );
}

export default function KingsGame() {
  return (
    <KingsBoardProvider>
      <KingsGameInner />
    </KingsBoardProvider>
  );
}
