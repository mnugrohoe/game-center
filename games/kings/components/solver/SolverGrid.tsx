"use client";

import { REGION_FILL_SOLVER, REGION_BORDER_SOLVER } from "../../lib/utils";
import type { SolState } from "../../types";

interface SolverGridProps {
  N: number;
  grid: number[][];
  solution: SolState[][];
  painting: boolean;
  erasing: boolean;
  setPainting: (v: boolean) => void;
  setErasing: (v: boolean) => void;
  onPaint: (r: number, c: number) => void;
  onErase: (r: number, c: number) => void;
}

export function SolverGrid({
  N, grid, solution,
  painting, erasing,
  setPainting, setErasing,
  onPaint, onErase,
}: SolverGridProps) {
  const cellPx = Math.max(32, Math.min(58, Math.floor(520 / N)));

  function getBorders(r: number, c: number) {
    const reg = grid[r][c];
    return {
      top:    r === 0 || grid[r - 1]?.[c] !== reg,
      bottom: r === N - 1 || grid[r + 1]?.[c] !== reg,
      left:   c === 0 || grid[r]?.[c - 1] !== reg,
      right:  c === N - 1 || grid[r]?.[c + 1] !== reg,
    };
  }

  return (
    <div
      className="p-2 rounded-sm"
      style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(212,152,15,0.2)" }}
    >
      <div
        style={{ display: "grid", gridTemplateColumns: `repeat(${N}, ${cellPx}px)`, userSelect: "none" }}
        onMouseDown={() => setPainting(true)}
      >
        {Array.from({ length: N }, (_, r) =>
          Array.from({ length: N }, (_, c) => {
            const reg = grid[r]?.[c];
            const hasFill = reg !== undefined && reg !== -1;
            const b = hasFill ? getBorders(r, c) : null;
            const sol = solution[r]?.[c];

            return (
              <div
                key={`${r}-${c}`}
                style={{
                  width: cellPx, height: cellPx,
                  background: !hasFill ? "#161412" : REGION_FILL_SOLVER[reg % 12],
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderTop:    b?.top    ? "2.5px solid rgba(212,152,15,0.6)" : undefined,
                  borderBottom: b?.bottom ? "2.5px solid rgba(212,152,15,0.6)" : undefined,
                  borderLeft:   b?.left   ? "2.5px solid rgba(212,152,15,0.6)" : undefined,
                  borderRight:  b?.right  ? "2.5px solid rgba(212,152,15,0.6)" : undefined,
                  cursor: "crosshair",
                  position: "relative",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
                onMouseDown={e => {
                  e.preventDefault();
                  if (e.button === 2) { setErasing(true); onErase(r, c); }
                  else { setPainting(true); onPaint(r, c); }
                }}
                onMouseEnter={e => {
                  if (erasing && e.buttons) onErase(r, c);
                  else if (painting && e.buttons === 1) onPaint(r, c);
                }}
                onContextMenu={e => { e.preventDefault(); onErase(r, c); }}
              >
                {sol === "territory" && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(212,152,15,0.08)", pointerEvents: "none" }} />
                )}
                {sol === "king" && (
                  <span style={{ fontSize: "1.35rem", color: "#d4980f", filter: "drop-shadow(0 0 5px rgba(212,152,15,0.9))" }}>♛</span>
                )}
                {sol === "blocked" && (
                  <span style={{ fontSize: "1.5rem", color: "rgba(255,255,255,0.18)" }}>·</span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
