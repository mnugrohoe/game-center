"use client";

import { useMemo, useRef, useCallback } from "react";
import {
  FaEraser,
  FaQuestion,
  FaRegCopy,
  FaXmark,
  FaArrowTurnDown,
} from "react-icons/fa6";

import {
  GridWrapper,
  GridCell,
  CellRenderProps,
  DragPayload,
  EmptyGrid,
  CellCoord,
} from "@/shared/components/ui/Grid";
import { Divider } from "@/shared/components/ui/primitive";
import { useTower } from "../hooks/TowerContext";
import TowerLogo from "./Logo";
import { colorId } from "@/shared/components/ui/tokens";

// ── Configuration ───────────────────────────────────────────────────────────
const GAP = 8;
const CELL_SIZE = 32;

// ── Primitive Sub-Components ─────────────────────────────────────────────────

interface ColorPegProps {
  value: number;
  size?: string;
}

function ColorPeg({ value, size = "h-6 w-6" }: ColorPegProps) {
  const bgStyle =
    value >= 0 ? `hsl(${colorId(value).bg})` : "rgba(30, 41, 59, 0.5)";

  return (
    <div
      className={`rounded-full transition-all duration-200 shadow-inner border border-white/5 flex-shrink-0 ${size}`}
      style={{ backgroundColor: bgStyle }}
    />
  );
}

function HiddenPeg({ failed = false }: { failed?: boolean }) {
  return (
    <div
      className={`rounded-full h-6 w-6 flex items-center justify-center border transition-colors duration-200 flex-shrink-0 ${
        failed
          ? "bg-red-950/40 border-red-500/30 text-red-400"
          : "bg-slate-800/60 border-slate-700/50 text-slate-500"
      }`}
    >
      {failed ? (
        <FaXmark className="w-3 h-3" />
      ) : (
        <FaQuestion className="w-3 h-3" />
      )}
    </div>
  );
}

function FeedbackDots({
  correct,
  misplaced,
}: {
  correct: number;
  misplaced: number;
}) {
  return (
    <div className="grid grid-rows-2 grid-flow-col gap-1 bg-slate-950/40 p-1.5 rounded border border-slate-800/40 min-w-8 min-h-8 place-content-center">
      {Array.from({ length: correct }).map((_, i) => (
        <div
          key={`c-${i}`}
          className="rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.4)]"
        />
      ))}
      {Array.from({ length: misplaced }).map((_, i) => (
        <div
          key={`m-${i}`}
          className="rounded-full h-2 w-2 bg-transparent border-2 border-amber-400/80"
        />
      ))}
    </div>
  );
}

// ── Structural Layout Components ───────────────────────────────────────────

interface TargetSequenceStripProps {
  targetLength: number;
  isComplete: boolean;
  isFailed: boolean;
  targetSequence: number[];
  revealedHints?: (number | null)[];
}

function TargetSequenceStrip({
  targetLength,
  isComplete,
  isFailed,
  targetSequence,
  revealedHints,
}: TargetSequenceStripProps) {
  return (
    <div className="w-full max-w-md flex flex-col items-center gap-2 bg-slate-950/30 p-3 rounded-lg border border-slate-800/50 backdrop-blur-sm">
      <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
        Objective Target Sequence
      </span>
      <div className="flex gap-3 items-center justify-center">
        {Array.from({ length: targetLength }).map((_, index) => {
          const hintValue = revealedHints?.[index];

          if (isComplete) {
            return (
              <ColorPeg
                key={index}
                value={targetSequence[index]}
                size="h-7 w-7"
              />
            );
          }
          if (
            hintValue !== undefined &&
            hintValue !== null &&
            hintValue !== -1
          ) {
            return <ColorPeg key={index} value={hintValue} size="h-7 w-7" />;
          }
          return <HiddenPeg key={index} failed={isFailed} />;
        })}
      </div>
    </div>
  );
}

interface AttemptRowChannelProps {
  rowIndex: number;
  sequence: number[];
  feedback: { correct: number; misplaced: number };
  currentAttemptIdx: number;
  targetLength: number;
  onCopyRow: (seq: number[]) => void;
  onClearRow: () => void;
  onEraseCell: (coord: CellCoord) => void;
  onSubmitGuess: () => void;
  onSwapCells: (startCoord: CellCoord, endCoord: CellCoord) => void;
}

function AttemptRowChannel({
  rowIndex,
  sequence,
  feedback,
  currentAttemptIdx,
  targetLength,
  onCopyRow,
  onClearRow,
  onEraseCell,
  onSubmitGuess,
  onSwapCells,
}: AttemptRowChannelProps) {
  const isCurrentActiveRow = currentAttemptIdx === rowIndex;
  const isPastSubmittedRow = currentAttemptIdx > rowIndex;
  const isRowFilled = sequence.every((v) => v !== -1);

  // Tracker deteksi pergerakan pointer drag
  const isDraggingInternalRef = useRef(false);
  const dragStartCoordRef = useRef<CellCoord | null>(null);

  const renderCell = useCallback(
    ({ coord, cellSize }: CellRenderProps) => {
      const cellValue = sequence[coord.x];
      const bgStyle =
        cellValue >= 0
          ? `hsl(${colorId(cellValue).bg})`
          : "rgba(30, 41, 59, 0.5)";

      return (
        <GridCell
          coord={coord}
          cellSize={cellSize}
          className={`rounded-full transition-all duration-150 shadow-inner border border-white/5 flex items-center justify-center ${
            isCurrentActiveRow && cellValue !== -1
              ? "cursor-grab active:cursor-grabbing hover:scale-105 active:scale-95"
              : "cursor-default"
          }`}
          style={{ backgroundColor: bgStyle }}
        />
      );
    },
    [sequence, isCurrentActiveRow],
  );

  return (
    <div
      className={`flex items-center justify-between gap-4 p-2 rounded-lg border transition-all duration-200 ${
        isCurrentActiveRow
          ? "bg-white/[0.04] border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.05)]"
          : "bg-transparent border-transparent opacity-75 hover:opacity-100"
      }`}
    >
      {/* Left Action Anchor */}
      <div className="w-10 flex justify-end">
        {isPastSubmittedRow && (
          <button
            onClick={() => onCopyRow(sequence)}
            className="p-1.5 rounded bg-slate-800/40 border border-slate-700/30 text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-all cursor-pointer"
            title="Copy arrangement to workspace"
          >
            <FaRegCopy className="w-3.5 h-3.5" />
          </button>
        )}
        {isCurrentActiveRow && (
          <button
            onClick={onClearRow}
            className="p-1.5 rounded bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all cursor-pointer"
            title="Wipe active row"
          >
            <FaEraser className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Grid Channel Blocks via GridWrapper */}
      <div className="flex-1 flex justify-center">
        <GridWrapper
          rows={1}
          cols={targetLength}
          cellSize={CELL_SIZE}
          gap={GAP}
          dragMode="rect"
          disabled={!isCurrentActiveRow}
          renderCell={renderCell}
          onPointerDown={(coord) => {
            if (!isCurrentActiveRow) return;
            isDraggingInternalRef.current = false;
            dragStartCoordRef.current = { x: coord.x, y: rowIndex };
          }}
          onDrag={() => {
            isDraggingInternalRef.current = true;
          }}
          onDragEnd={(payload: DragPayload) => {
            if (
              !isCurrentActiveRow ||
              !payload.currentCoord ||
              !dragStartCoordRef.current
            )
              return;

            const startCoordWithY = dragStartCoordRef.current;
            const currentCoordWithY = {
              x: payload.currentCoord.x,
              y: rowIndex,
            };

            if (startCoordWithY.x !== currentCoordWithY.x) {
              isDraggingInternalRef.current = true;
              onSwapCells(startCoordWithY, currentCoordWithY);
            }

            // Bersihkan ref setelah drag selesai
            dragStartCoordRef.current = null;
          }}
          onClick={(coord) => {
            if (!isCurrentActiveRow) return;

            if (isDraggingInternalRef.current) {
              isDraggingInternalRef.current = false;
              return;
            }

            if (sequence[coord.x] !== -1) {
              onEraseCell({ x: coord.x, y: rowIndex });
            }
          }}
        />
      </div>

      {/* Right Action Matrix Anchor */}
      <div className="w-12 flex justify-start">
        {isCurrentActiveRow && (
          <button
            onClick={onSubmitGuess}
            disabled={!isRowFilled}
            className={`p-1.5 rounded border flex items-center justify-center transition-all duration-200 ${
              isRowFilled
                ? "bg-amber-500/20 border-amber-500 text-amber-400 hover:bg-amber-500 hover:text-slate-950 cursor-pointer shadow-[0_0_8px_rgba(245,158,11,0.2)]"
                : "bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed"
            }`}
          >
            <FaArrowTurnDown className="w-3.5 h-3.5 rotate-90" />
          </button>
        )}
        {isPastSubmittedRow && (
          <FeedbackDots
            correct={feedback.correct}
            misplaced={feedback.misplaced}
          />
        )}
      </div>
    </div>
  );
}

interface ColorPaletteDeckProps {
  uniqueColors: number;
  isComplete: boolean;
  isFailed: boolean;
  board: ReturnType<typeof useTower>["board"];
  timer: ReturnType<typeof useTower>["timer"];
}

function ColorPaletteDeck({
  uniqueColors,
  isComplete,
  isFailed,
  board,
  timer,
}: ColorPaletteDeckProps) {
  return (
    <div className="w-full max-w-md flex items-center justify-center gap-4 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 backdrop-blur-md">
      <div className="flex gap-2 items-center flex-1 justify-center">
        {Array.from({ length: uniqueColors }).map((_, index) => {
          const colorIdToken = index;
          return (
            <button
              key={index}
              onClick={() => {
                if (timer.elapsedTime === 0) timer.startTimer();
                board.placeColor(colorIdToken);
              }}
              disabled={isComplete || isFailed}
              className="focus:outline-none cursor-pointer transform hover:scale-110 active:scale-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <ColorPeg value={colorIdToken} size="h-8 w-8" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Component orchestration entry point ─────────────────────────────────

export default function TowerBoard() {
  const { board, timer, isComplete } = useTower();
  const { puzzle, playState } = board;

  const puzzleData = puzzle.value;

  const targetLength = puzzleData?.targetSequence?.length ?? 4;
  const maxAttempts = targetLength * 2;

  const currentAttemptIdx = board.getCurrentAttemptIdx();
  const isFailed = currentAttemptIdx >= maxAttempts && !isComplete;

  const displayRows = useMemo(() => {
    if (!puzzleData) return [];

    const rows = Array.from({ length: maxAttempts }, (_, rowIndex) => {
      const liveRowState = playState.value[rowIndex];
      return {
        rowIndex,
        sequence: liveRowState?.sequence ?? Array(targetLength).fill(-1),
        submitted: liveRowState?.submitted ?? false,
        feedback: liveRowState?.feedback ?? { correct: 0, misplaced: 0 },
      };
    });

    return rows.reverse();
  }, [puzzleData, playState.value, targetLength, maxAttempts]);

  if (!puzzleData) {
    return <EmptyGrid logo={TowerLogo} name="Tower Sequence" />;
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-between w-full h-full p-6 overflow-hidden select-none bg-slate-900/40 text-slate-100 font-mono">
      {/* Top Strip Area */}
      <TargetSequenceStrip
        targetLength={targetLength}
        isComplete={isComplete}
        isFailed={isFailed}
        targetSequence={puzzleData.targetSequence}
        revealedHints={board.revealedHints}
      />

      <Divider
        style={{
          height: "1px",
          width: "100%",
          backgroundColor: "rgba(51, 65, 85, 0.3)",
          margin: "16px 0",
        }}
      />

      {/* Main Grid Scroll Channel Stack */}
      <div className="flex-1 w-full max-w-md overflow-y-auto pr-1 flex flex-col gap-2 scrollbar-thin scrollbar-thumb-slate-800">
        {displayRows.map(({ rowIndex, sequence, feedback }) => (
          <AttemptRowChannel
            key={rowIndex}
            rowIndex={rowIndex}
            sequence={sequence}
            feedback={feedback}
            currentAttemptIdx={currentAttemptIdx}
            targetLength={targetLength}
            onCopyRow={board.copyHistoryRow}
            onClearRow={board.clearRow}
            onEraseCell={board.eraseCell}
            onSubmitGuess={board.submitGuess}
            onSwapCells={board.swapCells}
          />
        ))}
      </div>

      <Divider
        style={{
          height: "1px",
          width: "100%",
          backgroundColor: "rgba(51, 65, 85, 0.3)",
          margin: "16px 0",
        }}
      />

      {/* Bottom Interactive Control Deck */}
      <ColorPaletteDeck
        uniqueColors={puzzleData.params.uniqueColors}
        {...{ isComplete, isFailed, board, timer }}
      />
    </div>
  );
}
