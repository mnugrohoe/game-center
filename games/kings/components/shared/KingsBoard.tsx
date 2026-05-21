"use client";
/**
 * games/kings/components/shared/KingsBoard.tsx
 *
 * The interactive board grid.
 * - Static structure → Tailwind classes
 * - Dynamic colors (region fills, conflict) → inline style with CSS vars
 */
import { useKingsBoardCtx } from "../../context/KingsBoardContext";
import { calcHasConflict }  from "../../hooks/useKingsBoard";
import { REG_FILL }         from "../../lib/constants";

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
          const reg      = grid[r][c];
          const st       = cellStates[r]?.[c] ?? 0;
          const locked   = autoLocked[r]?.[c];
          const inTerr   = territory[r]?.[c];
          const conflict = st === 2 && calcHasConflict(cellStates, grid, r, c, N);

          // Region border: bold gold where region changes, hairline otherwise
          const bTop    = r === 0         || grid[r-1]?.[c] !== reg;
          const bBottom = r === N - 1     || grid[r+1]?.[c] !== reg;
          const bLeft   = c === 0         || grid[r]?.[c-1] !== reg;
          const bRight  = c === N - 1     || grid[r]?.[c+1] !== reg;

          return (
            <div
              key={`${r}-${c}`}
              data-board-cell={`${r}-${c}`}
              onClick={() => handleLeftClick(r, c)}
              onDoubleClick={() => handleDoubleClick(r, c)}
              onContextMenu={(e) => handleRightClick(e, r, c)}
              className={[
                "relative flex items-center justify-center select-none",
                locked && st === 0 ? "cursor-default" : "cursor-pointer",
              ].join(" ")}
              style={{
                width:        cellPx,
                height:       cellPx,
                background:   conflict ? "#250e0e" : REG_FILL[reg % 12],
                border:       "0.5px solid rgba(255,255,255,0.04)",
                borderTop:    bTop    ? "2.5px solid rgba(201,168,76,0.55)" : undefined,
                borderBottom: bBottom ? "2.5px solid rgba(201,168,76,0.55)" : undefined,
                borderLeft:   bLeft   ? "2.5px solid rgba(201,168,76,0.55)" : undefined,
                borderRight:  bRight  ? "2.5px solid rgba(201,168,76,0.55)" : undefined,
                transition:   "filter 0.1s",
              }}
            >
              {/* Territory tint */}
              {inTerr && st === 0 && !locked && (
                <div className="absolute inset-0 bg-gold-700 pointer-events-none" />
              )}

              {/* Auto-locked dot */}
              {locked && st === 0 && (
                <span className="text-[1.4rem] text-ghost">·</span>
              )}

              {/* Mark × */}
              {st === 1 && (
                <span className="text-[0.85rem] font-bold text-ghost">✕</span>
              )}

              {/* King ♛ */}
              {st === 2 && (
                <span
                  className="text-[1.3rem] text-gold-100"
                  style={{ textShadow: "0 0 8px rgba(201,168,76,0.8)" }}
                >
                  ♛
                </span>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
