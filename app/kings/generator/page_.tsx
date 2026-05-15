"use client";

import { useState } from "react";

import { GameBoard } from "@/games/kings/components/KingsBoard";

import { useGame } from "@/games/kings/hooks/useKingsGame";
import { cinzel, cinzelDecorative } from "@/shared/utils/fonts";
import { DifficultyBadge } from "@/games/kings/components/DifficultyBadge";
import { levelToTierIndex } from "@/games/kings/core/seed";
import { FaChevronRight, FaChevronLeft } from "react-icons/fa6";
import { TIERS } from "@/games/kings/core/const";

const MAX_LEVEL = 99999;

export default function Page() {
  const [level, setLevel] = useState(1);
  const [diff, setDiff] = useState(0);
  const [mode, setMode] = useState<"level" | "diff">("level");
  const [barWidth, setBarWidth] = useState(0);

  const { grid, generate, placeKing, toggleMark, cellStates, autoLocked } =
    useGame();

  const handleLevelChange = (newLevel: number) => {
    setLevel(newLevel);
    // generate(newLevel, 7); // TODO: size selector
    setBarWidth(
      Math.min(99, (Math.log(newLevel + 1) / Math.log(MAX_LEVEL + 1)) * 100),
    );
  };

  return (
    <main className="w-full mx-auto px-4 py-8 flex flex-col gap-6 container">
      {/* <!-- Header --> */}
      <div className="text-center">
        <h1
          className={`${cinzelDecorative.className} text-2xl font-bold mb-1`}
          style={{ color: "var(--gold-bright)", letterSpacing: "0.08em" }}
        >
          ♛ KINGS
        </h1>
        <p
          className={`${cinzel.className} text-xs tracking-widest`}
          style={{ color: "var(--text-dim)" }}
        >
          PUZZLE GENERATOR
        </p>
      </div>

      {/* <!-- Generator panel --> */}
      <div
        className="rounded-sm p-5 flex flex-col gap-5"
        style={{
          background: "var(--surface)",
          border: "0.5px solid rgba(201,168,76,0.15)",
        }}
      >
        {/* <!-- Mode tabs --> */}
        <div
          className="flex gap-0 rounded-sm overflow-hidden"
          style={{ border: "1px solid rgba(201,168,76,0.2)" }}
        >
          <button
            id="tab-level"
            onClick={() => setMode("level")}
            className={`flex-1 py-2 ${cinzel.className} text-xs tracking-widest transition-all`}
            style={{
              background: "rgba(201,168,76,0.12)",
              color: "var(--gold)",
            }}
          >
            BY LEVEL
          </button>
          <button
            id="tab-diff"
            onClick={() => setMode("diff")}
            className={`flex-1 py-2 ${cinzel.className} text-xs tracking-widest transition-all`}
            style={{ color: "var(--text-dim)" }}
          >
            BY DIFFICULTY
          </button>
        </div>

        {/* <!-- BY LEVEL --> */}
        {mode === "level" && (
          <div id="panel-level" className="w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex flex-col w-full">
                <span
                  className={`${cinzel.className} text-xs tracking-widest mb-1`}
                  style={{ color: "var(--text-dim)" }}
                >
                  LEVEL
                </span>
                <div className="flex items-center justify-between gap-2 w-full">
                  <div>
                    <button
                      className="btn"
                      style={{ padding: "6px 12px" }}
                      onClick={() =>
                        handleLevelChange(
                          Math.min(MAX_LEVEL - 1, Math.max(1, level - 1)),
                        )
                      }
                    >
                      <FaChevronLeft />
                    </button>
                  </div>
                  <div className="flex flex-col items-center flex-1">
                    <input
                      type="number"
                      id="level-input"
                      value={level}
                      min="1"
                      max="99999"
                      className={`text-center bg-transparent border-stone-950 ${cinzelDecorative.className} text-4xl font-bold shadow-xl tracking-widest
                    py-1.5 px-3 outline-0 transition-border rounded-sm focus:border-gold`}
                      style={{ color: "var(--gold-bright)" }}
                      onChange={(e) =>
                        handleLevelChange(parseInt(e.target.value) || 1)
                      }
                    />
                    <div id="level-diff-preview" className="mt-1">
                      <DifficultyBadge difficulty={levelToTierIndex(level)} />
                    </div>
                  </div>
                  <div>
                    <button
                      className="btn px-3 py-1.5"
                      onClick={() =>
                        handleLevelChange(Math.min(MAX_LEVEL, level + 1))
                      }
                    >
                      <FaChevronRight />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="prog-bar mb-1">
              <div
                className="prog-fill h-1"
                id="prog-fill"
                style={{
                  width: `${barWidth}%`,
                  backgroundColor: TIERS[levelToTierIndex(level)].color,
                }}
              ></div>
            </div>
          </div>
        )}

        {/* <!-- BY DIFFICULTY --> */}
        {mode === "diff" && (
          <div id="panel-diff" className="flex-col gap-3">
            <span
              className={`${cinzel.className} text-xs tracking-widest`}
              style={{ color: "var(--text-dim)" }}
            >
              SELECT DIFFICULTY
            </span>
            <div className="flex gap-1.5">
              {TIERS.map((_, idx) => (
                <button
                  key={idx}
                  className="btn"
                  onClick={() => {
                    setDiff(idx);
                  }}
                >
                  <DifficultyBadge difficulty={idx} active={diff === idx} />
                </button>
              ))}
            </div>
            <div
              id="diff-desc"
              className="text-xs leading-relaxed"
              style={{ color: "var(--text-dim)" }}
            ></div>
          </div>
        )}

        {/* <!-- Generate button --> */}
        <button
          className="btn primary text-base py-3"
          id="btn-generate"
          onClick={() => generate(level, 7) /* TODO: size selector */}
        >
          Generate Puzzle
        </button>

        {/* <!-- Puzzle info chips --> */}
        <div
          className="flex gap-2 flex-wrap items-center"
          id="info-chips"
          style={{ display: "none!important" }}
        ></div>
      </div>

      {/* Board */}
      <div className="mt-6">
        <GameBoard
          grid={grid}
          states={cellStates}
          autoLocked={autoLocked}
          onLeftClick={toggleMark}
          onRightClick={placeKing}
        />
      </div>

      {/* <!-- Board area --> */}
      <div id="board-area" className="flex flex-col items-center gap-3">
        <div id="board-outer" className="hidden">
          <div id="board" style={{ display: "grid", gap: "0" }}></div>
        </div>

        {/* <!-- Status chips --> */}
        <div
          className="flex gap-2 flex-wrap justify-center"
          id="status-chips"
          style={{ display: "none!important" }}
        >
          <span className="chip chip-gold" id="chip-kings">
            0 / 0
          </span>
          <span className="chip chip-dim" id="chip-status"></span>
          <span className="chip chip-dim tabular-nums" id="chip-timer">
            0:00
          </span>
        </div>

        {/* <!-- Win banner --> */}
        <div id="win-banner">
          <div
            className={`${cinzelDecorative.className} text-sm`}
            style={{ color: "var(--gold-bright)" }}
          >
            ⚜ PUZZLE CONQUERED ⚜
          </div>
          <div
            id="win-detail"
            className="text-xs mt-1"
            style={{ color: "var(--text-dim)" }}
          ></div>
        </div>

        {/* <!-- Game controls -->
        <div
          id="game-btns"
          className="hidden flex gap-2 flex-wrap justify-center"
        >
          <button className="btn" onClick={resetPuzzle}>
            ↺ Restart
          </button>
          <button className="btn" onClick={clearMarks}>
            Clear marks
          </button>
          <button
            className="btn"
            onClick={undoMove}
            id="btn-undo"
            disabled
            style={{ opacity: "0.4" }}
          >
            ↩ Undo
          </button>
          <button className="btn" onClick={showHint}>
            ? Hint
          </button>
        </div> */}
      </div>

      {/* <!-- How to play --> */}
      <div
        className="rounded-sm p-4"
        style={{
          background: "var(--surface)",
          border: "0.5px solid rgba(201,168,76,0.1)",
        }}
      >
        <div className="ornament mb-3">
          <span
            className={`${cinzel.className} text-xs tracking-widest`}
            style={{ color: "var(--text-dim)" }}
          >
            HOW TO PLAY
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          <div
            className="text-xs flex gap-2"
            style={{ color: "var(--text-dim)" }}
          >
            <span style={{ color: "var(--gold)" }}>L-click</span> → mark ×
          </div>
          <div
            className="text-xs flex gap-2"
            style={{ color: "var(--text-dim)" }}
          >
            <span style={{ color: "var(--gold)" }}>R-click / dblclick</span> →
            King ♛
          </div>
          <div
            className="text-xs flex gap-2"
            style={{ color: "var(--text-dim)" }}
          >
            <span style={{ color: "var(--gold)" }}>1 king</span> per region,
            row, column
          </div>
          <div
            className="text-xs flex gap-2"
            style={{ color: "var(--text-dim)" }}
          >
            <span style={{ color: "var(--gold)" }}>3×3 zone</span> around each
            king = blocked
          </div>
        </div>
      </div>

      {/* <!-- Footer --> */}
      <div
        className={`text-center ${cinzel.className} text-xs tracking-widest`}
        style={{ color: "rgba(201,168,76,0.2)" }}
      >
        SAME SEED · SAME PUZZLE · EVERY TIME
      </div>
    </main>
  );
}
