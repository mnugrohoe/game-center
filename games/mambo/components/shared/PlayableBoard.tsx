"use client";
/**
 * games/mambo/components/shared/PlayableBoard.tsx
 * Refactored to use shared WinBanner, GhostButton, StatusChip.
 * Mambo's own accent color is applied via inline style only on the
 * few elements that need the dynamic tier color.
 */
import type { MamboPuzzle } from "../../types";
import { DIFF_TIERS }       from "../../lib/difficulty";
import { useMamboBoard }    from "../../hooks/useMamboBoard";
import { useErrorCells }    from "../../hooks/useErrorCells";
import { MamboBoard }       from "./MamboBoard";
import { WinBanner, GhostButton, StatusChip, ActionButton } from "@/shared/components";

function fmt(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2,"0")}:${String(s % 60).padStart(2,"0")}`;
}

interface PlayableBoardProps {
  puzzle:      MamboPuzzle;
  onBack:      () => void;
  sourceLabel: string;
  onNext?:     () => void;
}

export function PlayableBoard({ puzzle, onBack, sourceLabel, onNext }: PlayableBoardProps) {
  const { userGrid, status, elapsed, showSol, handleCellClick, togglePeek } =
    useMamboBoard(puzzle);

  const { errorCells, completedRows, completedCols } = useErrorCells(
    userGrid, puzzle, status === "playing",
  );

  const lockedCells = new Set(
    puzzle.puzzle.flatMap((row, r) =>
      row.map((v, c) => (v ? r * puzzle.size + c : -1)).filter((i) => i >= 0),
    ),
  );

  const diff       = DIFF_TIERS[puzzle.diffId];
  const blankTotal = puzzle.puzzle.flat().filter((v) => !v).length;
  const filled     = userGrid.flat().filter((v, i) => v && !puzzle.puzzle.flat()[i]).length;
  const levelNum   = puzzle.levelNum ?? 1;
  const displayGrid = showSol ? puzzle.solution : userGrid;

  return (
    <div className="flex flex-col items-center gap-3.5 w-full px-4 py-6">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between w-full gap-2 flex-wrap">
        <GhostButton onClick={onBack}>
          ← {sourceLabel}
        </GhostButton>

        <div className="flex items-center gap-2">
          <span className="font-ui text-[1rem] font-semibold tracking-[0.03em]" style={{ color: diff.color }}>
            {diff.name}
          </span>
          <StatusChip variant="ghost" className="text-[0.6rem] font-bold" style={{ color: diff.color, borderColor: diff.dim }}>
            #{levelNum}
          </StatusChip>
          <StatusChip variant="ghost">
            {puzzle.size}×{puzzle.size}
          </StatusChip>
        </div>

        <span className={[
          "font-mono text-[0.95rem] font-bold min-w-[50px] text-right",
          status === "won" ? "text-ok" : "text-secondary",
        ].join(" ")}>
          {status === "won" ? "✓ " : ""}{fmt(elapsed)}
        </span>
      </div>

      {/* ── Progress bar ── */}
      {status === "playing" && (
        <div className="w-full max-w-[500px] h-[3px] bg-raised rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-[width_0.3s_ease]"
            style={{
              width:      blankTotal ? `${Math.round((filled / blankTotal) * 100)}%` : "0%",
              background: diff.color,
            }}
          />
        </div>
      )}

      {/* ── Win banner ── */}
      {status === "won" && (
        <WinBanner
          detail={`Solved in ${fmt(elapsed)}`}
          actions={
            <>
              {onNext && (
                <ActionButton onClick={onNext} className="text-[0.72rem] px-3 py-1.5">
                  Next →
                </ActionButton>
              )}
              <GhostButton onClick={onBack}>Menu</GhostButton>
            </>
          }
        />
      )}

      {/* ── Peek toggle ── */}
      {status === "playing" && (
        <GhostButton
          onClick={togglePeek}
          className={showSol ? "border-secondary text-secondary" : ""}
        >
          {showSol ? "▶ Resume" : "👁 Peek"}
        </GhostButton>
      )}

      <p className="font-mono text-[0.65rem] text-muted text-center">
        {filled}/{blankTotal} filled · tap cells to cycle ☀ ◑
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
