/**
 * @file games/shikaku/ShikakuGrid.tsx
 *
 * Renders the interactive Shikaku puzzle grid with two modes:
 * - **Puzzle mode** – drag to create rectangles, visual ownership coloring.
 * - **Solver mode** – editable number inputs per cell for manual puzzle entry.
 */

import { ChangeEvent, FocusEvent, memo, useCallback, useMemo } from "react";
import { colorFromIndex, T } from "@/shared/components/ui/tokens";
import LogoIcon from "./Logo";
import { ShikakuPuzzle } from "../lib/generator";
import useResponsiveCellSize from "@/shared/hooks/useResponsiveCellSize";
import { useShikaku } from "./ShikakuContext";
import { RectInfo, userRect } from "../lib/types";
import { overlaps } from "../lib/utils";
import { checkShikakuAnchor } from "../lib/validation";
import {
  GridWrapper,
  GridCell,
  GridInputCell,
  CellRenderProps,
  CellCoord,
  DragPayload,
} from "@/shared/components/ui/Grid";
import { cellKey, coordToKey, useGrid } from "@/shared/hooks/useGrid";
import { clamp } from "@/shared/algorithms";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const GAP = 0;
const MIN_AREA = 2;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Deterministic hash of a string or number, used to derive a stable
 * color index from a rectangle's id.
 */
function hashString(input: string | number): number {
  if (typeof input === "number") return input;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Circular pip displayed inside anchor cells and the drag-preview overlay.
 * Shows the required area value for a region.
 */
const AnchorPip = memo(function AnchorPip({
  value,
  cellSize,
  color,
}: {
  value: number;
  cellSize: number;
  color?: { bg: string; text: string };
}) {
  return (
    <div
      className="rounded-full flex justify-center items-center font-bold pointer-events-none z-10"
      style={{
        width: cellSize * 0.64,
        height: cellSize * 0.64,
        color: color ? `hsl(${color.text})` : "#f1f5f9",
        background: color ? `hsl(${color.bg})` : "rgba(255,255,255,.16)",
        border: `2px solid ${color ? `hsl(${color.bg} / 0.9)` : "rgba(255,255,255,.35)"}`,
        fontSize: cellSize < 30 ? 7 : cellSize < 40 ? 10 : 13,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {value}
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────

/** Cell data shape derived from puzzle state, used by `PuzzleCell`. */
type CellData = {
  x: number;
  y: number;
  owner?: userRect;
  anchor?: ShikakuPuzzle["infos"][number];
  color?: ReturnType<typeof colorFromIndex>;
  valid?: boolean;
};

/**
 * A single cell in puzzle-play mode.
 * Renders ownership coloring, border logic, and the anchor pip when present.
 */
const PuzzleCell = memo(function PuzzleCell({
  coord,
  cellSize,
  data,
}: CellRenderProps & { data: CellData | undefined }) {
  const bT = !data?.owner || data.y === data.owner.y;
  const bB = !data?.owner || data.y === data.owner.y + data.owner.h - 1;
  const bL = !data?.owner || data.x === data.owner.x;
  const bR = !data?.owner || data.x === data.owner.x + data.owner.w - 1;

  const defaultBorder = "rgba(255,255,255,.07)";
  const activeBorder = data?.color
    ? `hsl(${data.color.bg} 0.88)`
    : defaultBorder;
  const inactiveBorder = `${data?.valid ? 0 : 1}px solid ${defaultBorder}`;

  return (
    <GridCell
      coord={coord}
      cellSize={cellSize}
      className="relative flex items-center justify-center box-border"
      style={{
        background: data?.color
          ? `hsl(${data.color.bg} / ${data.valid ? 1 : 0.2})`
          : undefined,
        borderTop: bT ? `2px solid ${activeBorder}` : inactiveBorder,
        borderBottom: bB ? `2px solid ${activeBorder}` : inactiveBorder,
        borderLeft: bL ? `2px solid ${activeBorder}` : inactiveBorder,
        borderRight: bR ? `2px solid ${activeBorder}` : inactiveBorder,
      }}
    >
      {data?.anchor && (
        <AnchorPip
          value={data.anchor.area}
          cellSize={cellSize}
          color={data.color}
        />
      )}
    </GridCell>
  );
});

// ─────────────────────────────────────────────────────────────────────────────

/**
 * A single cell in solver-input mode.
 * Controlled input that shows the stored area value and calls back on change
 * and blur. Defined outside the parent component to prevent remount on
 * every render.
 */
const SolverInputCell = memo(function SolverInputCell({
  coord,
  cellSize,
  infos,
  onCellChange,
  onCellBlur,
}: CellRenderProps & {
  infos?: RectInfo[];
  onCellChange: (e: ChangeEvent<HTMLInputElement>, coord: CellCoord) => void;
  onCellBlur: (e: FocusEvent<HTMLInputElement>, coord: CellCoord) => void;
}) {
  const existingInfo = infos?.find(
    (info) => info.anchor.x === coord.x && info.anchor.y === coord.y,
  );

  return (
    <GridInputCell
      type="number"
      coord={coord}
      cellSize={cellSize}
      value={existingInfo?.area ?? ""}
      onFocus={(e) => e.target.select()}
      onChange={(e) => onCellChange(e, coord)}
      onBlur={(e) => onCellBlur(e, coord)}
      className="relative flex items-center justify-center box-border border border-white/7"
    />
  );
});

// ─────────────────────────────────────────────────────────────────────────────

/** Shown when no puzzle has been generated yet. */
function EmptyGrid() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 w-full h-full">
      <LogoIcon size="2xl" />
      <p className="text-xs tracking-widest opacity-50 text-center">
        Select a difficulty and generate a puzzle
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `ShikakuGrid` — the interactive puzzle grid for the Shikaku game.
 *
 * Supports two rendering modes determined by `solverPuzzle`:
 * - **null** → puzzle-play mode with drag-to-select rectangles.
 * - **non-null** → solver-entry mode with number inputs per cell.
 *
 * Interaction (drag / pointer capture) is handled by `GridWrapper` and
 * `useGrid`; this component only wires the callbacks and derives display
 * data from context.
 */
export default function ShikakuGrid() {
  const { board, timer, isComplete } = useShikaku();
  const {
    puzzle,
    userRects,
    isSolutionVisible,
    solverSolution,
    attempt,
    solverPuzzle,
  } = board;
  const { elapsedTime, startTimer } = timer;

  // ── Dimensions ─────────────────────────────────────────────────────────────

  const activePuzzle = puzzle.value ?? solverPuzzle.value;

  const cellSize = useResponsiveCellSize({
    rows: activePuzzle?.height,
    cols: activePuzzle?.width,
  });

  const W = activePuzzle?.width ?? 0;
  const H = activePuzzle?.height ?? 0;

  // ── Rectangle source (solution or user rects) ───────────────────────────────

  const rects: userRect[] =
    isSolutionVisible.value && solverSolution.value
      ? solverSolution.value
      : userRects.value;

  const renderMode: "puzzle" | "solver-input" | "solution" =
    isSolutionVisible.value && solverSolution.value
      ? "solution"
      : solverPuzzle.value !== null
        ? "solver-input"
        : "puzzle";

  // ── Grid hook ───────────────────────────────────────────────────────────────

  const { persistRectSelection, setDragCoords, dragPreview } = useGrid({
    rows: puzzle.value?.height ?? 0,
    cols: puzzle.value?.width ?? 0,
  });

  const disabled = isSolutionVisible.value || isComplete;

  // ── Derived cell data map ───────────────────────────────────────────────────

  /**
   * Precomputed maps for O(1) lookup per cell during render:
   * - `cellOwnerMap`  – which rect owns each cell key
   * - `anchorMap`     – anchor info for cells that carry a clue
   * - `rectColorMap`  – stable color per rect id
   */
  const { cellOwnerMap, anchorMap, rectColorMap } = useMemo(() => {
    const cellOwnerMap = new Map<string, userRect>();
    const anchorMap = new Map<string, ShikakuPuzzle["infos"][number]>();
    const rectColorMap = new Map<
      string | number,
      ReturnType<typeof colorFromIndex>
    >();

    for (const r of rects) {
      rectColorMap.set(r.id, colorFromIndex(hashString(r.id)));
      for (let y = r.y; y < r.y + r.h; y++)
        for (let x = r.x; x < r.x + r.w; x++)
          cellOwnerMap.set(coordToKey(x, y), r);
    }

    const anchorSrc = puzzle.value ?? solverPuzzle.value;
    if (anchorSrc?.infos)
      for (const info of anchorSrc.infos)
        anchorMap.set(coordToKey(info.anchor.x, info.anchor.y), info);

    return { cellOwnerMap, anchorMap, rectColorMap };
  }, [rects, puzzle, solverPuzzle.value]);

  /**
   * Flat map of per-cell display data, rebuilt only when rects or puzzle
   * anchors change.
   */
  const cellsMap = useMemo(() => {
    type AnchorType = NonNullable<ShikakuPuzzle>["infos"][number];

    const map = new Map<
      string,
      {
        x: number;
        y: number;
        owner?: userRect;
        anchor?: AnchorType;
        color?: ReturnType<typeof colorFromIndex>;
        valid?: boolean;
      }
    >();

    const src = puzzle.value ?? solverPuzzle.value;
    if (!src?.height || !src?.width) return map;

    for (let y = 0; y < src.height; y++) {
      for (let x = 0; x < src.width; x++) {
        const key = coordToKey(x, y);
        const owner = cellOwnerMap.get(key);
        const anchor = anchorMap.get(key);
        map.set(key, {
          x,
          y,
          owner,
          anchor,
          color: owner ? rectColorMap.get(owner.id) : undefined,
          valid: owner ? owner.validAnchor : undefined,
        });
      }
    }

    return map;
  }, [puzzle, cellOwnerMap, anchorMap, rectColorMap, solverPuzzle.value]);

  // ── Solver grid handlers ────────────────────────────────────────────────────

  /**
   * Updates the solver puzzle's `infos` array with the raw typed value.
   * Clamp is intentionally deferred to `handleSolverGridBlur` so the user
   * can type multi-digit numbers without interruption.
   */
  const handleSolverGridChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>, coord: CellCoord) => {
      if (!solverPuzzle.value) return;

      const { width = 0 } = solverPuzzle.value;
      const value = Number(e.target.value) || 0;
      const uniqueId = coord.y * width + coord.x;

      const filteredInfos = (solverPuzzle.value.infos ?? []).filter(
        (item) => item.anchor.x !== coord.x || item.anchor.y !== coord.y,
      );

      // Remove entry when field is cleared.
      if (!value) {
        solverPuzzle.setValue({ ...solverPuzzle.value, infos: filteredInfos });
        return;
      }

      solverPuzzle.setValue({
        ...solverPuzzle.value,
        infos: [...filteredInfos, { id: uniqueId, area: value, anchor: coord }],
      });
    },
    [solverPuzzle],
  );

  /**
   * On blur, clamps the stored value to [MIN_AREA, width × height].
   * This keeps the input free-form while the user is typing.
   */
  const handleSolverGridBlur = useCallback(
    (e: FocusEvent<HTMLInputElement>, coord: CellCoord) => {
      if (!solverPuzzle.value) return;

      const { width = 0, height = 0 } = solverPuzzle.value;
      const value = Number(e.target.value) || 0;
      if (!value) return;

      const uniqueId = coord.y * width + coord.x;
      const finalValue = clamp(value, MIN_AREA, width * height);

      const filteredInfos = (solverPuzzle.value.infos ?? []).filter(
        (item) => item.anchor.x !== coord.x || item.anchor.y !== coord.y,
      );

      solverPuzzle.setValue({
        ...solverPuzzle.value,
        infos: [
          ...filteredInfos,
          { id: uniqueId, area: finalValue, anchor: coord },
        ],
      });
    },
    [solverPuzzle],
  );

  // ── GridWrapper callbacks ───────────────────────────────────────────────────

  const handlePointerDown = useCallback(
    (coord: CellCoord) => {
      if (renderMode !== "puzzle") return;
      if (!puzzle.value || isComplete) return;
      if (elapsedTime === 0) startTimer();
      setDragCoords(coord, coord);
    },
    [
      puzzle.value,
      isComplete,
      elapsedTime,
      startTimer,
      setDragCoords,
      renderMode,
    ],
  );

  const handleDrag = useCallback(
    (payload: DragPayload) => {
      if (payload.mode !== "rect" || renderMode !== "puzzle") return;
      setDragCoords(payload.startCoord, payload.currentCoord);
    },
    [setDragCoords, renderMode],
  );

  const handleDragEnd = useCallback(
    (payload: DragPayload) => {
      if (payload.mode !== "rect" || solverPuzzle.value !== null) return;
      const { startCoord, currentCoord } = payload;

      persistRectSelection();

      const dr = {
        x: Math.min(startCoord.x, currentCoord.x),
        y: Math.min(startCoord.y, currentCoord.y),
        w: Math.abs(currentCoord.x - startCoord.x) + 1,
        h: Math.abs(currentCoord.y - startCoord.y) + 1,
      };

      // Capture next id before the async state update so `newRect` uses the
      // correct value (avoids stale-closure bug with `attempt.value`).
      const nextAttempt = attempt.value + 1;
      attempt.setValue(nextAttempt);

      const pzl = puzzle.value!;
      userRects.setValue((prev) => {
        const next = prev.filter((r) => !overlaps(r, dr));
        if (dr.w * dr.h === 1) return next; // single-cell drag → no rect
        const newRect: userRect = { id: attempt.value, ...dr };
        newRect.validAnchor = checkShikakuAnchor(newRect, pzl);
        return [...next, newRect];
      });
    },
    [
      solverPuzzle.value,
      persistRectSelection,
      attempt,
      puzzle.value,
      userRects,
    ],
  );

  // ── Render cell factories ───────────────────────────────────────────────────

  /**
   * Renders a puzzle-play cell. Reads from `cellsMap` for O(1) lookup.
   * Defined as a stable `useCallback` so `GridWrapper` can memoize cells.
   */
  const renderPuzzleCell = useCallback(
    ({ coord, cellSize }: CellRenderProps) => (
      <PuzzleCell
        coord={coord}
        cellSize={cellSize}
        data={cellsMap.get(cellKey(coord))}
      />
    ),
    [cellsMap],
  );

  /**
   * Renders a solver-entry cell with a controlled number input.
   * `handleSolverGridChange` and `handleSolverGridBlur` are stable
   * `useCallback` refs so `SolverInputCell` does not remount on re-render.
   */
  const renderSolverCell = useCallback(
    ({ coord, cellSize }: CellRenderProps) => (
      <SolverInputCell
        coord={coord}
        cellSize={cellSize}
        infos={solverPuzzle.value?.infos}
        onCellChange={handleSolverGridChange}
        onCellBlur={handleSolverGridBlur}
      />
    ),
    [solverPuzzle.value?.infos, handleSolverGridChange, handleSolverGridBlur],
  );

  // ── Early return ────────────────────────────────────────────────────────────

  if (!activePuzzle) return <EmptyGrid />;

  // ── Drag preview color (stable across drag) ─────────────────────────────────

  const dragColor = colorFromIndex(attempt.value);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="relative inline-block">
      <GridWrapper
        rows={H}
        cols={W}
        cellSize={cellSize}
        gap={GAP}
        dragMode="rect"
        disabled={
          renderMode !== "puzzle" || isComplete || isSolutionVisible.value
        }
        style={{
          border: `1.5px solid ${T.border2}`,
          cursor: disabled ? "default" : "crosshair",
          background: T.bg2,
        }}
        onPointerDown={handlePointerDown}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        renderCell={
          renderMode === "solver-input" ? renderSolverCell : renderPuzzleCell
        }
      />

      {/* Drag-selection overlay — rendered once over the grid, not per cell */}
      {dragPreview && (
        <div
          className="absolute rounded-sm pointer-events-none z-10 flex justify-center items-center"
          style={{
            left: dragPreview.x * cellSize,
            top: dragPreview.y * cellSize,
            width: dragPreview.w * cellSize,
            height: dragPreview.h * cellSize,
            border: `1px solid hsl(${dragColor.bg} / 0.2)`,
            backgroundColor: `hsl(${dragColor.bg} / 0.2)`,
          }}
        >
          <AnchorPip
            value={dragPreview.w * dragPreview.h}
            cellSize={cellSize}
            color={dragColor}
          />
        </div>
      )}
    </div>
  );
}
