// shared/components/ui/ResponsiveGrid.tsx
"use client";

import { DivType } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import React, {
  ReactNode,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

// ─────────────────────────────────────────────
// Core types
// ─────────────────────────────────────────────

export type CellCoord = { x: number; y: number };
export type CellKey = `${number}-${number}`;

export type RectDragPayload = {
  mode: "rect";
  startCoord: CellCoord;
  currentCoord: CellCoord;
};

export type CellDragPayload = {
  mode: "cell";
  currentCoord: CellCoord;
};

export type DragPayload = RectDragPayload | CellDragPayload;

export type CellRenderProps = {
  coord: CellCoord;
  cellSize: number;
};

// ─────────────────────────────────────────────
// SwapPathOverlay types & component
// ─────────────────────────────────────────────

export type PathSegment = {
  /** Ordered "x-y" keys. */
  order: string[];
  color: string;
  /** If true, renders a filled circle at start and end. */
  showEndpoints?: boolean;
};

interface SwapPathOverlayProps {
  segments: PathSegment[];
  cellSize: number;
  gap: number;
  /** Thickness of the path line relative to cellSize (0–1). Default 0.38. */
  thickness?: number;
}

/**
 * SVG overlay that draws pipe/snake paths on top of the grid.
 * Place this as a sibling to `ResponsiveGrid` inside a `relative` container.
 *
 * The path uses cubic-bezier curves at corners so it looks smooth/rounded.
 */
export function SwapPathOverlay({
  segments,
  cellSize,
  gap,
  thickness = 0.38,
}: SwapPathOverlayProps) {
  const step = cellSize + gap;

  // Convert "x-y" key → SVG centre pixel coordinate.
  const centre = (key: string): [number, number] => {
    const [x, y] = key.split("-").map(Number);
    return [x * step + cellSize / 2, y * step + cellSize / 2];
  };

  const r = (cellSize * thickness) / 2; // stroke radius
  const strokeW = cellSize * thickness;

  /**
   * Build a smooth SVG path string for an ordered list of cell keys.
   *
   * Strategy: straight lines between centres, then round the corners
   * using quadratic bezier arcs.
   */
  function buildSvgPath(order: string[]): string {
    if (order.length === 0) return "";
    if (order.length === 1) {
      // Single cell → tiny circle via arc trick.
      const [cx, cy] = centre(order[0]);
      return `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 -${r * 2} 0`;
    }

    const pts = order.map(centre);
    const cornerR = Math.min(r * 1.2, step * 0.4); // bend radius

    let d = `M ${pts[0][0]} ${pts[0][1]}`;

    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const next = i < pts.length - 1 ? pts[i + 1] : null;

      if (!next) {
        // Last segment — straight line to end.
        d += ` L ${curr[0]} ${curr[1]}`;
        continue;
      }

      // Direction into and out of this corner.
      const dx1 = curr[0] - prev[0];
      const dy1 = curr[1] - prev[1];
      const dx2 = next[0] - curr[0];
      const dy2 = next[1] - curr[1];

      // If direction doesn't change (straight) — just pass through.
      if (dx1 === dx2 && dy1 === dy2) {
        d += ` L ${curr[0]} ${curr[1]}`;
        continue;
      }

      // Normalise.
      const len1 = Math.hypot(dx1, dy1);
      const len2 = Math.hypot(dx2, dy2);
      const ux1 = dx1 / len1;
      const uy1 = dy1 / len1;
      const ux2 = dx2 / len2;
      const uy2 = dy2 / len2;

      // Entry point (cornerR before the corner).
      const ex = curr[0] - ux1 * cornerR;
      const ey = curr[1] - uy1 * cornerR;
      // Exit point (cornerR after the corner).
      const fx = curr[0] + ux2 * cornerR;
      const fy = curr[1] + uy2 * cornerR;

      d += ` L ${ex} ${ey} Q ${curr[0]} ${curr[1]} ${fx} ${fy}`;
    }

    return d;
  }

  // Total SVG size matches grid.
  // We can't know grid size here, so we use 100% / the overlay is absolute.
  return (
    <svg
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "visible",
      }}
    >
      {segments.map((seg, i) => {
        if (seg.order.length === 0) return null;
        const d = buildSvgPath(seg.order);

        return (
          <g key={i}>
            <path
              d={d}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeW}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.85}
            />
            {seg.showEndpoints &&
              seg.order.length >= 1 &&
              (() => {
                const [sx, sy] = centre(seg.order[0]);
                const [ex, ey] = centre(seg.order[seg.order.length - 1]);
                const epR = cellSize * 0.26;
                return (
                  <>
                    <circle cx={sx} cy={sy} r={epR} fill={seg.color} />
                    {seg.order.length > 1 && (
                      <circle cx={ex} cy={ey} r={epR} fill={seg.color} />
                    )}
                  </>
                );
              })()}
          </g>
        );
      })}
    </svg>
  );
}

// ─────────────────────────────────────────────
// ResponsiveGrid
// ─────────────────────────────────────────────

export interface ResponsiveGridProps extends Omit<
  DivType,
  "onDrag" | "onDragStart" | "onDragEnd" | "onPointerDown"
> {
  rows: number;
  cols: number;
  cellSize?: number;
  gap?: number;
  dragMode?: "rect" | "cell";
  disabled?: boolean;
  className?: string;
  renderCell: (props: CellRenderProps) => ReactNode;
  onPointerDown?: (coord: CellCoord) => void;
  onDragStart?: (payload: DragPayload) => void;
  onDrag?: (payload: DragPayload) => void;
  onDragEnd?: (payload: DragPayload) => void;
}

export function GridWrapper({
  rows,
  cols,
  cellSize = 48,
  gap = 0,
  dragMode = "rect",
  disabled = false,
  className,
  renderCell,
  onPointerDown,
  onDragStart,
  onDrag,
  onDragEnd,
  style,
  ...rest
}: ResponsiveGridProps) {
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [dragStartCoord, setDragStartCoord] = useState<CellCoord | null>(null);
  const [dragCurrentCoord, setDragCurrentCoord] = useState<CellCoord | null>(
    null,
  );

  const cellCoords = useMemo<CellCoord[]>(() => {
    const coords: CellCoord[] = [];
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) coords.push({ x, y });
    return coords;
  }, [rows, cols]);

  const getCellCoordFromPointer = useCallback(
    (clientX: number, clientY: number): CellCoord | null => {
      if (!gridContainerRef.current) return null;
      const rect = gridContainerRef.current.getBoundingClientRect();
      const step = cellSize + gap;
      const x = Math.floor((clientX - rect.left) / step);
      const y = Math.floor((clientY - rect.top) / step);
      if (x < 0 || x >= cols || y < 0 || y >= rows) return null;
      return { x, y };
    },
    [cellSize, gap, cols, rows],
  );

  const createDragPayload = useCallback(
    (start: CellCoord, current: CellCoord): DragPayload =>
      dragMode === "rect"
        ? { mode: "rect", startCoord: start, currentCoord: current }
        : { mode: "cell", currentCoord: current },
    [dragMode],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (
        disabled ||
        (e.target as HTMLElement).tagName === "INPUT" ||
        (e.target as HTMLElement).tagName === "TEXTAREA"
      )
        return;

      const coord = getCellCoordFromPointer(e.clientX, e.clientY);
      if (!coord) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragStartCoord(coord);
      setDragCurrentCoord(coord);
      onPointerDown?.(coord);
      onDragStart?.(createDragPayload(coord, coord));
    },
    [
      disabled,
      getCellCoordFromPointer,
      createDragPayload,
      onPointerDown,
      onDragStart,
    ],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled || !dragStartCoord) return;
      const coord = getCellCoordFromPointer(e.clientX, e.clientY);
      if (!coord) return;
      setDragCurrentCoord(coord);
      onDrag?.(createDragPayload(dragStartCoord, coord));
    },
    [
      disabled,
      dragStartCoord,
      getCellCoordFromPointer,
      createDragPayload,
      onDrag,
    ],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (!dragStartCoord || !dragCurrentCoord) {
        setDragStartCoord(null);
        setDragCurrentCoord(null);
        return;
      }
      e.preventDefault();
      onDragEnd?.(createDragPayload(dragStartCoord, dragCurrentCoord));
      setDragStartCoord(null);
      setDragCurrentCoord(null);
    },
    [disabled, dragStartCoord, dragCurrentCoord, createDragPayload, onDragEnd],
  );

  return (
    <div
      ref={gridContainerRef}
      className={cn("grid touch-none select-none", className)}
      style={{
        gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
        width: cols * cellSize + Math.max(0, cols - 1) * gap,
        height: rows * cellSize + Math.max(0, rows - 1) * gap,
        gap,
        ...style,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      {...rest}
    >
      {cellCoords.map((coord) => (
        <React.Fragment key={`${coord.x}-${coord.y}`}>
          {renderCell({ coord, cellSize })}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// GridCell
// ─────────────────────────────────────────────

export interface GridCellProps
  extends Omit<DivType, "children">, CellRenderProps {
  children?: ReactNode;
}

export function GridCell({ coord, cellSize, style, ...rest }: GridCellProps) {
  return (
    <div
      {...rest}
      data-col={coord.x}
      data-row={coord.y}
      style={{
        width: cellSize,
        height: cellSize,
        boxSizing: "border-box",
        ...style,
      }}
    />
  );
}

// ─────────────────────────────────────────────
// GridInputCell — stores coord + value
// ─────────────────────────────────────────────

export interface GridInputCellProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">,
    CellRenderProps {
  /** Typed change handler that receives coord + new string value together. */
  onCellChange?: (coord: CellCoord, value: string) => void;
  /** Fall-through if you still need the raw event. */
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

/**
 * An `<input>` cell that exposes `onCellChange(coord, value)` so you never
 * need to separately track which cell was edited.
 *
 * `data-col` / `data-row` are set for DOM queries. `value` is controlled.
 */
export function GridInputCell({
  coord,
  cellSize,
  style,
  onCellChange,
  onChange,
  ...rest
}: GridInputCellProps) {
  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    onCellChange?.(coord, e.target.value);
    onChange?.(e);
  };

  return (
    <input
      {...rest}
      data-col={coord.x}
      data-row={coord.y}
      onChange={handleChange}
      style={{
        width: cellSize,
        height: cellSize,
        boxSizing: "border-box",
        textAlign: "center",
        ...style,
      }}
    />
  );
}
