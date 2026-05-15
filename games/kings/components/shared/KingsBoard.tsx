"use client";

import { useKingsBoardCtx } from "../../context/KingsBoardContext";
import { calcHasConflict } from "../../hooks/useKingsBoard";
import { REG_FILL } from "../../lib/utils";

interface KingsBoardProps {
  cellPx: number;
}

export function KingsBoard({ cellPx }: KingsBoardProps) {
  const {
    grid, N, cellStates, autoLocked, territory,
    handleLeftClick, handleDoubleClick, handleRightClick,
  } = useKingsBoardCtx();

  if (!grid || N === 0) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${N}, ${cellPx}px)`,
      }}
    >
      {Array.from({ length: N }, (_, r) =>
        Array.from({ length: N }, (_, c) => {
          const reg = grid[r][c];
          const borders = {
            top:    r === 0 || grid[r - 1]?.[c] !== reg,
            bottom: r === N - 1 || grid[r + 1]?.[c] !== reg,
            left:   c === 0 || grid[r]?.[c - 1] !== reg,
            right:  c === N - 1 || grid[r]?.[c + 1] !== reg,
          };
          const st = cellStates[r]?.[c] ?? 0;
          const locked = autoLocked[r]?.[c];
          const inTerr = territory[r]?.[c];
          const conflict = st === 2 && calcHasConflict(cellStates, grid, r, c, N);

          return (
            <div
              key={`${r}-${c}`}
              data-board-cell={`${r}-${c}`}
              onClick={() => handleLeftClick(r, c)}
              onDoubleClick={() => handleDoubleClick(r, c)}
              onContextMenu={e => handleRightClick(e, r, c)}
              style={{
                width: cellPx,
                height: cellPx,
                background: conflict ? "#250e0e" : REG_FILL[reg % 12],
                border: "0.5px solid rgba(255,255,255,0.04)",
                borderTop:    borders.top    ? "2.5px solid rgba(201,168,76,0.55)" : undefined,
                borderBottom: borders.bottom ? "2.5px solid rgba(201,168,76,0.55)" : undefined,
                borderLeft:   borders.left   ? "2.5px solid rgba(201,168,76,0.55)" : undefined,
                borderRight:  borders.right  ? "2.5px solid rgba(201,168,76,0.55)" : undefined,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: locked && st === 0 ? "default" : "pointer",
                position: "relative",
                userSelect: "none",
                transition: "filter 0.1s, box-shadow 0.2s",
              }}
            >
              {inTerr && st === 0 && !locked && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(201,168,76,0.07)", pointerEvents: "none" }} />
              )}
              {locked && st === 0 && (
                <span style={{ fontSize: "1.4rem", color: "rgba(255,255,255,0.18)" }}>·</span>
              )}
              {st === 1 && (
                <span style={{ fontSize: "0.85rem", color: "rgba(212,196,154,0.3)", fontWeight: 700 }}>✕</span>
              )}
              {st === 2 && (
                <span style={{ fontSize: "1.3rem", color: "#e8c96a", textShadow: "0 0 8px rgba(201,168,76,0.8)" }}>♛</span>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
