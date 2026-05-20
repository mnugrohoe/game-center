"use client";

import type { CellValue, Constraint } from "../../types";

const SUN = "☀";
const MOON = "◑";

const CELL = 50;
const GAP = 10;
const EH = 14; // edge hit area

interface MamboBoardProps {
  grid: CellValue[][];
  constraints: Constraint[];
  size: number;
  onCellClick?: ((r: number, c: number) => void) | null;
  onEdgeClick?:
    | ((r1: number, c1: number, r2: number, c2: number) => void)
    | null;
  lockedCells?: Set<number>;
  errorCells?: Set<number>;
  completedRows?: Set<number>;
  completedCols?: Set<number>;
}

export function MamboBoard({
  grid,
  constraints,
  size,
  onCellClick,
  onEdgeClick,
  lockedCells,
  errorCells,
  completedRows,
  completedCols,
}: MamboBoardProps) {
  const total = size * (CELL + GAP) - GAP;

  function getCn(r1: number, c1: number, r2: number, c2: number) {
    return constraints.find(
      (cn) => cn.r1 === r1 && cn.c1 === c1 && cn.r2 === r2 && cn.c2 === c2,
    );
  }

  function cellCls(r: number, c: number): string {
    const val = grid[r]?.[c] ?? 0;
    const lock = lockedCells?.has(r * size + c);
    const err = errorCells?.has(r * size + c);
    const done =
      (completedRows?.has(r) || completedCols?.has(c)) && !err && val;

    let cls =
      "absolute flex items-center justify-center rounded-[9px] border-[1.5px] select-none transition-all duration-100";

    if (lock) {
      cls += " cursor-default";
    } else {
      cls += " cursor-pointer hover:scale-[1.05]";
    }

    if (err) {
      cls += " !border-red-500 !bg-[#24091a] animate-[errpulse_0.4s_ease]";
    } else if (val === 1) {
      cls += lock
        ? " bg-[#231e0c] border-[#f5c842]"
        : " bg-[#231e0c] border-[#c9a030]";
    } else if (val === 2) {
      cls += lock
        ? " bg-[#17102a] border-[#a78bfa]"
        : " bg-[#17102a] border-[#8060c8]";
    } else {
      cls += " bg-[#1a192a] border-[#22203a] hover:border-[#38364e]";
    }

    if (done) cls += " opacity-50";

    return cls;
  }

  return (
    <div className="p-3.5 bg-[#120f1c] rounded-[18px] border border-[#22203a] overflow-auto max-w-full">
      <div style={{ width: total, height: total, position: "relative" }}>
        {/* ── Cells ── */}
        {Array.from({ length: size }, (_, r) =>
          Array.from({ length: size }, (_, c) => {
            const val = grid[r]?.[c] ?? 0;
            return (
              <div
                key={`${r}-${c}`}
                className={cellCls(r, c)}
                style={{
                  left: c * (CELL + GAP),
                  top: r * (CELL + GAP),
                  width: CELL,
                  height: CELL,
                }}
                onClick={() =>
                  onCellClick &&
                  !lockedCells?.has(r * size + c) &&
                  onCellClick(r, c)
                }
              >
                <span
                  className={`text-[1.3rem] leading-none pointer-events-none ${
                    val === 1
                      ? "text-[#f5c842]"
                      : val === 2
                        ? "text-[#a78bfa]"
                        : ""
                  }`}
                >
                  {val === 1 ? SUN : val === 2 ? MOON : ""}
                </span>
              </div>
            );
          }),
        )}

        {/* ── Horizontal edges (same row, adjacent columns) ── */}
        {Array.from({ length: size }, (_, r) =>
          Array.from({ length: size - 1 }, (_, c) => {
            const cn = getCn(r, c, r, c + 1);
            return (
              <div
                key={`h${r}-${c}`}
                className={`absolute flex items-center justify-center z-10 cursor-pointer transition-opacity ${
                  cn
                    ? cn.type === "="
                      ? "opacity-100"
                      : "opacity-100"
                    : "opacity-0 hover:opacity-50 hover:bg-[#38364e] hover:rounded-sm"
                }`}
                style={{
                  left: c * (CELL + GAP) + CELL,
                  top: r * (CELL + GAP) + CELL / 2 - EH / 2,
                  width: GAP,
                  height: EH,
                }}
                onClick={() => onEdgeClick && onEdgeClick(r, c, r, c + 1)}
              >
                {cn && (
                  <span
                    className={`text-[0.6rem] font-bold pointer-events-none leading-none ${
                      cn.type === "=" ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {cn.type === "=" ? "=" : "×"}
                  </span>
                )}
              </div>
            );
          }),
        )}

        {/* ── Vertical edges (same column, adjacent rows) ── */}
        {Array.from({ length: size - 1 }, (_, r) =>
          Array.from({ length: size }, (_, c) => {
            const cn = getCn(r, c, r + 1, c);
            return (
              <div
                key={`v${r}-${c}`}
                className={`absolute flex items-center justify-center z-10 cursor-pointer transition-opacity ${
                  cn
                    ? "opacity-100"
                    : "opacity-0 hover:opacity-50 hover:bg-[#38364e] hover:rounded-sm"
                }`}
                style={{
                  left: c * (CELL + GAP) + CELL / 2 - EH / 2,
                  top: r * (CELL + GAP) + CELL,
                  width: EH,
                  height: GAP,
                }}
                onClick={() => onEdgeClick && onEdgeClick(r, c, r + 1, c)}
              >
                {cn && (
                  <span
                    className={`text-[0.6rem] font-bold pointer-events-none leading-none ${
                      cn.type === "=" ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {cn.type === "=" ? "=" : "×"}
                  </span>
                )}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}
