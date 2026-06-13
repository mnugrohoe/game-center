// shared/components/ui/Grid.tsx
"use client";

import { SizeType } from "@/shared/theme/logo";
import { DivType } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import React, {
  ReactNode,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Core types
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// SwapPathOverlay
// ─────────────────────────────────────────────────────────────────────────────

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
 * Place this as a sibling to `GridWrapper` inside a `relative` container.
 */
export function SwapPathOverlay({
  segments,
  cellSize,
  gap,
  thickness = 0.38,
}: SwapPathOverlayProps) {
  const step = cellSize + gap;

  const centre = (key: string): [number, number] => {
    const [x, y] = key.split("-").map(Number);
    return [x * step + cellSize / 2, y * step + cellSize / 2];
  };

  const r = (cellSize * thickness) / 2;
  const strokeW = cellSize * thickness;

  function buildSvgPath(order: string[]): string {
    if (order.length === 0) return "";
    if (order.length === 1) {
      const [cx, cy] = centre(order[0]);
      return `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 -${r * 2} 0`;
    }

    const pts = order.map(centre);
    const cornerR = Math.min(r * 1.2, step * 0.4);

    let d = `M ${pts[0][0]} ${pts[0][1]}`;

    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const next = i < pts.length - 1 ? pts[i + 1] : null;

      if (!next) {
        d += ` L ${curr[0]} ${curr[1]}`;
        continue;
      }

      const dx1 = curr[0] - prev[0];
      const dy1 = curr[1] - prev[1];
      const dx2 = next[0] - curr[0];
      const dy2 = next[1] - curr[1];

      if (dx1 === dx2 && dy1 === dy2) {
        d += ` L ${curr[0]} ${curr[1]}`;
        continue;
      }

      const len1 = Math.hypot(dx1, dy1);
      const len2 = Math.hypot(dx2, dy2);
      const ux1 = dx1 / len1;
      const uy1 = dy1 / len1;
      const ux2 = dx2 / len2;
      const uy2 = dy2 / len2;

      const ex = curr[0] - ux1 * cornerR;
      const ey = curr[1] - uy1 * cornerR;
      const fx = curr[0] + ux2 * cornerR;
      const fy = curr[1] + uy2 * cornerR;

      d += ` L ${ex} ${ey} Q ${curr[0]} ${curr[1]} ${fx} ${fy}`;
    }

    return d;
  }

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

// ─────────────────────────────────────────────────────────────────────────────
// GridWrapper
// ─────────────────────────────────────────────────────────────────────────────

export interface GridWrapperProps extends Omit<
  DivType,
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
  | "onPointerDown"
  | "onClick"
  | "onDoubleClick"
  | "onContextMenu"
> {
  rows: number;
  cols: number;
  cellSize?: number;
  gap?: number;
  dragMode?: "rect" | "cell";
  disabled?: boolean;
  className?: string;
  renderCell: (props: CellRenderProps) => ReactNode;
  /** Fired on pointer-down with the cell coordinate. */
  onPointerDown?: (coord: CellCoord) => void;
  /** Fired when drag begins and on every subsequent pointer-move. */
  onDragStart?: (payload: DragPayload) => void;
  onDrag?: (payload: DragPayload) => void;
  /** Fired on pointer-up after a drag. */
  onDragEnd?: (payload: DragPayload) => void;
  /** Click (no-drag) on a cell. */
  onClick?: (coord: CellCoord) => void;
  /** Double-click on a cell. */
  onDoubleClick?: (coord: CellCoord) => void;
  /** Right-click / context-menu on a cell. */
  onContextMenu?: (e: React.MouseEvent, coord: CellCoord) => void;
}

/**
 * Generic grid container that handles pointer capture, drag tracking, and
 * cell-coordinate resolution. Renders an N×M grid via `renderCell`.
 *
 * All interaction callbacks receive `CellCoord` so callers never need to
 * compute grid positions from raw pixel events.
 */
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
  onClick,
  onDoubleClick,
  onContextMenu,
  style,
  ...rest
}: GridWrapperProps) {
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [dragStartCoord, setDragStartCoord] = useState<CellCoord | null>(null);
  const [dragCurrentCoord, setDragCurrentCoord] = useState<CellCoord | null>(
    null,
  );

  /** Whether the pointer has moved at least one cell since pointer-down. */
  const hasDraggedRef = useRef(false);

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
      if (disabled) return;
      // Only handle primary button (left-click / touch).
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const coord = getCellCoordFromPointer(e.clientX, e.clientY);
      if (!coord) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      hasDraggedRef.current = false;
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
      // Only fire drag callback when the cell actually changes.
      if (coord.x === dragCurrentCoord?.x && coord.y === dragCurrentCoord?.y)
        return;
      hasDraggedRef.current = true;
      setDragCurrentCoord(coord);
      onDrag?.(createDragPayload(dragStartCoord, coord));
    },
    [
      disabled,
      dragStartCoord,
      dragCurrentCoord,
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
      const payload = createDragPayload(dragStartCoord, dragCurrentCoord);
      onDragEnd?.(payload);
      setDragStartCoord(null);
      setDragCurrentCoord(null);
    },
    [disabled, dragStartCoord, dragCurrentCoord, createDragPayload, onDragEnd],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled || hasDraggedRef.current) return;
      const coord = getCellCoordFromPointer(e.clientX, e.clientY);
      if (!coord) return;
      onClick?.(coord);
    },
    [disabled, getCellCoordFromPointer, onClick],
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      const coord = getCellCoordFromPointer(e.clientX, e.clientY);
      if (!coord) return;
      onDoubleClick?.(coord);
    },
    [disabled, getCellCoordFromPointer, onDoubleClick],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      const coord = getCellCoordFromPointer(e.clientX, e.clientY);
      if (!coord) return;
      onContextMenu?.(e, coord);
    },
    [disabled, getCellCoordFromPointer, onContextMenu],
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
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
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

// ─────────────────────────────────────────────────────────────────────────────
// GridCell
// ─────────────────────────────────────────────────────────────────────────────

export interface GridCellProps
  extends Omit<DivType, "children">, CellRenderProps {
  children?: ReactNode;
}

/**
 * A single grid cell `<div>`. Sets `data-col` / `data-row` and enforces
 * `box-sizing: border-box` so borders never break the layout.
 */
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

// ─────────────────────────────────────────────────────────────────────────────
// GridInputCell
// ─────────────────────────────────────────────────────────────────────────────

export interface GridInputCellProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">,
    CellRenderProps {
  /** Typed change handler that receives coord + new string value together. */
  onCellChange?: (coord: CellCoord, value: string) => void;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

/**
 * A controlled `<input>` cell. Exposes `onCellChange(coord, value)` so
 * callers never need to separately track which cell was edited.
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

export type LogoIconProps = {
  size?: SizeType;
};

export function EmptyGrid({
  logo: Logo,
  name,
}: {
  logo: React.ComponentType<LogoIconProps>;
  name?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 w-full h-full">
      <Logo size="2xl" />
      {name && <p className="text-lg uppercase">{name} Games</p>}
      <p className="text-xs tracking-widest opacity-50 text-center">
        Select a difficulty and generate a puzzle
      </p>
    </div>
  );
}
