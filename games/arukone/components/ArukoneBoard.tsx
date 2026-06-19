"use client";

import { ChangeEvent, useCallback, useMemo } from "react";
import { useArukone } from "../hooks/ArukoneContext";
import {
  EmptyGrid,
  GridWrapper,
  SwapPathOverlay,
  GridCell,
  GridInputCell,
  CellRenderProps,
  CellCoord,
  GapRenderProps,
  DragPayload,
} from "@/shared/components/ui/Grid";
import { meta } from "..";
import useResponsiveCellSize from "@/shared/hooks/useResponsiveCellSize";
import { cellKey, coordToKey } from "@/shared/hooks/useGrid";
import { colorId } from "@/shared/components/ui/tokens";
import { cn } from "@/shared/utils/cn";

export default function ArukonesBoard() {
  const { board, timer, solver, generator } = useArukone();

  const activePuzzle = generator.isSolver
    ? board.customPuzzle?.value
    : board.puzzle?.value;

  const activeWallSet = generator.isSolver
    ? board.customWallSet
    : board.wallSet;

  const rows = activePuzzle?.rows ?? 0;
  const cols = activePuzzle?.cols ?? 0;

  const { cellSize, gap: GAP } = useResponsiveCellSize({
    rows,
    cols,
    gapRatio: generator.isSolver ? 0.15 : 0.05,
  });

  // Use useMemo to prevent unnecessary recalculations of grid dimensions
  const dimensions = useMemo(
    () => ({
      width: cols * cellSize + (cols - 1) * GAP,
      height: rows * cellSize + (rows - 1) * GAP,
    }),
    [cols, rows, cellSize, GAP],
  );

  // =================================
  // # Action Handlers
  // =================================
  const pointerHandlers = {
    onPointerDown: (coord: CellCoord) => {
      if (generator.isSolver) return;
      if (timer.elapsedTime === 0) timer.startTimer();
      board.pointerHandlers.onPointerDown(coord);
    },
    onDragStart: (payload: DragPayload) => {
      if (generator.isSolver) return;
      board.pointerHandlers.onDragStart(payload);
    },
    onDrag: (payload: DragPayload) => {
      if (generator.isSolver) return;
      board.pointerHandlers.onDrag(payload);
    },
    onDragEnd: (payload: DragPayload) => {
      if (generator.isSolver) return;
      board.pointerHandlers.onDragEnd(payload);
    },
  };

  /**
   * Updates the solver puzzle's `infos` array with the raw typed value.
   * Clamp is intentionally deferred to `handleSolverGridBlur` so the user
   * can type multi-digit numbers without interruption.
   */
  const onChangeSolver = useCallback(
    (e: ChangeEvent<HTMLInputElement>, coord: CellCoord) => {
      const prevPuzzle = board.customPuzzle.value;
      if (!prevPuzzle) return;

      const { grid = {} } = prevPuzzle;
      const key = coordToKey(coord.x, coord.y);
      const raw = e.target.value;

      const newGrid =
        raw === ""
          ? Object.fromEntries(Object.entries(grid).filter(([k]) => k !== key))
          : { ...grid, [key]: raw };

      board.customPuzzle.setValue({ ...prevPuzzle, grid: newGrid });
    },
    [board.customPuzzle],
  );

  const onToggleWall = useCallback(
    (gap: { x: number; y: number; edge: "h" | "v" }) => {
      const prev = board.customPuzzle.value;
      if (!prev) return;

      const r1 = gap.y;
      const c1 = gap.x;
      const r2 = gap.edge === "h" ? gap.y + 1 : gap.y;
      const c2 = gap.edge === "v" ? gap.x + 1 : gap.x;

      // const wallKey = `${r1}-${c1}-${r2}-${c2}`;
      const walls = prev.walls ?? [];
      const exists = walls.some(
        (w) =>
          (w.r1 === r1 && w.c1 === c1 && w.r2 === r2 && w.c2 === c2) ||
          (w.r1 === r2 && w.c1 === c2 && w.r2 === r1 && w.c2 === c1),
      );

      const newWalls = exists
        ? walls.filter(
            (w) =>
              !(w.r1 === r1 && w.c1 === c1 && w.r2 === r2 && w.c2 === c2) &&
              !(w.r1 === r2 && w.c1 === c2 && w.r2 === r1 && w.c2 === c1),
          )
        : [...walls, { r1, c1, r2, c2 }];

      board.customPuzzle.setValue({ ...prev, walls: newWalls });
    },
    [board.customPuzzle],
  );

  // =================================
  // # Rendering
  // =================================
  const renderSwapCell = useCallback(
    ({ coord, cellSize }: CellRenderProps) => {
      const k = cellKey(coord);
      const val = board.puzzle.value?.grid?.[k];
      const solutionPath = board.puzzle.value?.solutionPath;
      const isFirst = solutionPath ? k === solutionPath[0] : false;
      const isLast = solutionPath
        ? k === solutionPath[solutionPath.length - 1]
        : false;

      return (
        <GridCell
          coord={coord}
          cellSize={cellSize}
          className="border border-zinc-500/50 bg-slate-500/20 relative"
          style={{
            borderRadius: 2,
            background: isFirst || isLast ? colorId(k).hex : undefined,
          }}
        >
          {val && (
            <span
              className="absolute z-40 rounded-full bg-slate-500/20 aspect-square grid place-items-center top-1/2 left-1/2 -translate-1/2"
              style={{
                width: cellSize * 0.7,
                height: cellSize * 0.7,
              }}
            >
              {val}
            </span>
          )}
        </GridCell>
      );
    },
    [board.puzzle.value?.grid, board.puzzle.value?.solutionPath], // Pastikan dependensi sinkron
  );

  const renderSolverCell = useCallback(
    ({ coord, cellSize }: CellRenderProps) => {
      const k = cellKey(coord);
      const val = board.customPuzzle.value?.grid?.[k] ?? "";

      return (
        <GridInputCell
          type="number"
          coord={coord}
          cellSize={cellSize}
          value={val}
          onFocus={(e) => e.target.select()}
          onChange={(e) => onChangeSolver(e, coord)}
          onPointerDown={(e) => e.stopPropagation()}
          className="border border-zinc-500/50 bg-slate-500/20 w-full h-full"
          style={{ borderRadius: 2 }}
        />
      );
    },
    [board.customPuzzle.value?.grid, onChangeSolver],
  );

  const renderGap = useCallback(
    ({ gap, gapSize }: GapRenderProps) => {
      const r1 = gap.y;
      const c1 = gap.x;
      const r2 = gap.edge === "h" ? gap.y + 1 : gap.y;
      const c2 = gap.edge === "v" ? gap.x + 1 : gap.x;
      const hasWall = activeWallSet.has(`${r1}-${c1}-${r2}-${c2}`);

      if (generator.isSolver) {
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleWall(gap);
            }}
            className={cn(
              "w-full h-full transition-colors rounded-full cursor-pointer",
              hasWall && "bg-amber-500",
            )}
            onPointerEnter={(e) => {
              e.currentTarget.style.backgroundColor = !hasWall
                ? "color-mix(in oklab, var(--color-amber-500) 20%, transparent)"
                : "var(--color-amber-500)";
            }}
            onPointerLeave={(e) => {
              e.currentTarget.style.backgroundColor = !hasWall
                ? "transparent"
                : "var(--color-amber-500)";
            }}
          />
        );
      }

      return (
        <div
          className="rounded-full"
          style={{
            backgroundColor: hasWall ? "var(--color-amber-500)" : "transparent",
            width: gap.edge === "v" ? gapSize * 0.5 : "100%",
            height: gap.edge === "h" ? gapSize * 0.5 : "100%",
          }}
        />
      );
    },
    [activeWallSet, generator.isSolver, onToggleWall],
  );

  // =================================
  // # Fallback
  // =================================
  if (!activePuzzle) return <EmptyGrid logo={meta.icon} name={meta.name} />;

  // console.log(board.puzzle.value);
  return (
    <div
      className={`flex flex-1 flex-col items-center justify-center gap-4 w-full h-full p-4 overflow-hidden relative ${generator.isSolver ? "" : "select-none"}`}
    >
      <div
        className="relative"
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        <GridWrapper
          rows={rows}
          cols={cols}
          cellSize={cellSize}
          gap={GAP}
          dragMode="cell"
          renderCell={generator.isSolver ? renderSolverCell : renderSwapCell}
          renderGap={renderGap}
          {...pointerHandlers}
        />
        <SwapPathOverlay
          segments={board.swapSegments}
          cellSize={cellSize}
          gap={GAP}
          thickness={0.6}
        />
        {solver.isVisible.value && solver.swapSegments.length !== 0 && (
          <SwapPathOverlay
            segments={solver.swapSegments}
            cellSize={cellSize}
            gap={GAP}
            thickness={0.1}
          />
        )}
      </div>
    </div>
  );
}
