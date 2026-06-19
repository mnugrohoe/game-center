/**
 * @file games/kings/KingsBoard.tsx
 *
 * Interactive Kings puzzle board with two modes:
 *
 * ### Play mode  (`isSolver === false`)
 * - Left-click       → cycle: empty → marker → king → empty
 * - Double-click     → place king (skips marker step)
 * - Right-click      → place king (skips marker step)
 * - Left-drag        → paint markers (start empty) or erase (start marked)
 *
 * ### Solver / painter mode  (`isSolver === true`)
 * - Left-click/drag  → paint selected region index onto cells
 * - Right-click      → erase cell back to blank canvas
 */

"use client";

import React, { memo, useCallback, useMemo, useRef, useState } from "react";
import {
  CellCoord,
  CellRenderProps,
  DragPayload,
  EmptyGrid,
  GridCell,
  GridWrapper,
} from "@/shared/components/ui/Grid";
import { coordToKey } from "@/shared/hooks/useGrid";
import useResponsiveCellSize from "@/shared/hooks/useResponsiveCellSize";
import { colorId, T } from "@/shared/components/ui/tokens";
import {
  BLANK_CANVAS_STATE,
  coordsToGrid,
  EMPTY_CELL_STATE,
  KING_CELL_STATE,
  MARKER_CELL_STATE,
  MARKER_DOTS,
  MARKER_KINGS,
  validateRegions,
} from "../lib";
import KingsLogo from "./Logo";
import { KingBoardCellState } from "../types";
import { useKings } from "./KingsContext";
import { StateProp } from "@/shared/types";

// ─────────────────────────────────────────────────────────────────────────────
// Pure helpers
// ─────────────────────────────────────────────────────────────────────────────

const KINGS_GRID_ID = "KingsGrid";

/** Immutably set one cell in the 2-D moves grid. */
function setGridValue(
  grid: StateProp<KingBoardCellState[][]>,
  { x, y }: CellCoord,
  val: KingBoardCellState,
) {
  grid.setValue((prev) => {
    const next = [...prev];
    next[y] = [...(next[y] ?? [])];
    next[y][x] = val;
    return next;
  });
}

/** Next play-mode cycle state: empty → marker → king → empty. */
function nextPlayState(current: KingBoardCellState): KingBoardCellState {
  if (current === EMPTY_CELL_STATE) return MARKER_CELL_STATE;
  if (current === MARKER_CELL_STATE) return KING_CELL_STATE;
  return EMPTY_CELL_STATE;
}

// ─────────────────────────────────────────────────────────────────────────────
// KingsCell
// ─────────────────────────────────────────────────────────────────────────────

interface KingsCellProps extends CellRenderProps {
  bgColor?: ReturnType<typeof colorId>;
  move: KingBoardCellState;
  isLocked: boolean;
}

const KingsCell = memo(function KingsCell({
  coord,
  cellSize,
  bgColor,
  move,
  isLocked,
}: KingsCellProps) {
  return (
    <GridCell
      coord={coord}
      cellSize={cellSize}
      className="border transition-colors duration-75"
      style={{
        borderColor: T.border2,
        background: bgColor ? `hsl(${bgColor.bg} / 0.65)` : "transparent",
      }}
    >
      <div
        className="w-full h-full flex items-center justify-center"
        style={{ fontSize: Math.floor(cellSize * 0.55), userSelect: "none" }}
      >
        {(move === MARKER_CELL_STATE || isLocked) && MARKER_DOTS}
        {move === KING_CELL_STATE && MARKER_KINGS}
      </div>
    </GridCell>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// RegionPalette
// ─────────────────────────────────────────────────────────────────────────────

interface RegionPaletteProps {
  regionCount: number;
  activeIndex: number;
  onSelect: (index: number) => void;
}

const RegionPalette = memo(function RegionPalette({
  regionCount,
  activeIndex,
  onSelect,
}: RegionPaletteProps) {
  return (
    <div className="flex gap-2 justify-center flex-wrap">
      {Array.from({ length: regionCount }, (_, i) => {
        const active = activeIndex === i;
        const token = colorId(i);
        return (
          <button
            key={i}
            title={`Region ${i}`}
            className="w-6 h-6 border cursor-pointer text-xs font-bold rounded-sm flex items-center justify-center transition-opacity duration-75"
            style={{
              background: `hsl(${token.bg} / ${active ? "0.85" : "0.3"})`,
              borderColor: `hsl(${token.bg} / ${active ? "1" : "0.5"})`,
              color: `hsl(${token.text} / ${active ? "0.85" : "0.3"})`,
            }}
            onClick={() => onSelect(i)}
          >
            {i}
          </button>
        );
      })}
      <button
        title="Erase region assignment"
        className="px-2 h-6 border cursor-pointer text-[10px] font-bold rounded-sm flex items-center justify-center"
        style={{
          background: activeIndex === -1 ? "rgba(0,0,0,0.2)" : "transparent",
          borderColor: T.border2,
          color: T.text2,
        }}
        onClick={() => onSelect(-1)}
      >
        Erase
      </button>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// KingsBoard
// ─────────────────────────────────────────────────────────────────────────────

export default function KingsBoard() {
  const { board, generator, timer, solver } = useKings();
  const { isSolver } = generator;
  const { puzzle, customPuzzle } = board;
  const { solution } = solver;
  const activePuzzle = isSolver ? customPuzzle.value : puzzle.value;
  const [validateRegMsg, setValidateRegMsg] = useState<string | null>(null);

  const N = activePuzzle?.size ?? 0;

  // ── Painter state ────────────────────────────────────────────────────────
  const [activeRegionIndex, setActiveRegionIndex] = useState(0);

  const { cellSize } = useResponsiveCellSize({
    rows: N,
    cols: N,
    mode: "fill",
    containerId: KINGS_GRID_ID,
  });

  const moves: KingBoardCellState[][] = useMemo(
    () =>
      solver.isVisible.value && solution.value
        ? (coordsToGrid(N, solution.value) ?? [])
        : (board.playState.value ?? []),
    [solver.isVisible.value, solution.value, board.playState, N],
  );

  // ── Drag control refs (no re-render on change) ───────────────────────────
  /**
   * Lock mode for the current drag stroke:
   * - `null`              → no active drag
   * - `MARKER_CELL_STATE` → painting markers
   * - `EMPTY_CELL_STATE`  → erasing markers
   */
  const dragLockRef = useRef<KingBoardCellState | null>(null);
  /** True when pointerDown already mutated state; suppresses synthetic click. */
  const didPaintOnDownRef = useRef(false);
  /** True when drag moved beyond the start cell; suppresses trailing click. */
  const didDragRef = useRef(false);

  // ── Derived: locked keys ─────────────────────────────────────────────────
  /**
   * Set of cell keys that are blocked because a king occupies their row,
   * column, or 8-adjacent neighbourhood. Recomputed only when moves change.
   */
  const lockedKeys = useMemo(() => {
    const locked = new Set<string>();
    if (!N || !activePuzzle?.grid) return locked;

    for (let y = 0; y < N; y++) {
      const row = moves[y];
      if (!row) continue;

      for (let x = 0; x < N; x++) {
        if (row[x] !== KING_CELL_STATE) continue;

        // Lock row
        for (let col = 0; col < N; col++)
          if (col !== x) locked.add(coordToKey(col, y));

        // Lock column
        for (let row2 = 0; row2 < N; row2++)
          if (row2 !== y) locked.add(coordToKey(x, row2));

        // Lock adjacent cells
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;

            const nx = x + dx;
            const ny = y + dy;

            if (nx >= 0 && nx < N && ny >= 0 && ny < N) {
              locked.add(coordToKey(nx, ny));
            }
          }
        }

        // Lock same region
        const region = activePuzzle.grid[y][x];

        for (let ry = 0; ry < N; ry++) {
          for (let rx = 0; rx < N; rx++) {
            if (rx === x && ry === y) continue;

            if (activePuzzle.grid[ry][rx] === region) {
              locked.add(coordToKey(rx, ry));
            }
          }
        }
      }
    }

    return locked;
  }, [moves, N, activePuzzle]);

  // ── Derived: cell display map ────────────────────────────────────────────
  const cellDisplayMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof colorId> | undefined>();
    if (!activePuzzle?.grid || !N) return map;

    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const key = coordToKey(x, y);
        const value = activePuzzle.grid[y][x];

        if (value < 0) {
          map.set(key, undefined);
        } else {
          map.set(key, colorId(value));
        }
      }
    }

    return map;
  }, [activePuzzle, N]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const placeKing = useCallback(
    (coord: CellCoord) => {
      if (lockedKeys.has(coordToKey(coord.x, coord.y))) return;
      setGridValue(board.playState, coord, KING_CELL_STATE);
    },
    [lockedKeys, board.playState],
  );

  const paintRegion = useCallback(
    (coord: CellCoord) => {
      setValidateRegMsg(null);
      if (solution.value) solver.reset();

      customPuzzle.setValue((prev) => {
        if (!prev || !prev.grid) return prev;

        const newGrid = prev.grid.map((row) => [...row]);

        if (newGrid[coord.y] && newGrid[coord.y][coord.x] !== undefined) {
          newGrid[coord.y][coord.x] = activeRegionIndex;
        }

        return {
          ...prev,
          grid: newGrid,
        };
      });
    },
    [activeRegionIndex, customPuzzle, solution.value, solver],
  );

  const eraseRegion = useCallback(
    (coord: CellCoord) => {
      customPuzzle.setValue((prev) => {
        if (!prev?.grid) return prev;
        const grid = prev.grid.map((r) => [...r]);
        grid[coord.y][coord.x] = BLANK_CANVAS_STATE;
        return { ...prev, grid };
      });
    },
    [customPuzzle],
  );

  // ── Event handlers ───────────────────────────────────────────────────────

  const handlePointerDown = useCallback(
    (coord: CellCoord) => {
      didPaintOnDownRef.current = false;
      didDragRef.current = false;
      if (timer.elapsedTime === 0) timer.startTimer();

      if (isSolver) {
        paintRegion(coord);
        didPaintOnDownRef.current = true;
        return;
      }

      const key = coordToKey(coord.x, coord.y);
      const current = moves[coord.y]?.[coord.x] ?? EMPTY_CELL_STATE;

      // Kings and locked cells are not drag-paintable
      if (lockedKeys.has(key) || current === KING_CELL_STATE) {
        dragLockRef.current = null;
        return;
      }

      const target: KingBoardCellState =
        current === EMPTY_CELL_STATE ? MARKER_CELL_STATE : EMPTY_CELL_STATE;

      dragLockRef.current = target;
      setGridValue(board.playState, coord, target);
      didPaintOnDownRef.current = true;
    },
    [isSolver, board.playState, moves, lockedKeys, paintRegion, timer],
  );

  const handleClick = useCallback(
    (coord: CellCoord) => {
      // Suppress: already handled by pointerDown or drag
      if (didPaintOnDownRef.current || didDragRef.current) {
        didPaintOnDownRef.current = false;
        didDragRef.current = false;
        return;
      }
      if (timer.elapsedTime === 0) timer.startTimer();
      if (isSolver) return;

      const key = coordToKey(coord.x, coord.y);
      if (lockedKeys.has(key)) return;

      const current = moves[coord.y]?.[coord.x] ?? EMPTY_CELL_STATE;
      setGridValue(board.playState, coord, nextPlayState(current));
    },
    [isSolver, lockedKeys, board.playState, moves, timer],
  );

  const handleDoubleClick = useCallback(
    (coord: CellCoord) => {
      if (!isSolver) placeKing(coord);
      if (timer.elapsedTime === 0) timer.startTimer();
    },
    [isSolver, placeKing, timer],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, coord: CellCoord) => {
      e.preventDefault();
      if (timer.elapsedTime === 0) timer.startTimer();
      if (isSolver) eraseRegion(coord);
      else placeKing(coord);
    },
    [isSolver, eraseRegion, placeKing, timer],
  );

  const handleDrag = useCallback(
    (payload: DragPayload) => {
      const coord = payload.currentCoord;
      didDragRef.current = true;

      if (timer.elapsedTime === 0) timer.startTimer();
      if (isSolver) {
        paintRegion(coord);
        return;
      }

      if (dragLockRef.current === null) return;

      const key = coordToKey(coord.x, coord.y);
      if (lockedKeys.has(key)) return;

      const current = moves[coord.y]?.[coord.x] ?? EMPTY_CELL_STATE;
      if (current === KING_CELL_STATE) return;

      setGridValue(board.playState, coord, dragLockRef.current);
    },
    [isSolver, board.playState, moves, lockedKeys, paintRegion, timer],
  );

  const handleDragEnd = useCallback(() => {
    dragLockRef.current = null;
  }, []);

  // ── Render cell ──────────────────────────────────────────────────────────

  const renderCell = useCallback(
    ({ coord, cellSize: cs }: CellRenderProps) => {
      const key = coordToKey(coord.x, coord.y);
      return (
        <KingsCell
          coord={coord}
          cellSize={cs}
          bgColor={cellDisplayMap.get(key)}
          move={moves[coord.y]?.[coord.x] ?? EMPTY_CELL_STATE}
          isLocked={lockedKeys.has(key)}
        />
      );
    },
    [cellDisplayMap, moves, lockedKeys],
  );

  // ── Guard ────────────────────────────────────────────────────────────────

  if (!activePuzzle) return <EmptyGrid logo={KingsLogo} name="Kings" />;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col items-center gap-4  w-full h-full p-4">
      <div
        id={KINGS_GRID_ID}
        className="flex-1 w-full h-full grid place-items-center"
      >
        <GridWrapper
          rows={N}
          cols={N}
          cellSize={cellSize}
          dragMode="cell"
          style={{ border: `1.5px solid ${T.border2}`, background: T.bg2 }}
          onPointerDown={handlePointerDown}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          onContextMenu={handleContextMenu}
          renderCell={renderCell}
        />
      </div>

      {isSolver && customPuzzle?.value?.size && (
        <div className="flex flex-col gap-3 items-center w-full max-w-xs">
          <RegionPalette
            regionCount={customPuzzle.value.size}
            activeIndex={activeRegionIndex}
            onSelect={setActiveRegionIndex}
          />
          <div className="flex gap-2 text-sm items-start select-none">
            <button
              className="cursor-pointer rounded border px-3 py-1.5"
              style={{ color: T.accent2 }}
              onClick={() => {
                // 1. If data isn't ready, update the state to let the user know, then exit
                if (!customPuzzle.value?.grid || !customPuzzle.value?.size) {
                  setValidateRegMsg("Loading...");
                  return;
                }

                // 2. Run the validation safely using the checked values
                const { status } = validateRegions(
                  customPuzzle.value.grid,
                  customPuzzle.value.size,
                );

                // 3. Update your message state
                if (status) {
                  setValidateRegMsg(status.msg);
                }
              }}
            >
              Validate
            </button>

            <div className="text-xs">{validateRegMsg}</div>
          </div>
        </div>
      )}
    </div>
  );
}
