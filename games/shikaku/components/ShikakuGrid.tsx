/**
 * games/shikaku/ShikakuGrid.tsx
 */

import { useMemo, useRef, useState } from "react";
import { colorFromIndex, T } from "@/shared/components/ui/tokens";
import LogoIcon from "./Logo";
import { ShikakuPuzzle } from "../lib/generator";
import useResponsiveCellSize from "@/shared/hooks/useResponsiveCellSize";
import { useShikakuBoardCtx } from "./ShikakuBoardContext";
import { Cell, DragState, RectBase, userRect } from "../lib/types";
import { overlaps } from "../lib/utils";
import { checkShikakuAnchor, checkShikakuComplete } from "../lib/validation";

function hashString(input: string | number) {
  if (typeof input === "number") return input;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Renders the interactive Shikaku puzzle grid.
 *
 * The grid automatically resizes its cells to fit within the
 * `#game-container` element while maintaining square cells and a
 * maximum size of 50px. It displays:
 *
 * - Puzzle anchor clues (`infos`)
 * - User-created rectangles
 * - Rectangle ownership and coloring
 * - Rectangle validity state
 * - Active drag-selection preview
 *
 * Mouse and touch interactions are delegated to the provided event
 * handlers, allowing the parent component to manage rectangle creation
 * and editing state.
 *
 *
 * @returns A responsive Shikaku grid with clue cells, rectangle overlays,
 * and optional drag preview.
 */
export default function ShikakuGrid() {
  const {
    puzzle,
    userRects,
    isSolutionVisible,
    solverSolution,
    isComplete,
    elapsedTime,
    startTimer,
    stopTimer,
    setuserRects,
  } = useShikakuBoardCtx();
  const cellSize = useResponsiveCellSize({
    rows: puzzle?.height,
    cols: puzzle?.width,
  });
  const rects: userRect[] =
    isSolutionVisible && solverSolution ? solverSolution : userRects;
  const [dragState, setDragState] = useState<DragState | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [attempt, setAttempt] = useState<number>(1);

  const disabled = isSolutionVisible || isComplete;

  const { cellOwnerMap, anchorMap, rectColorMap } = useMemo(() => {
    const cellOwnerMap = new Map<string, (typeof rects)[number]>();
    const anchorMap = new Map<string, ShikakuPuzzle["infos"][number]>();
    const rectColorMap = new Map<
      string | number,
      ReturnType<typeof colorFromIndex>
    >();

    for (const r of rects) {
      rectColorMap.set(r.id, colorFromIndex(hashString(r.id)));

      for (let y = r.y; y < r.y + r.h; y++) {
        for (let x = r.x; x < r.x + r.w; x++) {
          cellOwnerMap.set(`${x},${y}`, r);
        }
      }
    }

    if (puzzle) {
      for (const info of puzzle.infos) {
        anchorMap.set(`${info.anchor.x},${info.anchor.y}`, info);
      }
    }

    return { cellOwnerMap, anchorMap, rectColorMap };
  }, [rects, puzzle]);

  const cells = useMemo(() => {
    if (!puzzle) return [];
    const out: Array<{
      key: string;
      x: number;
      y: number;
      owner?: (typeof rects)[number];
      anchor?: (typeof puzzle.infos)[number];
      color?: ReturnType<typeof colorFromIndex>;
      valid?: boolean;
    }> = [];

    for (let y = 0; y < puzzle.height; y++) {
      for (let x = 0; x < puzzle.width; x++) {
        const key = `${x},${y}`;
        const owner = cellOwnerMap.get(key);
        const anchor = anchorMap.get(key);

        out.push({
          key,
          x,
          y,
          owner,
          anchor,
          color: owner ? rectColorMap.get(owner.id) : undefined,
          valid: owner ? owner.validAnchor : undefined,
        });
      }
    }

    return out;
  }, [puzzle, cellOwnerMap, anchorMap, rectColorMap]);

  const dragPreview = useMemo(() => {
    if (!dragState) return null;

    const x1 = Math.min(dragState.s.x, dragState.c.x);
    const y1 = Math.min(dragState.s.y, dragState.c.y);

    return {
      x: x1,
      y: y1,
      w: Math.abs(dragState.c.x - dragState.s.x) + 1,
      h: Math.abs(dragState.c.y - dragState.s.y) + 1,
    };
  }, [dragState]);

  // ── Drag ──────────────────────────────────────────────────────────────────
  function cellFromEvent(
    e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent,
  ): Cell | null {
    if (!gridRef.current || !puzzle) return null;
    const rect = gridRef.current.getBoundingClientRect();

    const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
    const cy = "touches" in e ? e.touches[0].clientY : e.clientY;

    const x = Math.floor((cx - rect.left) / cellSize);
    const y = Math.floor((cy - rect.top) / cellSize);

    if (x < 0 || y < 0 || x >= puzzle.width || y >= puzzle.height) {
      return null;
    }

    return { x, y };
  }

  function onDown(e: React.MouseEvent | React.TouchEvent) {
    if (!puzzle || isComplete || isSolutionVisible) return;
    e.preventDefault();
    if (elapsedTime === 0) startTimer();
    const c = cellFromEvent(e);
    if (c) setDragState({ s: c, c });
  }

  function onMove(e: React.MouseEvent | React.TouchEvent) {
    if (!dragState) return;
    e.preventDefault();
    const c = cellFromEvent(e);

    if (c) {
      setDragState((d) => (d ? { ...d, c } : null));
    }
  }

  function onUp(e: React.MouseEvent | React.TouchEvent) {
    if (!dragState || !puzzle) {
      setDragState(null);
      return;
    }

    e.preventDefault();

    const { s, c } = dragState;
    const dr: RectBase = {
      x: Math.min(s.x, c.x),
      y: Math.min(s.y, c.y),
      w: Math.abs(c.x - s.x) + 1,
      h: Math.abs(c.y - s.y) + 1,
    };

    setDragState(null);
    setAttempt((prev) => prev + 1);

    setuserRects((prev) => {
      const next = prev.filter((r) => !overlaps(r, dr));
      const newRect: userRect = { id: `${attempt}`, ...dr };
      newRect.validAnchor = checkShikakuAnchor(newRect, puzzle);

      const merged = dr.w * dr.h !== 1 ? [...next, newRect] : [...next];
      const isWin = checkShikakuComplete(merged, puzzle);
      if (isWin) {
        stopTimer();
        setAttempt(1);
      }

      return merged;
    });
  }

  function onLeave() {
    setDragState(null);
  }

  if (!puzzle) return <EmptyGrid />;
  const { width: W, height: H } = puzzle;

  return (
    <div className="relative inline-block">
      <div
        ref={gridRef}
        onMouseDown={disabled ? undefined : onDown}
        onMouseMove={disabled ? undefined : onMove}
        onMouseUp={disabled ? undefined : onUp}
        onMouseLeave={disabled ? undefined : onLeave}
        onTouchStart={disabled ? undefined : onDown}
        onTouchMove={disabled ? undefined : onMove}
        onTouchEnd={disabled ? undefined : onUp}
        className="grid relative overflow-hidden select-none touch-none"
        style={{
          gridTemplateColumns: `repeat(${W}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${H}, ${cellSize}px)`,
          width: W * cellSize + 3,
          height: H * cellSize + 3,
          border: `1.5px solid ${T.border2}`,
          cursor: disabled ? "default" : "crosshair",
          background: T.bg2,
        }}
      >
        {cells.map(({ key, x, y, owner, anchor, color, valid }) => {
          const bT = !owner || y === owner.y;
          const bB = !owner || y === owner.y + owner.h - 1;
          const bL = !owner || x === owner.x;
          const bR = !owner || x === owner.x + owner.w - 1;

          const defaultBorder = "rgba(255,255,255,.07)";
          const activeBorder = color ? `hsl(${color.bg} 0.88)` : defaultBorder;

          const inactiveBorder = `${valid ? 0 : 1}px solid ${defaultBorder}`;
          return (
            <div
              key={key}
              className="relative flex items-center justify-center box-border"
              style={{
                width: cellSize,
                height: cellSize,
                background: color
                  ? `hsl(${color.bg} / ${valid ? 1 : 0.2})`
                  : undefined,
                borderTop: bT ? `2px solid ${activeBorder}` : inactiveBorder,
                borderBottom: bB ? `2px solid ${activeBorder}` : inactiveBorder,
                borderLeft: bL ? `2px solid ${activeBorder}` : inactiveBorder,
                borderRight: bR ? `2px solid ${activeBorder}` : inactiveBorder,
              }}
            >
              {anchor && (
                <AnchorPip
                  value={anchor.area}
                  color={color}
                  cellSize={cellSize}
                />
              )}
            </div>
          );
        })}

        {dragPreview && (
          <div
            className="absolute rounded-sm pointer-events-none z-20 flex justify-center items-center"
            style={{
              left: dragPreview.x * cellSize,
              top: dragPreview.y * cellSize,
              width: dragPreview.w * cellSize,
              height: dragPreview.h * cellSize,
              border: `2px solid ${T.accent2}`,
              background: `${T.accent}18`,
            }}
          >
            <div
              className="z-10 flex items-center justify-center rounded-full px-1 text-slate-100"
              style={{
                fontSize: cellSize < 40 ? 10 : cellSize < 30 ? 8 : 13,
                background: `${T.accent}`,
                fontFamily: T.font,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {dragPreview.w * dragPreview.h}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AnchorPip
// ─────────────────────────────────────────────────────────────────────────────
function AnchorPip({
  value,
  cellSize,
  color,
}: {
  value: number;
  cellSize: number;
  color?: {
    bg: string;
    text: string;
  };
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
        fontSize: cellSize < 40 ? 10 : cellSize < 30 ? 7 : 13,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {value}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EmptyGrid
// ─────────────────────────────────────────────────────────────────────────────
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
