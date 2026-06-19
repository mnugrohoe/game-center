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
import { getInterpolatedHexColor } from "./tokens";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** A grid cell coordinate where `x` = column index and `y` = row index. */
export type CellCoord = { x: number; y: number };

/** Stable string key for a `CellCoord`, formatted as `"x-y"`. */
export type CellKey = `${number}-${number}`;

/** Payload for a rectangular drag selection (e.g. Shikaku). */
export type RectDragPayload = {
  mode: "rect";
  startCoord: CellCoord;
  currentCoord: CellCoord;
};

/** Payload for a single-cell drag sweep (e.g. Mambo paint mode). */
export type CellDragPayload = {
  mode: "cell";
  currentCoord: CellCoord;
};

/** Union of all drag payload shapes. */
export type DragPayload = RectDragPayload | CellDragPayload;

/** Props passed to every `renderCell` invocation. */
export type CellRenderProps = {
  coord: CellCoord;
  cellSize: number;
};

/**
 * Identifies a gap (gutter) between two adjacent cells.
 *
 * - `edge: "v"` — vertical gap to the **right** of cell `(x, y)`
 * - `edge: "h"` — horizontal gap **below** cell `(x, y)`
 */
export type GapCoord = { x: number; y: number; edge: "h" | "v" };

/** Props passed to every `renderGap` invocation. */
export type GapRenderProps = {
  gap: GapCoord;
  cellSize: number;
  gapSize: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// SwapPathOverlay
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Stroke color strategy for a {@link PathSegment}.
 *
 * - `single` — one flat color for the whole stroke.
 * - `gradient` — a `startColor → endColor` ramp anchored to the segment's
 *   **eventual full length**, not its current drawn length. Use `pct` to
 *   report how far the current draw is into that eventual length (0–1),
 *   so a path drawn at 50% progress shows exactly the first half of the
 *   full gradient — the color at any given cell stays stable as the path
 *   grows, instead of being re-stretched every time a cell is added.
 */
export type PathColorMode =
  | { type: Extract<PathColorModeType, "single">; color: string }
  | {
      type: Extract<PathColorModeType, "gradient">;
      startColor: string;
      endColor: string;
      /**
       * Progress of the current `order` length against the segment's
       * eventual full length, in the range `0–1`.
       *
       * Example: a path that will eventually span 26 cells but currently
       * has 13 drawn passes `pct = 13 / 26 = 0.5` — the visible stroke
       * then renders only the first half of the `startColor → endColor`
       * ramp, so the colors at cell 13 match what they'll be once the
       * path reaches its full 26-cell length.
       *
       * @defaultValue 1 (gradient spans the full visible stroke)
       */
      pct?: number;
    };
type PathColorModeType = "single" | "gradient";

/**
 * A single SVG path segment for {@link SwapPathOverlay}.
 *
 * @example Flat color
 * ```ts
 * const seg: PathSegment = {
 *   order: ["0-0", "1-0", "1-1"],
 *   colorMode: { type: "single", color: "#f59e0b" },
 *   showEndpoints: true,
 * };
 * ```
 *
 * @example Gradient anchored to eventual full length
 * ```ts
 * const fullLength = 26;
 * const seg: PathSegment = {
 *   order: currentOrder, // length 13
 *   colorMode: {
 *     type: "gradient",
 *     startColor: "#f59e0b",
 *     endColor: "#ef4444",
 *     pct: currentOrder.length / fullLength, // 0.5
 *   },
 * };
 * ```
 */
export type PathSegment = {
  /** Ordered `"x-y"` cell keys that form the path. */
  order: CellKey[];
  /** Stroke + endpoint color strategy. */
  colorMode: PathColorMode;
  showStartpoints?: boolean;
  /** When `true`, renders filled circles at the first and last cell. */
  showEndpoints?: boolean;
};

interface SwapPathOverlayProps {
  segments: PathSegment[];
  cellSize: number;
  gap: number;
  /**
   * Stroke thickness as a fraction of `cellSize` (0–1).
   * @defaultValue 0.38
   */
  thickness?: number;
}

/**
 * Absolute-positioned SVG overlay that renders pipe/flow paths on top of the grid.
 *
 * Mount as a **sibling** of `GridWrapper` inside a `position: relative` container.
 * The SVG is `pointer-events: none` and `overflow: visible`, so it never
 * intercepts grid interaction.
 *
 * Corners are rounded with quadratic beziers so multi-cell paths read as a
 * continuous snake/pipe rather than blocky right angles.
 *
 * @example
 * ```tsx
 * <div className="relative">
 *   <GridWrapper ... />
 *   <SwapPathOverlay segments={segments} cellSize={48} gap={4} />
 * </div>
 * ```
 */
export function SwapPathOverlay({
  segments,
  cellSize,
  gap,
  thickness = 0.38,
}: SwapPathOverlayProps) {
  const step = cellSize + gap;
  const strokeW = cellSize * thickness;
  const cornerR = ((cellSize * thickness) / 2) * 1.2;

  const centre = (key: string): [number, number] => {
    const [x, y] = key.split("-").map(Number);
    return [x * step + cellSize / 2, y * step + cellSize / 2];
  };

  /**
   * Builds an SVG `d` attribute for the given ordered key list.
   * Applies quadratic bezier corner-rounding when direction changes.
   */
  function buildPath(order: string[]): string {
    if (order.length === 0) return "";

    if (order.length === 1) {
      const [cx, cy] = centre(order[0]);
      // Gunakan diameter yang sama dengan strokeWidth agar terlihat proporsional
      const r = strokeW / 12;
      return `M ${cx},${cy} m -${r},0 a ${r},${r} 0 1,0 ${r * 2},0 a ${r},${r} 0 1,0 -${r * 2},0`;
    }

    const pts = order.map(centre);
    let d = `M ${pts[0][0]} ${pts[0][1]}`;

    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const next = pts[i + 1] ?? null;

      if (!next) {
        d += ` L ${curr[0]} ${curr[1]}`;
        continue;
      }

      const [dx1, dy1] = [curr[0] - prev[0], curr[1] - prev[1]];
      const [dx2, dy2] = [next[0] - curr[0], next[1] - curr[1]];

      // Straight line — no corner needed
      if (dx1 === dx2 && dy1 === dy2) {
        d += ` L ${curr[0]} ${curr[1]}`;
        continue;
      }

      const len1 = Math.hypot(dx1, dy1);
      const len2 = Math.hypot(dx2, dy2);
      const u1 = [dx1 / len1, dy1 / len1];
      const u2 = [dx2 / len2, dy2 / len2];
      const cr = Math.min(cornerR, step * 0.4);

      const [ex, ey] = [curr[0] - u1[0] * cr, curr[1] - u1[1] * cr];
      const [fx, fy] = [curr[0] + u2[0] * cr, curr[1] + u2[1] * cr];

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

        const { colorMode } = seg;
        const isGradient = colorMode.type === "gradient";
        const pct = isGradient ? (colorMode.pct ?? 1) : 1;

        // Render untuk Single Color
        if (!isGradient) {
          return (
            <g key={i}>
              <path
                d={buildPath(seg.order)}
                fill="none"
                stroke={colorMode.color}
                strokeWidth={strokeW}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          );
        }

        // Render untuk Gradient (Per segmen antar titik)
        return (
          <g key={i}>
            {seg.order.slice(0, -1).map((_, idx) => {
              const p1 = centre(seg.order[idx]);
              const p2 = centre(seg.order[idx + 1]);

              // Hitung warna untuk segmen ini berdasarkan progres global (pct)
              // Total panjang ramp adalah pct. Segmen saat ini berada di range [startP, endP]
              const startP = (idx / (seg.order.length - 1)) * pct;
              const endP = ((idx + 1) / (seg.order.length - 1)) * pct;

              const startCol = getInterpolatedHexColor(
                startP,
                colorMode.startColor,
                colorMode.endColor,
              );
              const endCol = getInterpolatedHexColor(
                endP,
                colorMode.startColor,
                colorMode.endColor,
              );

              const gradId = `grad-${i}-${idx}`;
              return (
                <g key={idx}>
                  <defs>
                    <linearGradient
                      id={gradId}
                      x1={p1[0]}
                      y1={p1[1]}
                      x2={p2[0]}
                      y2={p2[1]}
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop offset="0%" stopColor={startCol} />
                      <stop offset="100%" stopColor={endCol} />
                    </linearGradient>
                  </defs>
                  <line
                    x1={p1[0]}
                    y1={p1[1]}
                    x2={p2[0]}
                    y2={p2[1]}
                    stroke={`url(#${gradId})`}
                    strokeWidth={strokeW}
                    strokeLinecap="round"
                  />
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
// export function SwapPathOverlay({
//   segments,
//   cellSize,
//   gap,
//   thickness = 0.38,
// }: SwapPathOverlayProps) {
//   const step = cellSize + gap;
//   const strokeW = cellSize * thickness;
//   const cornerR = ((cellSize * thickness) / 2) * 1.2;

//   /** Maps an `"x-y"` key to its pixel centre `[cx, cy]`. */
//   const centre = (key: string): [number, number] => {
//     const [x, y] = key.split("-").map(Number);
//     return [x * step + cellSize / 2, y * step + cellSize / 2];
//   };

//   /**
//    * Builds an SVG `d` attribute for the given ordered key list.
//    * Applies quadratic bezier corner-rounding when direction changes.
//    */
//   function buildPath(order: string[]): string {
//     if (order.length === 0) return "";

//     if (order.length === 1) {
//       const [cx, cy] = centre(order[0]);
//       // Gunakan diameter yang sama dengan strokeWidth agar terlihat proporsional
//       const r = strokeW / 12;
//       return `M ${cx},${cy} m -${r},0 a ${r},${r} 0 1,0 ${r * 2},0 a ${r},${r} 0 1,0 -${r * 2},0`;
//     }

//     const pts = order.map(centre);
//     let d = `M ${pts[0][0]} ${pts[0][1]}`;

//     for (let i = 1; i < pts.length; i++) {
//       const prev = pts[i - 1];
//       const curr = pts[i];
//       const next = pts[i + 1] ?? null;

//       if (!next) {
//         d += ` L ${curr[0]} ${curr[1]}`;
//         continue;
//       }

//       const [dx1, dy1] = [curr[0] - prev[0], curr[1] - prev[1]];
//       const [dx2, dy2] = [next[0] - curr[0], next[1] - curr[1]];

//       // Straight line — no corner needed
//       if (dx1 === dx2 && dy1 === dy2) {
//         d += ` L ${curr[0]} ${curr[1]}`;
//         continue;
//       }

//       const len1 = Math.hypot(dx1, dy1);
//       const len2 = Math.hypot(dx2, dy2);
//       const u1 = [dx1 / len1, dy1 / len1];
//       const u2 = [dx2 / len2, dy2 / len2];
//       const cr = Math.min(cornerR, step * 0.4);

//       const [ex, ey] = [curr[0] - u1[0] * cr, curr[1] - u1[1] * cr];
//       const [fx, fy] = [curr[0] + u2[0] * cr, curr[1] + u2[1] * cr];

//       d += ` L ${ex} ${ey} Q ${curr[0]} ${curr[1]} ${fx} ${fy}`;
//     }

//     return d;
//   }

//   /**
//    * Computes the gradient vector `[x1, y1, x2, y2]` (in `userSpaceOnUse`
//    * pixel coordinates) for a segment so that:
//    *
//    * - the vector always starts at the path's first point, and
//    * - the vector's far end (`endColor`, offset `1`) lands exactly where
//    *   the path's eventual full length would put it — i.e. the visible
//    *   stroke only ever paints the `[0, pct]` slice of the full ramp.
//    *
//    * This is what makes the gradient "stay put" as the path grows: cell N
//    * always gets the same color regardless of how many cells are currently
//    * drawn, because the ramp is stretched to the *eventual* length and the
//    * current stroke is just a window into it.
//    */
//   function gradientVector(
//     order: string[],
//     pct: number,
//   ): [number, number, number, number] {
//     const [x1, y1] = centre(order[0]);
//     const [x2, y2] = centre(order[order.length - 1]);

//     // Guard against pct <= 0 (avoid divide-by-zero / inverted vector).
//     const safePct = pct > 0.0001 ? pct : 1;

//     const fx = x1 + (x2 - x1) / safePct;
//     const fy = y1 + (y2 - y1) / safePct;

//     return [x1, y1, fx, fy];
//   }

//   return (
//     <svg
//       aria-hidden
//       style={{
//         position: "absolute",
//         inset: 0,
//         pointerEvents: "none",
//         overflow: "visible",
//       }}
//     >
//       {segments.map((seg, i) => {
//         if (seg.order.length === 0) return null;

//         const d = buildPath(seg.order);
//         const dotColor = resolveDotColor(seg.colorMode);
//         const stroke =
//           seg.colorMode.type === "gradient" && seg.order.length >= 2
//             ? `url(#swap-path-gradient-${i})`
//             : seg.colorMode.type === "gradient"
//               ? seg.colorMode.endColor // single-cell gradient — flat fallback
//               : seg.colorMode.color;

//         const [sx, sy] = centre(seg.order[0]);
//         const [ex, ey] = centre(seg.order[seg.order.length - 1]);
//         const epR = cellSize * 0.26;

//         return (
//           <g key={i}>
//             <path
//               d={d}
//               fill={stroke}
//               stroke={stroke}
//               strokeWidth={strokeW}
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               opacity={0.85}
//             />
//             {seg.showEndpoints && (
//               <>
//                 <circle cx={sx} cy={sy} r={epR} fill={dotColor} />
//                 {seg.order.length > 1 && (
//                   <circle cx={ex} cy={ey} r={epR} fill={dotColor} />
//                 )}
//               </>
//             )}
//           </g>
//         );
//       })}
//     </svg>
//   );
// }

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
  /** Number of rows. */
  rows: number;
  /** Number of columns. */
  cols: number;
  /**
   * Pixel size of each square cell.
   * @defaultValue 48
   */
  cellSize?: number;
  /**
   * Pixel size of the gutter between cells.
   * When `> 0` and `renderGap` is provided, gap overlays are rendered.
   * @defaultValue 0
   */
  gap?: number;
  /**
   * Drag interaction mode.
   * - `"rect"` — tracks start + current coord (rubber-band selection)
   * - `"cell"` — fires on every cell entered during drag (paint/sweep)
   * @defaultValue "rect"
   */
  dragMode?: "rect" | "cell";
  /**
   * When `true`, all pointer interactions are suppressed.
   * @defaultValue false
   */
  disabled?: boolean;
  /** Renders a single cell. Called once per cell per render. */
  renderCell: (props: CellRenderProps) => ReactNode;
  /**
   * Renders a gap overlay between adjacent cells.
   * Only called when `gap > 0`.
   */
  renderGap?: (props: GapRenderProps) => ReactNode;
  /** Fired on pointer-down over a cell coordinate. */
  onPointerDown?: (coord: CellCoord) => void;
  /** Fired when a drag begins (pointer-down on a cell). */
  onDragStart?: (payload: DragPayload) => void;
  /** Fired each time the dragged pointer enters a new cell. */
  onDrag?: (payload: DragPayload) => void;
  /** Fired on pointer-up after a drag. */
  onDragEnd?: (payload: DragPayload) => void;
  /** Fired on a tap/click that did not drag across cells. */
  onClick?: (coord: CellCoord) => void;
  /** Fired on double-click over a cell. */
  onDoubleClick?: (coord: CellCoord) => void;
  /** Fired on right-click / context-menu over a cell. Caller must call `event.preventDefault()` if needed — it is NOT called automatically here. */
  onContextMenu?: (event: React.MouseEvent, coord: CellCoord) => void;
}

/**
 * Generic grid container with unified pointer interaction handling.
 *
 * Resolves raw pointer positions to `CellCoord` values, distinguishes
 * clicks from drags, and delegates rendering entirely to `renderCell`
 * and `renderGap` — making it game-agnostic.
 *
 * **Gap-area clicks** are automatically excluded from cell interactions:
 * a pointer that lands in the gutter between cells returns `null` from the
 * coordinate resolver and never fires `onClick` or drag callbacks. This lets
 * `renderGap` children handle their own click events independently.
 *
 * **Click vs. drag**: `onClick` only fires if the pointer never crossed into
 * a different cell between pointerdown and pointerup. Any cell-to-cell
 * movement suppresses the click in favor of `onDragEnd`.
 *
 * @example
 * ```tsx
 * <GridWrapper
 *   rows={6} cols={6} cellSize={52} gap={12}
 *   dragMode="cell"
 *   onClick={coord => dispatch({ type: "TOGGLE", coord })}
 *   renderCell={({ coord, cellSize }) => <MyCell coord={coord} size={cellSize} />}
 *   renderGap={({ gap, gapSize }) => <MyGap gap={gap} size={gapSize} />}
 * />
 * ```
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
  renderGap,
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
  const containerRef = useRef<HTMLDivElement>(null);
  const hasDraggedRef = useRef(false);
  const [dragStart, setDragStart] = useState<CellCoord | null>(null);
  const [dragCurrent, setDragCurrent] = useState<CellCoord | null>(null);

  // ── Coordinate resolution ────────────────────────────────────────────────

  /**
   * Converts a pointer's client coordinates to a `CellCoord`.
   *
   * Returns `null` when the pointer is:
   * - outside the grid bounds
   * - over a gap area between cells (when `gap > 0`)
   */
  const resolveCoord = useCallback(
    (clientX: number, clientY: number): CellCoord | null => {
      if (!containerRef.current) return null;
      const rect = containerRef.current.getBoundingClientRect();
      const step = cellSize + gap;
      const relX = clientX - rect.left;
      const relY = clientY - rect.top;

      // Outside the grid entirely (covers negative coords too, since a
      // negative relX/relY always fails one of these bounds checks before
      // the modulo below ever runs).
      if (relX < 0 || relY < 0 || relX >= cols * step || relY >= rows * step)
        return null;

      // Reject pointers that land in a gutter.
      if (gap > 0 && (relX % step > cellSize || relY % step > cellSize))
        return null;

      const x = Math.floor(relX / step);
      const y = Math.floor(relY / step);
      if (x < 0 || x >= cols || y < 0 || y >= rows) return null;
      return { x, y };
    },
    [cellSize, gap, cols, rows],
  );

  // ── Drag payload factory ─────────────────────────────────────────────────

  const makeDragPayload = useCallback(
    (start: CellCoord, current: CellCoord): DragPayload =>
      dragMode === "rect"
        ? { mode: "rect", startCoord: start, currentCoord: current }
        : { mode: "cell", currentCoord: current },
    [dragMode],
  );

  // ── Pointer handlers ─────────────────────────────────────────────────────

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const coord = resolveCoord(e.clientX, e.clientY);
      if (!coord) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      hasDraggedRef.current = false;
      setDragStart(coord);
      setDragCurrent(coord);
      onPointerDown?.(coord);
      onDragStart?.(makeDragPayload(coord, coord));
    },
    [disabled, resolveCoord, makeDragPayload, onPointerDown, onDragStart],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled || !dragStart) return;
      const coord = resolveCoord(e.clientX, e.clientY);
      if (!coord) return;
      if (coord.x === dragCurrent?.x && coord.y === dragCurrent?.y) return;
      hasDraggedRef.current = true;
      setDragCurrent(coord);
      onDrag?.(makeDragPayload(dragStart, coord));
    },
    [disabled, dragStart, dragCurrent, resolveCoord, makeDragPayload, onDrag],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (!dragStart || !dragCurrent) {
        setDragStart(null);
        setDragCurrent(null);
        return;
      }
      e.preventDefault();
      onDragEnd?.(makeDragPayload(dragStart, dragCurrent));
      setDragStart(null);
      setDragCurrent(null);
    },
    [disabled, dragStart, dragCurrent, makeDragPayload, onDragEnd],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled || hasDraggedRef.current) return;
      const coord = resolveCoord(e.clientX, e.clientY);
      if (!coord) return;
      onClick?.(coord);
    },
    [disabled, resolveCoord, onClick],
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      const coord = resolveCoord(e.clientX, e.clientY);
      if (!coord) return;
      onDoubleClick?.(coord);
    },
    [disabled, resolveCoord, onDoubleClick],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      const coord = resolveCoord(e.clientX, e.clientY);
      if (!coord) return;
      onContextMenu?.(e, coord);
    },
    [disabled, resolveCoord, onContextMenu],
  );

  // ── Precomputed coord lists ──────────────────────────────────────────────

  const cellCoords = useMemo<CellCoord[]>(() => {
    const out: CellCoord[] = [];
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) out.push({ x, y });
    return out;
  }, [rows, cols]);

  const gapCoords = useMemo<GapCoord[]>(() => {
    if (!renderGap || gap <= 0) return [];
    const out: GapCoord[] = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (x < cols - 1) out.push({ x, y, edge: "v" });
        if (y < rows - 1) out.push({ x, y, edge: "h" });
      }
    }
    return out;
  }, [rows, cols, gap, renderGap]);

  // ── Render ───────────────────────────────────────────────────────────────

  const step = cellSize + gap;

  return (
    <div
      ref={containerRef}
      className={cn("grid touch-none select-none relative", className)}
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
      {/* Gap overlays — absolute, rendered before cells so cells sit on top */}
      {gapCoords.map((g) => {
        const left = g.edge === "v" ? (g.x + 1) * step - gap : g.x * step;
        const top = g.edge === "h" ? (g.y + 1) * step - gap : g.y * step;

        return (
          <div
            key={`gap-${g.edge}-${g.x}-${g.y}`}
            className="absolute select-none flex items-center justify-center"
            style={{
              left,
              top,
              width: g.edge === "v" ? gap : cellSize,
              height: g.edge === "h" ? gap : cellSize,
            }}
          >
            {renderGap!({ gap: g, cellSize, gapSize: gap })}
          </div>
        );
      })}

      {/* Cells */}
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
 * A single grid cell `<div>`.
 *
 * Sets `data-col` / `data-row` attributes for debugging and enforces
 * `box-sizing: border-box` so borders never break grid layout.
 *
 * @example
 * ```tsx
 * <GridCell coord={{ x: 2, y: 3 }} cellSize={48} className="border rounded" />
 * ```
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
  /**
   * Convenience handler that receives the cell coordinate alongside the new value.
   * Fired before `onChange`.
   */
  onCellChange?: (coord: CellCoord, value: string) => void;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

/**
 * A controlled `<input>` cell for grid-based text/number entry (e.g. Shikaku clues).
 *
 * Provides `onCellChange(coord, value)` so callers never need to
 * separately track which cell was edited.
 *
 * @example
 * ```tsx
 * <GridInputCell
 *   coord={{ x: 1, y: 2 }}
 *   cellSize={52}
 *   value={clue}
 *   onCellChange={(coord, val) => setClue(coord, val)}
 * />
 * ```
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

// ─────────────────────────────────────────────────────────────────────────────
// EmptyGrid
// ─────────────────────────────────────────────────────────────────────────────

export type LogoIconProps = {
  size?: SizeType;
};

/**
 * Full-area placeholder shown when no puzzle has been generated yet.
 *
 * Renders the game's logo, an optional display name, and a prompt
 * directing the user to generate a puzzle.
 *
 * @example
 * ```tsx
 * if (!puzzle) return <EmptyGrid logo={KingsLogo} name="Kings" />;
 * ```
 */
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
