/**
 * games/shikaku/ShikakuGrid.tsx
 */

import React from "react";
import { labelColor, T } from "@/shared/components/ui/tokens";

type Point = {
  x: number;
  y: number;
};

type DragState = {
  s: Point;
  c: Point;
};

type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
};

type Anchor = {
  anchor: Point;
  area: number;
};

type Puzzle = {
  width: number;
  height: number;
  infos: Anchor[];
};

interface ShikakuGridProps {
  puzzle?: Puzzle | null;
  rects?: Rect[];
  dragState?: DragState | null;
  gridRef?: React.Ref<HTMLDivElement>;

  onDown?: React.MouseEventHandler<HTMLDivElement> &
    React.TouchEventHandler<HTMLDivElement>;

  onMove?: React.MouseEventHandler<HTMLDivElement> &
    React.TouchEventHandler<HTMLDivElement>;

  onUp?: React.MouseEventHandler<HTMLDivElement> &
    React.TouchEventHandler<HTMLDivElement>;

  onLeave?: React.MouseEventHandler<HTMLDivElement>;

  disabled?: boolean;
}

const CELL = 50;

export { CELL };

export default function ShikakuGrid({
  puzzle,
  rects = [],
  dragState = null,
  gridRef,
  onDown,
  onMove,
  onUp,
  onLeave,
  disabled = false,
}: ShikakuGridProps) {
  if (!puzzle) return <EmptyGrid />;

  const { width: W, height: H } = puzzle;

  // Build cell → label lookup
  const cellMap: Record<string, string> = {};

  for (const r of rects) {
    for (let y = r.y; y < r.y + r.h; y++) {
      for (let x = r.x; x < r.x + r.w; x++) {
        cellMap[`${x},${y}`] = r.label;
      }
    }
  }

  // Drag preview rect
  const dp = dragState
    ? {
        x: Math.min(dragState.s.x, dragState.c.x),
        y: Math.min(dragState.s.y, dragState.c.y),
        w: Math.abs(dragState.c.x - dragState.s.x) + 1,
        h: Math.abs(dragState.c.y - dragState.s.y) + 1,
      }
    : null;

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {/* Grid */}
      <div
        ref={gridRef}
        onMouseDown={disabled ? undefined : onDown}
        onMouseMove={disabled ? undefined : onMove}
        onMouseUp={disabled ? undefined : onUp}
        onMouseLeave={disabled ? undefined : onLeave}
        onTouchStart={disabled ? undefined : onDown}
        onTouchMove={disabled ? undefined : onMove}
        onTouchEnd={disabled ? undefined : onUp}
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${W}, ${CELL}px)`,
          gridTemplateRows: `repeat(${H}, ${CELL}px)`,
          width: W * CELL,
          height: H * CELL,
          position: "relative",
          border: `1.5px solid ${T.border2}`,
          borderRadius: T.radius2,
          overflow: "hidden",
          cursor: disabled ? "default" : "crosshair",
          background: T.bg2,
          userSelect: "none",
          touchAction: "none",
          boxShadow: "0 8px 40px rgba(0,0,0,.5)",
        }}
      >
        {/* Cells */}
        {Array.from({ length: H }, (_, y) =>
          Array.from({ length: W }, (_, x) => {
            const key = `${x},${y}`;
            const label = cellMap[key];
            const col = label ? labelColor(label) : null;

            // Which placed rect covers this cell?
            const r = rects.find(
              (r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h,
            );

            const bT = !r || y === r.y;
            const bB = !r || y === r.y + r.h - 1;
            const bL = !r || x === r.x;
            const bR = !r || x === r.x + r.w - 1;

            const anchor = puzzle.infos.find(
              (i) => i.anchor.x === x && i.anchor.y === y,
            );

            return (
              <div
                key={key}
                style={{
                  width: CELL,
                  height: CELL,
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: col ? `${col}20` : "rgba(255,255,255,.015)",
                  borderTop: `${bT ? 2 : 1}px solid ${
                    bT && col ? `${col}88` : "rgba(255,255,255,.07)"
                  }`,
                  borderBottom: `${bB ? 2 : 1}px solid ${
                    bB && col ? `${col}88` : "rgba(255,255,255,.07)"
                  }`,
                  borderLeft: `${bL ? 2 : 1}px solid ${
                    bL && col ? `${col}88` : "rgba(255,255,255,.07)"
                  }`,
                  borderRight: `${bR ? 2 : 1}px solid ${
                    bR && col ? `${col}88` : "rgba(255,255,255,.07)"
                  }`,
                  boxSizing: "border-box",
                }}
              >
                {anchor && (
                  <AnchorPip value={anchor.area} color={col ?? undefined} />
                )}
              </div>
            );
          }),
        )}

        {/* Drag preview overlay */}
        {dp && (
          <div
            style={{
              position: "absolute",
              left: dp.x * CELL,
              top: dp.y * CELL,
              width: dp.w * CELL,
              height: dp.h * CELL,
              border: `2px solid ${T.accent2}`,
              background: `${T.accent}18`,
              borderRadius: 3,
              pointerEvents: "none",
              zIndex: 20,
            }}
          />
        )}

        {/* Rect corner labels */}
        {rects.map((r) => (
          <div
            key={`${r.label}_lbl`}
            style={{
              position: "absolute",
              left: r.x * CELL + 4,
              top: r.y * CELL + 4,
              fontSize: 9,
              fontWeight: 800,
              color: labelColor(r.label),
              fontFamily: T.font,
              pointerEvents: "none",
              zIndex: 5,
              opacity: 0.7,
            }}
          >
            {r.label}
          </div>
        ))}
      </div>

      {/* Drag dimension hint */}
      {dp && (
        <div
          style={{
            textAlign: "center",
            marginTop: 8,
            fontSize: 11,
            fontWeight: 700,
            color: T.accent2,
            fontFamily: T.font,
          }}
        >
          {dp.w}×{dp.h} = {dp.w * dp.h}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AnchorPip
// ─────────────────────────────────────────────────────────────────────────────

interface AnchorPipProps {
  value: number;
  color?: string;
}

function AnchorPip({ value, color }: AnchorPipProps) {
  return (
    <div
      style={{
        width: CELL * 0.64,
        height: CELL * 0.64,
        borderRadius: "50%",
        background: color ? `${color}cc` : "rgba(255,255,255,.16)",
        border: `2px solid ${color || "rgba(255,255,255,.35)"}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: CELL < 40 ? 10 : 13,
        fontWeight: 800,
        color: "#fff",
        fontVariantNumeric: "tabular-nums",
        pointerEvents: "none",
        zIndex: 2,
      }}
    >
      {value}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EmptyGrid
// ─────────────────────────────────────────────────────────────────────────────

const PALETTE = [
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

function EmptyGrid() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
        gap: 14,
        color: T.text3,
        minHeight: 300,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 18px)",
          gridTemplateRows: "repeat(4, 18px)",
          gap: 2,
          opacity: 0.2,
        }}
      >
        {Array.from({ length: 16 }, (_, i) => (
          <div
            key={i}
            style={{
              borderRadius: 2,
              background: PALETTE[i % PALETTE.length],
              width: 18,
              height: 18,
            }}
          />
        ))}
      </div>

      <p
        style={{
          fontSize: 12,
          letterSpacing: 1,
          opacity: 0.5,
          textAlign: "center",
        }}
      >
        Select a difficulty and generate a puzzle
      </p>
    </div>
  );
}
