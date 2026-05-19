"use client";

import { useState, useEffect } from "react";
import {
  KingsBoardProvider,
  useKingsBoardCtx,
} from "../context/KingsBoardContext";
import { KingsBoard } from "./shared/KingsBoard";
import { BoardStatusBar } from "./shared/BoardStatusBar";
import { BoardControls } from "./shared/BoardControls";
import { formatTime } from "../lib/index";
import KingsTitle from "./shared/KingsTitle";
import HowToPlay from "./HowToPlay";

const PUZZLES: Record<
  string,
  { label: string; size: number; regions: number[][] }
> = {
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
};

function KingsGameInner() {
  const { loadPuzzle, won, elapsed, N } = useKingsBoardCtx();
  const [diff, setDiff] = useState("easy");

  const load = (d: string) => {
    const p = PUZZLES[d];
    setDiff(d);
    loadPuzzle(p.regions, p.size);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load("easy");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cellPx = N <= 5 ? 58 : N <= 7 ? 50 : 44;

  return (
    <div
      className="min-h-screen flex flex-col items-center py-8 px-4"
      style={{
        background:
          "linear-gradient(135deg,#1a1814 0%,#0f0e0d 50%,#161410 100%)",
        color: "#e8dcc8",
      }}
    >
      {/* Header */}
      <KingsTitle>
        <span className="text-xs">
          PLACE ONE KING PER REGION · ROW · COLUMN
        </span>
      </KingsTitle>

      {/* Difficulty tabs */}
      <div className="flex gap-2 mb-5">
        {Object.entries(PUZZLES).map(([key, p]) => (
          <button
            key={key}
            onClick={() => load(key)}
            style={{
              fontFamily: "'Cinzel',serif",
              fontSize: "0.65rem",
              letterSpacing: "0.1em",
              padding: "4px 14px",
              borderRadius: "999px",
              cursor: "pointer",
              transition: "all 0.2s",
              border:
                diff === key
                  ? "1px solid rgba(212,152,15,0.6)"
                  : "1px solid rgba(212,152,15,0.2)",
              background:
                diff === key ? "rgba(212,152,15,0.15)" : "transparent",
              color: diff === key ? "#d4980f" : "#7a6840",
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <BoardStatusBar />
      </div>

      <div
        className="mb-5 p-1.5 rounded-sm"
        style={{
          border: "1px solid rgba(212,152,15,0.2)",
          background: "rgba(0,0,0,0.35)",
        }}
      >
        <KingsBoard cellPx={cellPx} ctx={useKingsBoardCtx()} />
      </div>

      {won && (
        <div
          className="mb-4 px-6 py-3 text-center rounded-sm"
          style={{
            border: "1px solid rgba(212,152,15,0.5)",
            background: "rgba(212,152,15,0.1)",
          }}
        >
          <div
            style={{
              fontFamily: "'Cinzel',serif",
              color: "#e4b43a",
              fontSize: "0.875rem",
              letterSpacing: "0.1em",
            }}
          >
            ⚜ PUZZLE SOLVED ⚜
          </div>
          <div style={{ color: "#888", fontSize: "0.75rem", marginTop: "4px" }}>
            Solved in {formatTime(elapsed)}
          </div>
        </div>
      )}

      <div className="mb-6">
        <BoardControls onReset={() => load(diff)} />
      </div>

      {/* How to play */}
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
