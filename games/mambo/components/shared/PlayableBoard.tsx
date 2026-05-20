"use client";

import type { MamboPuzzle } from "../../types";
import { DIFF_TIERS } from "../../lib/difficulty";
import { useMamboBoard } from "../../hooks/useMamboBoard";
import { useErrorCells } from "../../hooks/useErrorCells";
import { MamboBoard } from "./MamboBoard";

const SUN  = "☀";
const MOON = "◑";

function fmt(s: number): string {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

interface PlayableBoardProps {
  puzzle: MamboPuzzle;
  onBack: () => void;
  sourceLabel: string;
  onNext?: () => void;
}

export function PlayableBoard({ puzzle, onBack, sourceLabel, onNext }: PlayableBoardProps) {
  const { userGrid, status, elapsed, showSol, handleCellClick, togglePeek } =
    useMamboBoard(puzzle);

  const { errorCells, completedRows, completedCols } = useErrorCells(
    userGrid,
    puzzle,
    status === "playing",
  );

  const lockedCells = new Set(
    puzzle.puzzle.flatMap((row, r) =>
      row.map((v, c) => (v ? r * puzzle.size + c : -1)).filter((i) => i >= 0),
    ),
  );

  const diff       = DIFF_TIERS[puzzle.diffId];
  const color      = diff.color;
  const blankTotal = puzzle.puzzle.flat().filter((v) => !v).length;
  const filled     = userGrid
    .flat()
    .filter((v, i) => v && !puzzle.puzzle.flat()[i]).length;
  const levelNum   = puzzle.levelNum ?? 1;

  const displayGrid = showSol ? puzzle.solution : userGrid;

  return (
    <div className="flex flex-col items-center gap-3.5 w-full">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between w-full gap-2.5 flex-wrap">
        <button
          onClick={onBack}
          className="font-mono text-[0.7rem] font-bold px-3 py-1.5 rounded-lg border border-[#22203a] bg-transparent text-[#4a4860] cursor-pointer transition-all hover:border-[#4a4860] hover:text-[#dddaea]"
        >
          ← {sourceLabel}
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[1rem] font-extrabold tracking-[0.03em]" style={{ color }}>
            {diff.name}
          </span>
          <span className="font-mono text-[0.65rem] font-bold text-[#a78bfa] bg-[#14131e] border border-[#2e2a4a] rounded-md px-2 py-0.5">
            #{levelNum}
          </span>
          <span className="font-mono text-[0.68rem] text-[#4a4860] bg-[#14131e] border border-[#22203a] rounded-md px-2 py-0.5">
            {puzzle.size}×{puzzle.size}
          </span>
        </div>

        {status === "playing" && (
          <span className="font-mono text-[0.95rem] font-bold text-[#a78bfa] min-w-[50px] text-right">
            {fmt(elapsed)}
          </span>
        )}
        {status === "won" && (
          <span className="font-mono text-[0.95rem] font-bold text-green-400 min-w-[50px] text-right">
            ✓ {fmt(elapsed)}
          </span>
        )}
      </div>

      {/* ── Progress bar ── */}
      {status === "playing" && (
        <div className="w-full max-w-[500px] h-[3px] bg-[#22203a] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-[width_0.3s_ease]"
            style={{
              width:      blankTotal ? `${Math.round((filled / blankTotal) * 100)}%` : "0%",
              background: color,
            }}
          />
        </div>
      )}

      {/* ── Win banner ── */}
      {status === "won" && (
        <div className="flex items-center gap-2 bg-[#0e1a10] border border-[#2d6630] rounded-xl px-5 py-3 text-[0.95rem] font-bold text-green-400">
          🎉 Solved in {fmt(elapsed)}!
          {onNext && (
            <button
              onClick={onNext}
              className="font-['Syne',sans-serif] font-bold text-[0.72rem] px-3 py-1 rounded-lg border-none bg-gradient-to-br from-[#f5c842] to-[#ff7c6e] text-[#0c0b13] cursor-pointer ml-2"
            >
              Next →
            </button>
          )}
          <button
            onClick={onBack}
            className="font-['Syne',sans-serif] font-bold text-[0.72rem] px-3 py-1 rounded-lg border-none bg-gradient-to-br from-[#f5c842] to-[#ff7c6e] text-[#0c0b13] cursor-pointer ml-1"
          >
            Menu
          </button>
        </div>
      )}

      {/* ── Tools ── */}
      {status === "playing" && (
        <div className="flex gap-2">
          <button
            onClick={togglePeek}
            className={`font-mono text-[0.7rem] font-bold px-3 py-1.5 rounded-lg border cursor-pointer transition-all ${
              showSol
                ? "border-[#a78bfa] text-[#a78bfa]"
                : "border-[#22203a] text-[#4a4860] hover:border-[#4a4860] hover:text-[#dddaea]"
            } bg-transparent`}
          >
            {showSol ? "▶ Resume" : "👁 Peek"}
          </button>
        </div>
      )}

      <p className="font-mono text-[0.66rem] text-[#3a3855] text-center max-w-[480px] leading-[1.65]">
        {filled}/{blankTotal} filled · tap blank cells to cycle {SUN} {MOON}
      </p>

      <MamboBoard
        grid={displayGrid}
        constraints={puzzle.constraints}
        size={puzzle.size}
        onCellClick={status === "playing" && !showSol ? handleCellClick : null}
        onEdgeClick={null}
        lockedCells={lockedCells}
        errorCells={showSol ? new Set() : errorCells}
        completedRows={showSol ? new Set() : completedRows}
        completedCols={showSol ? new Set() : completedCols}
      />
    </div>
  );
}
